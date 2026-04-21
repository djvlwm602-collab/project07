/**
 * Role: 리뷰어 응답 카드 — Apple 카드 + 원형 프로필 아바타 헤더
 * Key Features: 화이트 카드 + apple-card shadow + 18px radius, brandColor 원형 아바타(임시 이니셜/이모지),
 *               Apple Blue pill 잠금해제 CTA
 * Dependencies: lib/personas (getPersona), lib/types (Persona, PersonaId, PersonaCardState)
 * Notes: 'use client'. LOGO 상수는 실제 로고 이미지 도입 전까지의 임시 표기 — 추후 이미지로 교체 가능.
 */
"use client"

import { getPersona, PERSONA_LOGO } from "@/lib/personas"
import type { Persona, PersonaCardState, PersonaResponse } from "@/lib/types"

type Props = {
  state: PersonaCardState
  onUnlockClick: () => void
}

export function PersonaCard({ state, onUnlockClick }: Props) {
  const p = getPersona(state.id)
  const isLocked = state.status === "locked"
  const hasError = state.status === "error"
  // 실제 렌더할 콘텐츠가 한 조각이라도 있는지 — partial JSON이 아직 비어있는 순간을 판정
  const hasContent = !!(
    state.content &&
    (state.content.oneliner ||
      (state.content.strengths && state.content.strengths.length > 0) ||
      (state.content.concerns && state.content.concerns.length > 0) ||
      (state.content.suggestions && state.content.suggestions.length > 0))
  )
  // 잠금 해제됐지만 내용이 아직 없는 상태(호출 직후 + 첫 chunk 도착 전)에 로딩 오버레이
  const isWaiting =
    !hasError &&
    !hasContent &&
    (state.status === "unlocked-loading" || state.status === "unlocked-streaming")

  return (
    <div
      className={`relative bg-white rounded-apple-lg shadow-apple-card p-6 min-h-[320px] flex flex-col overflow-hidden ${
        isLocked ? "select-none" : "animate-blur-in"
      }`}
    >
      <div className={isLocked ? "blur-sm" : ""}>
        <div className="flex items-center gap-3 mb-4">
          <Avatar persona={p} />
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.12em] text-apple-text/60 mb-0.5">
              {p.company} · {p.role}
            </p>
            <h3 className="text-[20px] leading-apple-card tracking-apple-caption font-bold text-apple-text truncate">
              {p.title}
            </h3>
          </div>
        </div>
      </div>

      <div className={`flex-1 ${isLocked ? "blur-md pointer-events-none" : ""}`}>
        {hasError ? (
          <ErrorView message={state.error ?? "응답 생성 실패"} />
        ) : (
          <ContentView state={state} />
        )}
      </div>

      {isLocked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm">
          <div className="text-2xl mb-3">🔒</div>
          <button
            onClick={onUnlockClick}
            className="bg-apple-blue text-white text-[15px] font-normal rounded-pill px-5 py-2.5 hover:brightness-110 transition"
            aria-label={`${p.company} ${p.role} 리뷰어 잠금 해제, 광고 보고 열기`}
          >
            광고 보고 열기 (5초)
          </button>
        </div>
      )}

      {isWaiting && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/75 backdrop-blur-sm gap-3">
          <div className="w-6 h-6 rounded-full border-2 border-apple-text/15 border-t-apple-text/60 animate-spin" />
          <div className="text-[13px] text-apple-text/60">
            {p.company} {p.role}가 들여다보는 중…
          </div>
        </div>
      )}
    </div>
  )
}

function Avatar({ persona }: { persona: Persona }) {
  const logo = PERSONA_LOGO[persona.id]
  return (
    <div
      className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-[13px] leading-none"
      style={{
        backgroundColor: persona.brandColor,
        color: logo.dark ? "#1d1d1f" : "#fff",
      }}
      aria-label={`${persona.company} 로고`}
    >
      {logo.text}
    </div>
  )
}

function ContentView({ state }: { state: PersonaCardState }) {
  const c: Partial<PersonaResponse> = state.content ?? {}
  return (
    <div className="space-y-5">
      {c.oneliner && (
        <p className="font-serif text-[17px] italic text-apple-text leading-apple-body border-l-2 border-apple-text/15 pl-3">
          &ldquo;{c.oneliner}&rdquo;
        </p>
      )}
      <Section label="강점" items={c.strengths} />
      <Section label="우려" items={c.concerns} />
      <Section label="제안" items={c.suggestions} />
    </div>
  )
}

function Section({ label, items }: { label: string; items?: string[] }) {
  if (!items || items.length === 0) return null
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.12em] text-apple-text/50 mb-2">
        {label}
      </div>
      <ul className="space-y-1.5">
        {items.map((s, i) => (
          <li key={i} className="text-[15px] text-apple-text/85 leading-apple-body">
            · {s}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ErrorView({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-2">
      <p className="text-[13px] text-apple-text/60 mb-3">응답을 받을 수 없었어요</p>
      <p className="text-[12px] text-apple-text/40 break-words max-w-full leading-apple-body">
        {message}
      </p>
    </div>
  )
}
