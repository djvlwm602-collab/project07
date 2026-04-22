/**
 * Role: 합병 JSON(reviewers.{id}: PersonaResponse)에서 부분/전체 파싱 — 클라/서버 공용
 * Key Features: parseMergedResponse(text) — partial-json으로 스트리밍 중간에도 안전 추출
 * Dependencies: partial-json, ./types
 * Notes: 서버 SDK(getGenAI 등)를 import하지 않아 클라이언트 번들에서 안전.
 */
import { parse as parsePartialJson, Allow } from "partial-json"
import type { PersonaId, PersonaResponse } from "./types"

export type MergedReviewers = Partial<Record<PersonaId, PersonaResponse>>

export function parseMergedResponse(text: string): MergedReviewers {
  if (!text || !text.trim()) return {}
  try {
    const parsed = parsePartialJson(text, Allow.ALL) as {
      reviewers?: MergedReviewers
    } | null
    return parsed?.reviewers ?? {}
  } catch {
    return {}
  }
}
