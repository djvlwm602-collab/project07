// lib/types.ts

export type PersonaId = "toss" | "coupang" | "naver" | "karrot" | "baemin" | "kakao"

export type PersonaRole = "PO" | "Design Lead"

export type Persona = {
  id: PersonaId
  company: string
  role: PersonaRole
  title: string                    // 예: "검증의 칼날"
  brandColor: string               // 시그니처 컬러 (#hex)
  oneLineQuote: string             // 톤 예시
  toneDescription: string          // 프롬프트용 톤 가이드
  focusAreas: string[]             // 평가 축
}

export type PersonaResponse = {
  oneliner: string
  strengths: string[]
  concerns: string[]
  suggestions: string[]
}

export type CardStatus =
  | "locked"                // 잠김 (광고 미시청)
  | "unlocked-loading"      // 광고 시청 후 호출 시작 직전
  | "unlocked-streaming"    // 스트리밍 중
  | "unlocked-done"         // 완료
  | "error"                 // 실패

export type PersonaCardState = {
  id: PersonaId
  status: CardStatus
  content?: PersonaResponse        // 부분 또는 완료된 응답
  error?: string
}

export type GatekeeperResult = {
  valid: boolean
  category?: "ui" | "graphic" | "wireframe" | "other"
  confidence?: "high" | "medium" | "low"
  reason?: string
  suggestion?: string
}

export type CritiqueSession = {
  id: string                       // UUID
  imageUrl: string                 // base64 data URL
  context: string
  createdAt: number                // epoch ms
  unlockedIds: PersonaId[]
  responses: Partial<Record<PersonaId, PersonaResponse>>
  inFlightIds: PersonaId[]
  // 리뷰어별 실패 메시지. 스트림 에러/네트워크 실패 시 저장되어 카드가 error 상태로 전환됨
  errors?: Partial<Record<PersonaId, string>>
  // 카드 렌더 순서. 세션 생성 시 초기 잠금해제 2개를 상단에 두고 고정 — 잠금 해제해도 순서 유지
  // optional: 이전 버전 세션 호환용 (없으면 ALL_PERSONA_IDS 순서로 fallback)
  orderedIds?: PersonaId[]
}

// SSE 이벤트 타입
// - merged-chunk/merged-done: 6명 리뷰어를 단일 Gemini 호출로 합쳐 반환하는 경로 (권장)
// - chunk/done/error(persona 지정): 기존 개별 리뷰어 스트림 경로 (하위 호환)
// - rejected: 게이트키퍼 거부 경로 (현재는 미사용, @deprecated)
export type SSEEvent =
  | { type: "rejected"; reason: string; suggestion?: string }
  | { type: "merged-chunk"; chunk: string }
  | { type: "merged-done"; final: { reviewers: Partial<Record<PersonaId, PersonaResponse>> } }
  | { type: "chunk"; persona: PersonaId; chunk: string }
  | { type: "done"; persona: PersonaId; final: PersonaResponse }
  | { type: "error"; persona: PersonaId | "all"; message: string }
