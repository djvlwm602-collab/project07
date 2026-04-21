import { describe, it, expect, beforeEach } from "vitest"
import {
  saveCurrentSession,
  loadCurrentSession,
  clearCurrentSession,
  appendToHistory,
  loadHistory,
  HISTORY_LIMIT,
} from "@/lib/storage"
import type { CritiqueSession } from "@/lib/types"

function makeSession(id: string): CritiqueSession {
  return {
    id,
    imageUrl: "data:image/png;base64,xxx",
    context: "test",
    createdAt: Date.now(),
    unlockedIds: [],
    responses: {},
    inFlightIds: [],
  }
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

describe("currentSession (sessionStorage)", () => {
  it("저장 후 불러올 수 있다", () => {
    const s = makeSession("a")
    saveCurrentSession(s)
    expect(loadCurrentSession()).toEqual(s)
  })

  it("clear 후엔 null", () => {
    saveCurrentSession(makeSession("a"))
    clearCurrentSession()
    expect(loadCurrentSession()).toBeNull()
  })

  it("저장 안 된 상태에선 null", () => {
    expect(loadCurrentSession()).toBeNull()
  })
})

describe("history (localStorage)", () => {
  it("초기엔 빈 배열", () => {
    expect(loadHistory()).toEqual([])
  })

  it("최대 N개까지 저장, FIFO로 가장 오래된 것 삭제", () => {
    for (let i = 0; i < HISTORY_LIMIT + 2; i++) {
      appendToHistory(makeSession(`s${i}`))
    }
    const h = loadHistory()
    expect(h).toHaveLength(HISTORY_LIMIT)
    expect(h[0].id).toBe(`s${HISTORY_LIMIT + 1}`) // 최신
    expect(h[h.length - 1].id).toBe("s2")          // 가장 오래된 (s0, s1은 밀려남)
  })
})
