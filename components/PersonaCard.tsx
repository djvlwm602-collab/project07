/**
 * Role: 페르소나 응답 카드 (잠금 / 로딩 / 스트리밍 / 완료 / 에러 상태 표시)
 * Key Features: 잠금 오버레이 + 광고 시청 버튼, blur 트랜지션, 섹션별 응답 렌더링
 * Dependencies: lib/personas (getPersona), lib/types (PersonaCardState)
 * Notes: T16 ResultGrid에서 사용. 'use client' 필수 (onClick 핸들러 props 수신).
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
      className={`relative border border-neutral-200 bg-white p-5 min-h-[300px] flex flex-col ${
        isLocked ? "select-none" : "animate-blur-in"
      }`}
    >
      {/* 헤더: 회사 + 타이틀 */}
      <div className={isLocked ? "blur-sm" : ""}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.brandColor }} />
          <span className="font-sans text-[11px] uppercase tracking-widest text-neutral-500">
            {p.company} · {p.role}
          </span>
        </div>
        <h3 className="font-serif text-lg text-neutral-900 mb-3">{p.title}</h3>
      </div>

      {/* 본문 */}
      <div className={`flex-1 ${isLocked ? "blur-md pointer-events-none" : ""}`}>
        {hasError ? (
          <ErrorView message={state.error ?? "응답 생성 실패"} />
        ) : (
          <ContentView state={state} />
        )}
      </div>

      {/* 잠금 오버레이 */}
      {isLocked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40">
          <div className="text-2xl mb-3">🔒</div>
          <button
            onClick={onUnlockClick}
            className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors"
            aria-label={`${p.company} ${p.role} 페르소나 잠금 해제, 광고 보고 열기`}
          >
            광고 보고 열기 (5초)
          </button>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60">
          <div className="text-sm text-neutral-500">응답 받는 중…</div>
        </div>
      )}
    </div>
  )
}

function ContentView({ state }: { state: PersonaCardState }) {
  // 스트리밍 중에는 content가 부분적으로만 채워져 있을 수 있음 → Partial로 처리
  const c: Partial<PersonaResponse> = state.content ?? {}
  return (
    <div className="space-y-4">
      {c.oneliner && (
        <p className="font-serif text-base italic text-neutral-800 leading-relaxed border-l-2 border-neutral-300 pl-3">
          "{c.oneliner}"
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
      <div className="font-sans text-[11px] uppercase tracking-widest text-neutral-500 mb-1.5">{label}</div>
      <ul className="space-y-1">
        {items.map((s, i) => (
          <li key={i} className="font-sans text-sm text-neutral-700 leading-relaxed">· {s}</li>
        ))}
      </ul>
    </div>
  )
}

function ErrorView({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <p className="text-sm text-neutral-500 mb-3">응답을 받을 수 없었어요</p>
      <p className="text-xs text-neutral-400">{message}</p>
    </div>
  )
}
