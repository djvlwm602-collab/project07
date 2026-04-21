/**
 * Role: 게이트키퍼 거부 시 표시되는 에러 화면 (이유/추천 + 재시도 버튼)
 * Key Features: 거부 사유 + 추천 안내 메시지, 다시 올리기 CTA
 * Dependencies: 없음 (presentational only)
 * Notes: T19에서 게이트키퍼 거부 응답을 받았을 때 렌더. 'use client' 필수 (onClick 핸들러).
 */
"use client"

type Props = {
  reason: string
  suggestion?: string
  onRetry: () => void
}

// 게이트키퍼 거부 사유와 재시도 액션을 보여주는 단순 프레젠테이션 컴포넌트
export function ErrorScreen({ reason, suggestion, onRetry }: Props) {
  return (
    <div className="max-w-md mx-auto px-6 py-16 text-center">
      <div className="text-5xl mb-6">🎨</div>
      <h2 className="font-serif text-2xl mb-4">
        이 이미지로는 디자인 크리틱이 어려워요
      </h2>
      <p className="font-sans text-sm text-neutral-600 mb-2">
        <strong>이유:</strong> {reason}
      </p>
      {suggestion && (
        <p className="font-sans text-sm text-neutral-600 mb-8">
          <strong>추천:</strong> {suggestion}
        </p>
      )}
      <button
        onClick={onRetry}
        className="mt-4 px-6 py-3 bg-neutral-900 text-white font-medium hover:bg-neutral-800 transition-colors"
      >
        다시 올리기
      </button>
    </div>
  )
}
