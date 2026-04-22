/**
 * Role: 크리틱 제출 후 결과 도착 전까지 보여주는 전체화면 로딩 UI
 * Key Features: 원형 회전 스피너, rotating 한 줄 메시지, 하단 bouncing dots
 * Dependencies: 없음 (pure UI)
 * Notes: 'use client' 필수 — setInterval 기반 메시지 회전.
 */
"use client"

import { useEffect, useState } from "react"

// 리뷰어별 성격이 드러나는 한 줄 — 2.4초마다 순환
const ROTATING_MESSAGES = [
  "검증의 칼날이 가설을 점검하는 중이에요",
  "전환의 무사가 지표를 뒤져보는 중이에요",
  "스케일의 눈이 수천만 사용자를 떠올리는 중이에요",
  "동네의 온도를 맞춰보는 중이에요",
  "B급의 미학을 매만지는 중이에요",
  "관계의 결을 따라가는 중이에요",
]

export function LoadingStage() {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setIdx((i) => (i + 1) % ROTATING_MESSAGES.length),
      2400
    )
    return () => clearInterval(id)
  }, [])

  return (
    <div className="text-center">
      {/* 원형 회전 스피너 */}
      <div
        className="mx-auto mb-9 w-14 h-14 rounded-full border-[3px] border-apple-text/10 border-t-apple-blue animate-spin"
        aria-hidden
      />

      <div className="text-[28px] md:text-[32px] font-bold tracking-[-0.003em] text-apple-text mb-3">
        작업을 들여다보는 중…
      </div>

      {/* rotating 서브 메시지 — h-5로 고정해 높이 점프 방지 */}
      <div
        className="text-[15px] text-apple-text/60 h-5 transition-opacity duration-300"
        aria-live="polite"
      >
        {ROTATING_MESSAGES[idx]}
      </div>
    </div>
  )
}
