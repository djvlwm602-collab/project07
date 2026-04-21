/**
 * Role: 리뷰어 응답 카드 (잠금 / 로딩 / 스트리밍 / 완료 / 에러 상태)
 * Key Features: Editorial Minimal 톤 (흑백 + 카드 좌측 브랜드 바), 검정 pill 잠금해제 CTA
 * Dependencies: lib/personas (getPersona), lib/types (PersonaCardState)
 * Notes: 'use client' (onClick 핸들러 수신). 타입명 Persona는 내부 식별자로 유지, 카피는 '리뷰어'.
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
      className={`relative bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 pl-7 min-h-[320px] flex flex-col overflow-hidden ${
        isLocked ? "select-none" : "animate-blur-in"
      }`}
    >
      {/* 회사 시그니처 컬러 3px 세로 바 (1포인트 액센트) */}
      <div
        className="absolute left-3 top-6 bottom-6 w-[3px] rounded-full"
        style={{ backgroundColor: p.brandColor }}
        aria-hidden
      />

      <div className={isLocked ? "blur-sm" : ""}>
        <p className="text-[11px] uppercase tracking-widest text-neutral-500 mb-2">
          {p.company} · {p.role}
        </p>
        <h3 className="font-serif text-xl text-neutral-900 mb-4 leading-tight">
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
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm">
          <div className="text-2xl mb-3">🔒</div>
          <button
            onClick={onUnlockClick}
            className="bg-neutral-900 text-white text-sm rounded-full px-5 py-2 hover:bg-neutral-800 transition-colors"
            aria-label={`${p.company} ${p.role} 리뷰어 잠금 해제, 광고 보고 열기`}
          >
            광고 보고 열기 (5초)
          </button>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="text-sm text-neutral-500">응답 받는 중…</div>
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
        <p className="font-serif text-base italic text-neutral-800 leading-relaxed border-l-2 border-neutral-300 pl-3">
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
      <div className="text-[11px] uppercase tracking-widest text-neutral-500 mb-1.5">
        {label}
      </div>
      <ul className="space-y-1">
        {items.map((s, i) => (
          <li key={i} className="text-sm text-neutral-700 leading-relaxed">
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
      <p className="text-sm text-neutral-500 mb-3">응답을 받을 수 없었어요</p>
      <p className="text-xs text-neutral-400 break-words max-w-full leading-relaxed">
        {message}
      </p>
    </div>
  )
}
