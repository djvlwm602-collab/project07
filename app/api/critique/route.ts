/**
 * Role: /api/critique POST 엔드포인트 — 게이트키퍼 검증 후 6명(또는 단일) 페르소나를 병렬 SSE 스트리밍
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
import { writeSSE, SSE_HEADERS } from "@/lib/sse"
import type { PersonaId, PersonaResponse } from "@/lib/types"

// Edge runtime은 일부 SDK 비호환 가능 — Node runtime 권장 (로컬 개발 안정)
export const runtime = "nodejs"
export const maxDuration = 60

type RequestBody = {
  imageDataUrl: string
  context: string
  personaIds: PersonaId[]
  skipGatekeeper?: boolean // 잠금 해제로 단일 페르소나 호출 시 사용 (이미 검증됨)
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
        // 1. 게이트키퍼 (skip 가능)
        if (!skipGatekeeper) {
          const gate = await runGatekeeper(context, imageInput)
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

        // 2. 6명(혹은 단일) 병렬 스트리밍
        await Promise.all(
          validIds.map(async (id) => {
            const persona = getPersona(id)
            let buffer = ""
            try {
              for await (const chunk of streamPersonaResponse(persona, context, imageInput)) {
                buffer += chunk
                writeSSE(controller, { type: "chunk", persona: id, chunk })
              }
              const final = parsePersonaResponse(buffer) as PersonaResponse
              writeSSE(controller, { type: "done", persona: id, final })
            } catch (err) {
              const message = err instanceof Error ? err.message : "Unknown error"
              writeSSE(controller, { type: "error", persona: id, message })
            }
          })
        )

        controller.close()
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown server error"
        controller.enqueue(
          new TextEncoder().encode(`data: ${JSON.stringify({ type: "error", persona: "unknown", message })}\n\n`)
        )
        controller.close()
      }
    },
  })

  return new Response(stream, { headers: SSE_HEADERS })
}
