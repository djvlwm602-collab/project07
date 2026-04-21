/**
 * Role: /api/critique POST 라우트 통합 테스트 — Gemini 모킹 후 SSE 흐름 검증
 * Key Features: 게이트키퍼 거부/통과, 부분 실패, skipGatekeeper, 입력 검증 (400)
 * Dependencies: @/app/api/critique/route, @/lib/gemini (모킹), next/server
 * Notes: vi.mock + vi.importActual로 extractImageInput 등 순수 함수는 실제 구현을 그대로 사용
 */
import { describe, it, expect, beforeEach, vi } from "vitest"
import { POST } from "@/app/api/critique/route"
import { NextRequest } from "next/server"

vi.mock("@/lib/gemini", async () => {
  const actual = await vi.importActual<typeof import("@/lib/gemini")>("@/lib/gemini")
  return {
    ...actual,
    runGatekeeper: vi.fn(),
    streamPersonaResponse: vi.fn(),
  }
})

import { runGatekeeper, streamPersonaResponse } from "@/lib/gemini"

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

describe("POST /api/critique", () => {
  it("게이트키퍼 거부 시 rejected 이벤트 전송 후 종료", async () => {
    vi.mocked(runGatekeeper).mockResolvedValue({
      valid: false,
      reason: "고양이 사진이네요",
      suggestion: "UI 스크린샷을 올려주세요",
    })

    const res = await POST(makeReq({
      imageDataUrl: SAMPLE_DATA_URL,
      context: "",
      personaIds: ["toss"],
    }))

    const body = await readAll(res)
    expect(body).toContain('"type":"rejected"')
    expect(body).toContain("고양이 사진이네요")
    expect(streamPersonaResponse).not.toHaveBeenCalled()
  })

  it("게이트키퍼 통과 시 페르소나 스트림 chunk + done 이벤트 전송", async () => {
    vi.mocked(runGatekeeper).mockResolvedValue({ valid: true })
    vi.mocked(streamPersonaResponse).mockImplementation(async function* () {
      yield '{"oneliner":"테스트",'
      yield '"strengths":["a"],"concerns":["b"],"suggestions":["c"]}'
    })

    const res = await POST(makeReq({
      imageDataUrl: SAMPLE_DATA_URL,
      context: "test",
      personaIds: ["toss"],
    }))

    const body = await readAll(res)
    expect(body).toContain('"type":"chunk"')
    expect(body).toContain('"type":"done"')
    expect(body).toContain('"persona":"toss"')
  })

  it("개별 페르소나 실패 시 error 이벤트, 다른 페르소나는 계속", async () => {
    vi.mocked(runGatekeeper).mockResolvedValue({ valid: true })
    vi.mocked(streamPersonaResponse).mockImplementation(async function* (persona) {
      if (persona.id === "toss") throw new Error("Safety filter")
      yield '{"oneliner":"ok","strengths":["a"],"concerns":["b"],"suggestions":["c"]}'
    })

    const res = await POST(makeReq({
      imageDataUrl: SAMPLE_DATA_URL,
      context: "",
      personaIds: ["toss", "naver"],
    }))

    const body = await readAll(res)
    expect(body).toContain('"type":"error"')
    expect(body).toContain('"persona":"toss"')
    expect(body).toContain('"persona":"naver"')
  })

  it("skipGatekeeper=true면 게이트키퍼 호출 없음", async () => {
    vi.mocked(streamPersonaResponse).mockImplementation(async function* () {
      yield '{"oneliner":"x","strengths":["a"],"concerns":["b"],"suggestions":["c"]}'
    })

    await POST(makeReq({
      imageDataUrl: SAMPLE_DATA_URL,
      context: "",
      personaIds: ["toss"],
      skipGatekeeper: true,
    }))

    expect(runGatekeeper).not.toHaveBeenCalled()
  })

  it("imageDataUrl 없으면 400", async () => {
    const res = await POST(makeReq({ context: "", personaIds: ["toss"] }))
    expect(res.status).toBe(400)
  })

  it("personaIds 비어있으면 400", async () => {
    const res = await POST(makeReq({ imageDataUrl: SAMPLE_DATA_URL, context: "", personaIds: [] }))
    expect(res.status).toBe(400)
  })
})
