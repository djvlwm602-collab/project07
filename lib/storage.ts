/**
 * Role: 현재 세션(sessionStorage) + 히스토리(localStorage) 저장 유틸
 * Key Features: saveCurrentSession/loadCurrentSession/clearCurrentSession, appendToHistory(FIFO), loadHistory,
 *               legacy critic6_* 키 → crit_* 1회성 마이그레이션
 * Dependencies: 브라우저 storage API (lib/types.ts의 CritiqueSession)
 * Notes: SSR 안전 — typeof window 가드로 Server Component import 시 에러 방지
 */

import type { CritiqueSession } from "./types"

const SESSION_KEY = "crit_current_session"
const HISTORY_KEY = "crit_history"
// 리브랜드 이전 키 — 기존 사용자의 저장물을 한 번 이전 후 삭제
const LEGACY_SESSION_KEY = "critic6_current_session"
const LEGACY_HISTORY_KEY = "critic6_history"
export const HISTORY_LIMIT = 5

// JSON 파싱 실패 시 null 반환 — 손상된 storage 값에서 앱이 죽지 않도록
function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

// 리브랜드 이전 키에 값이 남아 있으면 새 키로 옮기고 legacy 키 제거 — 조회 시점에 1회성으로 수행
function migrateLegacyKeys(): void {
  if (typeof window === "undefined") return
  try {
    const legacySession = sessionStorage.getItem(LEGACY_SESSION_KEY)
    if (legacySession && !sessionStorage.getItem(SESSION_KEY)) {
      sessionStorage.setItem(SESSION_KEY, legacySession)
    }
    if (legacySession) sessionStorage.removeItem(LEGACY_SESSION_KEY)

    const legacyHistory = localStorage.getItem(LEGACY_HISTORY_KEY)
    if (legacyHistory && !localStorage.getItem(HISTORY_KEY)) {
      localStorage.setItem(HISTORY_KEY, legacyHistory)
    }
    if (legacyHistory) localStorage.removeItem(LEGACY_HISTORY_KEY)
  } catch {
    // storage 접근 불가(프라이버시 모드 등) 상황에서는 조용히 무시
  }
}

// 현재 진행 중인 세션을 sessionStorage에 저장 (탭 닫으면 사라짐)
export function saveCurrentSession(session: CritiqueSession): void {
  if (typeof window === "undefined") return
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

// 현재 세션 복원 — 새로고침 시 진행 상태 유지용
export function loadCurrentSession(): CritiqueSession | null {
  if (typeof window === "undefined") return null
  migrateLegacyKeys()
  return safeParse<CritiqueSession>(sessionStorage.getItem(SESSION_KEY))
}

// 현재 세션 초기화 — 새 크리틱 시작 또는 히스토리 이동 시
export function clearCurrentSession(): void {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(SESSION_KEY)
}

// 히스토리 전체 로드 — 최신이 앞쪽
export function loadHistory(): CritiqueSession[] {
  if (typeof window === "undefined") return []
  migrateLegacyKeys()
  return safeParse<CritiqueSession[]>(localStorage.getItem(HISTORY_KEY)) ?? []
}

// 완료된 세션을 히스토리에 추가 — 최신을 맨 앞에 넣고 N개 초과분은 잘라냄(FIFO)
export function appendToHistory(session: CritiqueSession): void {
  if (typeof window === "undefined") return
  const current = loadHistory()
  const next = [session, ...current].slice(0, HISTORY_LIMIT)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
}
