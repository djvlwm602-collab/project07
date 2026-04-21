import { describe, it, expect } from "vitest"
import {
  buildPersonaPrompt,
  parsePersonaResponse,
  PERSONA_RESPONSE_SCHEMA,
} from "@/lib/gemini"
import { getPersona } from "@/lib/personas"

describe("buildPersonaPrompt", () => {
  it("페르소나 시스템 프롬프트에 회사명·직무·톤이 포함된다", () => {
    const persona = getPersona("toss")
    const prompt = buildPersonaPrompt(persona, "약관 동의 화면")
    expect(prompt.systemInstruction).toContain("토스")
    expect(prompt.systemInstruction).toContain("PO")
    expect(prompt.systemInstruction).toContain("격식 있는 존댓말")
    expect(prompt.systemInstruction).toContain("가설 검증 가능성")
    expect(prompt.userText).toContain("약관 동의 화면")
  })

  it("JSON 스키마를 출력 강제용으로 노출", () => {
    expect(PERSONA_RESPONSE_SCHEMA.required).toContain("oneliner")
    expect(PERSONA_RESPONSE_SCHEMA.required).toContain("strengths")
    expect(PERSONA_RESPONSE_SCHEMA.required).toContain("concerns")
    expect(PERSONA_RESPONSE_SCHEMA.required).toContain("suggestions")
  })
})

describe("parsePersonaResponse", () => {
  it("완성된 JSON 텍스트를 파싱한다", () => {
    const json = JSON.stringify({
      oneliner: "정곡",
      strengths: ["a", "b"],
      concerns: ["c"],
      suggestions: ["d", "e"],
    })
    const r = parsePersonaResponse(json)
    expect(r).toEqual({ oneliner: "정곡", strengths: ["a", "b"], concerns: ["c"], suggestions: ["d", "e"] })
  })

  it("불완전 JSON도 partial로 파싱한다 (스트리밍 중)", () => {
    const partial = '{"oneliner": "검증의", "strengths": ["가설을'
    const r = parsePersonaResponse(partial)
    expect(r.oneliner).toBe("검증의")
  })

  it("완전 빈 문자열은 빈 객체 반환", () => {
    const r = parsePersonaResponse("")
    expect(r).toEqual({})
  })
})
