/**
 * Role: 랜딩의 리뷰어 라인업 — 로고 무한 마키 스트립 (6개 브랜드 로고 가로 스크롤)
 * Key Features: 센터 정렬 헤더, 로고 세트 2회 반복 + translateX(-50%) 마키, 양 끝 ProgressiveBlur 페이드
 * Dependencies: @/lib/personas (PERSONAS, PERSONA_LOGO), @/components/ProgressiveBlur
 * Notes: 'use client' — ProgressiveBlur(motion/react) 사용. 애니메이션은 tailwind `animate-marquee` keyframe.
 */
"use client"

import { PERSONAS, PERSONA_LOGO } from "@/lib/personas"
import type { Persona } from "@/lib/types"
import { ProgressiveBlur } from "@/components/ProgressiveBlur"

export function ReviewerLineup() {
  // 매끄러운 무한 루프를 위해 두 세트 연달아 렌더 (-50% 이동 시 정확히 한 세트 지남)
  const loop = [...PERSONAS, ...PERSONAS]

  return (
    <section
      aria-label="현재 리뷰 가능한 리뷰어 목록"
      className="bg-apple-gray"
    >
      <div className="max-w-[1120px] mx-auto px-6 py-20 md:py-24">
        <h2 className="text-[32px] md:text-[40px] font-bold leading-apple-section tracking-[-0.003em] text-apple-text text-center mb-14">
          지금 만날 수 있는 리뷰어
        </h2>

        {/* 마키 스트립 — 양 끝에 블러 + 바탕색 그라데이션을 중첩 */}
        <div className="relative overflow-hidden py-2">
          <div className="flex gap-20 whitespace-nowrap w-max animate-marquee">
            {loop.map((p, i) => (
              <ReviewerLogo key={`${p.id}-${i}`} persona={p} />
            ))}
          </div>

          {/* 왼쪽 끝: 배경색 fade-out (apple-gray → transparent) */}
          <div className="pointer-events-none absolute left-0 top-0 h-full w-32 md:w-48 z-10 bg-gradient-to-r from-apple-gray via-apple-gray/70 to-transparent" />
          {/* 왼쪽 끝: 진행형 블러 레이어 */}
          <ProgressiveBlur
            direction="left"
            blurLayers={10}
            blurIntensity={1}
            className="pointer-events-none absolute left-0 top-0 h-full w-32 md:w-48 z-20"
          />

          {/* 오른쪽 끝: 배경색 fade-out */}
          <div className="pointer-events-none absolute right-0 top-0 h-full w-32 md:w-48 z-10 bg-gradient-to-l from-apple-gray via-apple-gray/70 to-transparent" />
          {/* 오른쪽 끝: 진행형 블러 */}
          <ProgressiveBlur
            direction="right"
            blurLayers={10}
            blurIntensity={1}
            className="pointer-events-none absolute right-0 top-0 h-full w-32 md:w-48 z-20"
          />
        </div>
      </div>
    </section>
  )
}

function ReviewerLogo({ persona }: { persona: Persona }) {
  const logo = PERSONA_LOGO[persona.id]
  return (
    <div
      className="flex-shrink-0 flex items-center gap-3"
      aria-label={`${persona.company} ${persona.role}`}
    >
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-[12px] leading-none"
        style={{
          backgroundColor: persona.brandColor,
          color: logo.dark ? "#1d1d1f" : "#fff",
        }}
      >
        {logo.text}
      </div>
      <div className="flex flex-col">
        <span className="text-[11px] uppercase tracking-[0.12em] text-apple-text/55">
          {persona.company}
        </span>
        <span className="text-[15px] font-semibold text-apple-text">
          {persona.title}
        </span>
      </div>
    </div>
  )
}
