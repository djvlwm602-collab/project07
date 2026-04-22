/**
 * Role: /api/critique POST — 6명 리뷰어를 단일 Gemini 호출로 SSE 스트리밍
 * Key Features: streamMergedReviewers 1회 호출, 버퍼 raw chunk를 merged-chunk 이벤트로 중계,
 *               완료 시 merged-done(파싱된 reviewers 맵)
 * Dependencies: @/lib/personas, @/lib/gemini-merged, @/lib/gemini-mock, @/lib/sse
 * Notes: 과거 per-persona chunk/done 이벤트 경로는 types.ts에 하위 호환으로 남아있으나 이 엔드포인트는 이제 merged 경로만 사용.
 *        이미지 유효성 검증은 클라이언트(lib/image.ts) 전담.
 */
import { NextRequest } from "next/server"
import { ALL_PERSONA_IDS } from "@/lib/personas"
import { extractImageInput } from "@/lib/gemini"
import { streamMergedReviewers, parseMergedResponse } from "@/lib/gemini-merged"
import { mockMergedStream } from "@/lib/gemini-mock"
import { writeSSE, SSE_HEADERS } from "@/lib/sse"
import type { PersonaId } from "@/lib/types"

// .env.local의 MOCK_CRITIQUE=1 플래그 — 실제 Gemini 호출 우회하고 더미 스트림 반환
const USE_MOCK = process.env.MOCK_CRITIQUE === "1"

export const runtime = "nodejs"
export const maxDuration = 60

// Gemini SDK 에러 원문은 URL·스택이 섞여 길기 때문에 카드에 그대로 뿌리면 UI가 깨짐
// 대표적인 케이스만 사용자 친화적 한국어로 매핑하고 나머지는 짧게 잘라 내보냄
function humanizeError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err)
  const lower = raw.toLowerCase()
  if (raw.includes("429") || lower.includes("quota") || lower.includes("rate limit") || lower.includes("too many")) {
    return "Gemini API 일일 한도를 초과했어요. 잠시 후 다시 시도해 주세요."
  }
  if (lower.includes("timeout") || lower.includes("timed out") || lower.includes("deadline")) {
    return "응답 시간이 너무 오래 걸려요. 다시 시도해 주세요."
  }
  if (lower.includes("safety") || lower.includes("blocked")) {
    return "안전 정책에 의해 응답이 차단됐어요."
  }
  if (raw.includes("401") || raw.includes("403") || lower.includes("api key")) {
    return "API 키 인증에 실패했어요. 환경 설정을 확인해 주세요."
  }
  const firstLine = raw.split("\n")[0].trim()
  return firstLine.length > 120 ? firstLine.slice(0, 117) + "…" : firstLine
}

type RequestBody = {
  imageDataUrl: string
  context: string
  personaIds: PersonaId[]
}

export async function POST(req: NextRequest) {
  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return new Response("Invalid JSON", { status: 400 })
  }

  const { imageDataUrl, context, personaIds } = body
  if (!imageDataUrl || !Array.isArray(personaIds) || personaIds.length === 0) {
    return new Response("Missing fields", { status: 400 })
  }

  // 잘못된 ID 필터
  const validIds = personaIds.filter((id): id is PersonaId =>
    ALL_PERSONA_IDS.includes(id as PersonaId)
  )
  if (validIds.length === 0) {
    return new Response("No valid persona ids", { status: 400 })
  }

  let imageInput
  try {
    imageInput = extractImageInput(imageDataUrl)
  } catch {
    return new Response("Invalid image data URL", { status: 400 })
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = ""
      try {
        const source = USE_MOCK
          ? mockMergedStream()
          : streamMergedReviewers(context, imageInput, validIds)

        for await (const chunk of source) {
          buffer += chunk
          writeSSE(controller, { type: "merged-chunk", chunk })
        }

        // 최종 파싱: partial-json이 중간 실패해도 여기서 확정값 추출
        const reviewers = parseMergedResponse(buffer)
        writeSSE(controller, { type: "merged-done", final: { reviewers } })
        controller.close()
      } catch (err) {
        // 개발 진단: merged 스트림 실패 원인 추적
        console.error(`[critique] merged stream failed:`, err)
        writeSSE(controller, { type: "error", persona: "all", message: humanizeError(err) })
        controller.close()
      }
    },
  })

  return new Response(stream, { headers: SSE_HEADERS })
}
