/**
 * Role: 서버/클라이언트 양쪽에서 사용할 SSE(Server-Sent Events) 헬퍼
 * Key Features: writeSSE(서버 enqueue), SSE_HEADERS(응답 헤더), readSSE(클라이언트 async iterator)
 * Dependencies: ./types (SSEEvent)
 * Notes: data: 라인만 처리하며, 파싱 실패한 이벤트는 조용히 무시함
 */

// lib/sse.ts
import type { SSEEvent } from "./types"

/** 서버 측: SSE 라인을 만들어 ReadableStreamDefaultController에 enqueue */
export function writeSSE(controller: ReadableStreamDefaultController<Uint8Array>, event: SSEEvent) {
  const line = `data: ${JSON.stringify(event)}\n\n`
  controller.enqueue(new TextEncoder().encode(line))
}

/** 서버: SSE 응답 헤더 */
export const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
}

/**
 * 클라이언트: fetch Response에서 SSE 이벤트를 async iterator로 받음.
 */
export async function* readSSE(response: Response): AsyncGenerator<SSEEvent, void, void> {
  if (!response.body) throw new Error("No response body")
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let idx: number
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const raw = buffer.slice(0, idx).trim()
      buffer = buffer.slice(idx + 2)
      if (!raw.startsWith("data:")) continue
      const json = raw.slice(5).trim()
      try {
        yield JSON.parse(json) as SSEEvent
      } catch {
        // ignore malformed
      }
    }
  }
}
