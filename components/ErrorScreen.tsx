/**
 * Role: 게이트키퍼 거부 시 표시되는 에러 화면 — 이유/추천 + 재시도 CTA
 * Key Features: Editorial Minimal, 검정 pill 재시도 버튼
 * Dependencies: 없음 (presentational only)
 * Notes: 'use client' 필수 (onClick 핸들러).
 */
"use client"

type Props = {
  reason: string
  suggestion?: string
  onRetry: () => void
}

export function ErrorScreen({ reason, suggestion, onRetry }: Props) {
  return (
    <div className="min-h-screen bg-white flex items-center">
      <div className="max-w-md mx-auto px-6 py-16 text-center">
        <div className="text-5xl mb-6">🎨</div>
        <h2 className="font-serif text-2xl md:text-3xl text-neutral-900 mb-5 tracking-tight">
          이 이미지로는 디자인 크리틱이 어려워요
        </h2>
        <p className="text-sm text-neutral-600 mb-2">
          <span className="font-semibold text-neutral-900">이유</span> · {reason}
        </p>
        {suggestion && (
          <p className="text-sm text-neutral-600 mb-8">
            <span className="font-semibold text-neutral-900">추천</span> · {suggestion}
          </p>
        )}
        <button
          onClick={onRetry}
          className="mt-4 bg-neutral-900 text-white rounded-full px-6 py-2.5 text-base hover:bg-neutral-800 transition-colors"
        >
          다시 올리기
        </button>
      </div>
    </div>
  )
}
