/**
 * Role: 현재 세션(sessionStorage) + 히스토리(localStorage) 저장 유틸 + 크리틱 결과 캐시
 * Key Features: saveCurrentSession/loadCurrentSession/clearCurrentSession, appendToHistory(FIFO), loadHistory,
 *               legacy critic6_* 키 → crit_* 1회성 마이그레이션,
 *               getCachedCritique/setCachedCritique (동일 이미지+맥락 재업로드 시 Gemini 호출 회피),
 *               LRU 정리로 localStorage 용량 관리
 * Dependencies: 브라우저 storage API (lib/types.ts의 CritiqueSession, PersonaId, PersonaResponse)
 * Notes: SSR 안전 — typeof window 가드로 Server Component import 시 에러 방지
 */

import type { CritiqueSession, PersonaId, PersonaResponse } from "./types"

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

// ─── 크리틱 결과 캐시 ─────────────────────────────────────────────────────────
// 동일 이미지+맥락에 대한 결과를 localStorage에 저장해 Gemini 호출을 재발하지 않도록 함.
// 키 패턴: crit:cache:{imgHash[0..15]}:{ctxHash[0..15]}
//  - 해시는 lib/hash.ts의 sha256Base64Url (호출 측에서 계산 후 전달)
//  - 값에 createdAt을 두고 LRU 정리 기준으로 사용

const CACHE_KEY_PREFIX = "crit:cache:"
// 대략적 localStorage 용량 상한. 브라우저 별 5~10MB 범위인데 안전하게 4.5MB 트리거
const CACHE_MAX_BYTES = 4.5 * 1024 * 1024

export type CachedCritique = {
  responses: Partial<Record<PersonaId, PersonaResponse>>
  createdAt: number
}

function cacheKey(imageHash: string, contextHash: string): string {
  return `${CACHE_KEY_PREFIX}${imageHash.slice(0, 16)}:${contextHash.slice(0, 16)}`
}

export function getCachedCritique(
  imageHash: string,
  contextHash: string
): CachedCritique | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(cacheKey(imageHash, contextHash))
    return safeParse<CachedCritique>(raw)
  } catch {
    return null
  }
}

export function setCachedCritique(
  imageHash: string,
  contextHash: string,
  responses: Partial<Record<PersonaId, PersonaResponse>>
): void {
  if (typeof window === "undefined") return
  const entry: CachedCritique = { responses, createdAt: Date.now() }
  const key = cacheKey(imageHash, contextHash)
  try {
    localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // 용량 초과 추정 — LRU 정리 후 1회 재시도
    evictOldestCache()
    try {
      localStorage.setItem(key, JSON.stringify(entry))
    } catch {
      /* 포기 — 사용자 앱은 정상 작동 */
    }
  }
  // 저장 성공 후에도 대략 용량 체크해 여유 확보
  maybeEvict()
}

// 누적 사이즈가 임계 근접이면 가장 오래된 항목부터 제거
function maybeEvict(): void {
  if (typeof window === "undefined") return
  try {
    let total = 0
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k) continue
      total += (k.length + (localStorage.getItem(k)?.length ?? 0)) * 2 // UTF-16 대략
    }
    if (total < CACHE_MAX_BYTES) return
    evictOldestCache()
  } catch {
    /* ignore */
  }
}

function evictOldestCache(): void {
  if (typeof window === "undefined") return
  const entries: { key: string; createdAt: number }[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (!k || !k.startsWith(CACHE_KEY_PREFIX)) continue
    const parsed = safeParse<CachedCritique>(localStorage.getItem(k))
    entries.push({ key: k, createdAt: parsed?.createdAt ?? 0 })
  }
  entries.sort((a, b) => a.createdAt - b.createdAt)
  // 가장 오래된 1/4 제거 (최소 1개)
  const removeCount = Math.max(1, Math.floor(entries.length / 4))
  for (let i = 0; i < removeCount && i < entries.length; i++) {
    localStorage.removeItem(entries[i].key)
  }
}
