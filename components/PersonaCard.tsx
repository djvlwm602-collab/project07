/**
 * Role: 페르소나 응답 카드 (잠금 / 로딩 / 스트리밍 / 완료 / 에러 상태 표시) — Apple 스타일
 * Key Features: 화이트 카드 + apple-card shadow, 8px radius, 보더 제거, Apple Blue 잠금해제 CTA
 * Dependencies: lib/personas (getPersona), lib/types (PersonaCardState)
 * Notes: 'use client' 필수 (onClick 핸들러 props 수신). ResultGrid에서 매핑됨.
 */
"use client"

import { getPersona } from "@/lib/personas"
import type { PersonaCardState, PersonaResponse } from "@/lib/types"

type Props = {
  state: PersonaCardState
  onUnlockClick: () => void
}

export function PersonaCard({ state, onUnlockClick }: Props) {
  const p = getPersona(state.id)
  const isLocked = state.status === "locked"
  const isLoading = state.status === "unlocked-loading"
  const hasError = state.status === "error"

  return (
    <div
      className={`relative bg-white rounded-apple shadow-apple-card p-6 min-h-[320px] flex flex-col overflow-hidden ${
        isLocked ? "select-none" : "animate-blur-in"
      }`}
    >
      <div className={isLocked ? "blur-sm" : ""}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.brandColor }} />
          <span className="text-[11px] uppercase tracking-[0.12em] text-apple-text/60">
            {p.company} · {p.role}
          </span>
        </div>
        <h3 className="text-[21px] leading-apple-card tracking-apple-card-title font-bold text-apple-text mb-4">
          {p.title}
        </h3>
      </div>

      <div className={`flex-1 ${isLocked ? "blur-md pointer-events-none" : ""}`}>
        {hasError ? (
          <ErrorView message={state.error ?? "응답 생성 실패"} />
        ) : (
          <ContentView state={state} />
        )}
      </div>

      {isLocked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm">
          <div className="text-2xl mb-3">🔒</div>
          <button
            onClick={onUnlockClick}
            className="bg-apple-blue text-white text-[15px] font-normal rounded-apple px-5 py-2 hover:brightness-110 transition"
            aria-label={`${p.company} ${p.role} 페르소나 잠금 해제, 광고 보고 열기`}
          >
            광고 보고 열기 (5초)
          </button>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="text-[13px] text-apple-text/60">응답 받는 중…</div>
        </div>
      )}
    </div>
  )
}

function ContentView({ state }: { state: PersonaCardState }) {
  const c: Partial<PersonaResponse> = state.content ?? {}
  return (
    <div className="space-y-5">
      {c.oneliner && (
        <p className="text-[17px] italic text-apple-text leading-apple-body border-l-2 border-apple-text/15 pl-3">
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
