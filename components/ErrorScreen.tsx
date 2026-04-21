/**
 * Role: 게이트키퍼 거부 시 표시되는 에러 화면 — Apple 톤, Apple Blue pill 재시도 CTA
 * Key Features: 라이트 그레이 섹션, 이유/추천 + pill 버튼
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
    <div className="min-h-screen bg-apple-gray flex items-center">
      <div className="max-w-md mx-auto px-6 py-16 text-center">
        <div className="text-5xl mb-6">🎨</div>
        <h2 className="text-[28px] md:text-[32px] font-bold leading-apple-section tracking-[-0.003em] text-apple-text mb-6">
          이 이미지로는 디자인 크리틱이 어려워요
        </h2>
        <p className="text-[15px] text-apple-text/75 leading-apple-body mb-2">
          <span className="font-semibold text-apple-text">이유</span> · {reason}
        </p>
        {suggestion && (
          <p className="text-[15px] text-apple-text/75 leading-apple-body mb-8">
            <span className="font-semibold text-apple-text">추천</span> · {suggestion}
          </p>
        )}
        <button
          onClick={onRetry}
          className="mt-4 bg-apple-blue text-white text-[17px] rounded-pill px-6 py-2.5 hover:brightness-110 transition"
        >
          다시 올리기
        </button>
      </div>
    </div>
  )
}
