import { describe, it, expect } from "vitest"
import { PERSONAS, getPersona, ALL_PERSONA_IDS } from "@/lib/personas"
import type { PersonaId } from "@/lib/types"

describe("PERSONAS", () => {
  it("정확히 6명을 정의한다", () => {
    expect(PERSONAS).toHaveLength(6)
  })

  it("ID는 6개 모두 유니크하다", () => {
    const ids = PERSONAS.map(p => p.id)
    expect(new Set(ids).size).toBe(6)
  })

  it("모든 페르소나가 필수 필드를 갖는다", () => {
    for (const p of PERSONAS) {
      expect(p.id).toBeTruthy()
      expect(p.company).toBeTruthy()
      expect(["PO", "Design Lead"]).toContain(p.role)
      expect(p.title).toBeTruthy()
      expect(p.brandColor).toMatch(/^#[0-9a-f]{6}$/i)
      expect(p.oneLineQuote).toBeTruthy()
      expect(p.toneDescription.length).toBeGreaterThan(20)
      expect(p.focusAreas.length).toBeGreaterThanOrEqual(3)
    }
  })

  it("PO 3명, Design Lead 3명이다", () => {
    const pos = PERSONAS.filter(p => p.role === "PO")
    const dls = PERSONAS.filter(p => p.role === "Design Lead")
    expect(pos).toHaveLength(3)
    expect(dls).toHaveLength(3)
  })

  it("스펙에 정의된 6명이 모두 있다", () => {
    const expected: PersonaId[] = ["toss", "coupang", "naver", "karrot", "baemin", "kakao"]
    expect(PERSONAS.map(p => p.id).sort()).toEqual(expected.sort())
  })
})

describe("getPersona", () => {
  it("ID로 페르소나를 가져온다", () => {
    expect(getPersona("toss").company).toBe("토스")
  })

  it("없는 ID에 에러를 던진다", () => {
    // @ts-expect-error invalid id
    expect(() => getPersona("none")).toThrow()
  })
})

describe("ALL_PERSONA_IDS", () => {
  it("6개 ID 배열을 노출한다", () => {
    expect(ALL_PERSONA_IDS).toHaveLength(6)
  })
})
