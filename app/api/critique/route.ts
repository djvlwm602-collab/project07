/**
 * Role: /api/critique POST 엔드포인트 — 게이트키퍼 검증 후 선택된 리뷰어를 병렬 SSE 스트리밍
 * Key Features: 입력 검증, runGatekeeper, streamPersonaResponse 병렬 호출, SSE chunk/done/error/rejected 이벤트
 * Dependencies: @/lib/personas, @/lib/gemini, @/lib/sse, @/lib/types
 * Notes: Edge runtime은 일부 SDK 비호환 가능 — Node runtime 권장 (로컬 개발 안정)
 */
// app/api/critique/route.ts
import { NextRequest } from "next/server"
import { ALL_PERSONA_IDS, getPersona } from "@/lib/personas"
import {
  extractImageInput,
  runGatekeeper,
  streamPersonaResponse,
  parsePersonaResponse,
} from "@/lib/gemini"
import { mockGatekeeper, mockPersonaStream } from "@/lib/gemini-mock"
import { writeSSE, SSE_HEADERS } from "@/lib/sse"
import type { PersonaId, PersonaResponse } from "@/lib/types"

// .env.local의 MOCK_CRITIQUE=1 플래그 — 실제 Gemini 호출을 우회하고 더미 스트림을 반환
// UI 테스트 중 API 한도 소모 없이 전체 플로우 확인 가능. production에 플래그 없으면 기존 동작.
const USE_MOCK = process.env.MOCK_CRITIQUE === "1"

// Edge runtime은 일부 SDK 비호환 가능 — Node runtime 권장 (로컬 개발 안정)
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
  // 기본: 첫 줄만, 최대 120자
  const firstLine = raw.split("\n")[0].trim()
  return firstLine.length > 120 ? firstLine.slice(0, 117) + "…" : firstLine
}

type RequestBody = {
  imageDataUrl: string
  context: string
  personaIds: PersonaId[]
  skipGatekeeper?: boolean // 잠금 해제로 단일 리뷰어 호출 시 사용 (이미 검증됨)
}

export async function POST(req: NextRequest) {
  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return new Response("Invalid JSON", { status: 400 })
  }

  const { imageDataUrl, context, personaIds, skipGatekeeper } = body
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
      try {
        // 1. 게이트키퍼 (skip 가능) — MOCK 모드면 실제 호출 우회
        if (!skipGatekeeper) {
          const gate = USE_MOCK
            ? await mockGatekeeper()
            : await runGatekeeper(context, imageInput)
          if (!gate.valid) {
            writeSSE(controller, {
              type: "rejected",
              reason: gate.reason ?? "이 이미지로는 디자인 크리틱이 어려워요.",
              suggestion: gate.suggestion,
            })
            controller.close()
            return
          }
        }

        // 2. 선택된 리뷰어(단일 또는 복수) 병렬 스트리밍 — MOCK 모드면 더미 스트림
        await Promise.all(
          validIds.map(async (id) => {
            const persona = getPersona(id)
            let buffer = ""
            try {
              const stream = USE_MOCK
                ? mockPersonaStream(persona)
                : streamPersonaResponse(persona, context, imageInput)
              for await (const chunk of stream) {
                buffer += chunk
                writeSSE(controller, { type: "chunk", persona: id, chunk })
              }
              const final = parsePersonaResponse(buffer) as PersonaResponse
              writeSSE(controller, { type: "done", persona: id, final })
            } catch (err) {
              // 개발 진단: 리뷰어 스트림 실패 원인 추적 (production에서도 유지해 문제 재발 시 확인)
              console.error(`[critique] persona=${id} failed:`, err)
              writeSSE(controller, { type: "error", persona: id, message: humanizeError(err) })
            }
          })
        )

        controller.close()
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown server error"
        // 개발 진단: 게이트키퍼/스트림 setup 실패 등 외곽 에러
        console.error(`[critique] top-level error:`, err)
        controller.enqueue(
          new TextEncoder().encode(`data: ${JSON.stringify({ type: "error", persona: "unknown", message })}\n\n`)
        )
        controller.close()
      }
    },
  })

  return new Response(stream, { headers: SSE_HEADERS })
}
