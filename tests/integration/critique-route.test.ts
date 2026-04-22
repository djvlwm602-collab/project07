/**
 * Role: /api/critique POST 라우트 통합 테스트 — merged 경로(단일 Gemini 호출) SSE 흐름 검증
 * Key Features: merged-chunk / merged-done 이벤트, top-level error, 입력 검증(400)
 * Dependencies: @/app/api/critique/route, @/lib/gemini-merged(모킹), next/server
 * Notes: streamMergedReviewers만 모킹 — parseMergedResponse는 실제 구현 사용.
 */
import { describe, it, expect, beforeEach, vi } from "vitest"
import { POST } from "@/app/api/critique/route"
import { NextRequest } from "next/server"

vi.mock("@/lib/gemini-merged", async () => {
  const actual = await vi.importActual<typeof import("@/lib/gemini-merged")>(
    "@/lib/gemini-merged"
  )
  return {
    ...actual,
    streamMergedReviewers: vi.fn(),
  }
})

import { streamMergedReviewers } from "@/lib/gemini-merged"

const SAMPLE_DATA_URL = "data:image/png;base64,iVBORw0KGgo="

function makeReq(body: object) {
  return new NextRequest("http://localhost/api/critique", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

async function readAll(res: Response): Promise<string> {
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let out = ""
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    out += decoder.decode(value)
  }
  return out
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("POST /api/critique (merged)", () => {
  it("정상 흐름: merged-chunk 여러 개 + merged-done 전송", async () => {
    const mergedJson = JSON.stringify({
      reviewers: {
        toss: {
          oneliner: "테스트",
          strengths: ["a"],
          concerns: ["b"],
          suggestions: ["c"],
        },
      },
    })
    vi.mocked(streamMergedReviewers).mockImplementation(async function* () {
      yield mergedJson.slice(0, 20)
      yield mergedJson.slice(20)
    })

    const res = await POST(makeReq({
      imageDataUrl: SAMPLE_DATA_URL,
      context: "test",
      personaIds: ["toss"],
    }))

    const body = await readAll(res)
    expect(body).toContain('"type":"merged-chunk"')
    expect(body).toContain('"type":"merged-done"')
    expect(body).toContain('"toss"')
  })

  it("스트림 실패 시 top-level error 이벤트 전송", async () => {
    vi.mocked(streamMergedReviewers).mockImplementation(async function* () {
      throw new Error("429 Too Many Requests")
    })

    const res = await POST(makeReq({
      imageDataUrl: SAMPLE_DATA_URL,
      context: "",
      personaIds: ["toss"],
    }))

    const body = await readAll(res)
    expect(body).toContain('"type":"error"')
    expect(body).toContain('"persona":"all"')
  })

  it("imageDataUrl 없으면 400", async () => {
    const res = await POST(makeReq({ context: "", personaIds: ["toss"] }))
    expect(res.status).toBe(400)
  })

  it("personaIds 비어있으면 400", async () => {
    const res = await POST(
      makeReq({ imageDataUrl: SAMPLE_DATA_URL, context: "", personaIds: [] })
    )
    expect(res.status).toBe(400)
  })

  it("모든 personaIds가 유효하지 않으면 400", async () => {
    const res = await POST(
      makeReq({ imageDataUrl: SAMPLE_DATA_URL, context: "", personaIds: ["unknown"] })
    )
    expect(res.status).toBe(400)
  })
})
