/**
 * Role: 랜딩 페이지 상단 Hero 섹션 (서비스 소개 + CTA)
 * Key Features: 서비스명/슬로건 카피, /critique 진입 CTA 버튼
 * Dependencies: next/link
 * Notes: server component (정적 마크업) — 'use client' 금지
 */
import Link from "next/link"

export function Hero() {
  return (
    <section className="max-w-4xl mx-auto px-6 pt-20 pb-12 text-center">
      <p className="font-sans text-sm uppercase tracking-[0.2em] text-neutral-500 mb-6">
        Critic 6
      </p>
      <h1 className="font-serif text-5xl md:text-6xl leading-tight tracking-tight text-neutral-900 mb-6">
        당신의 디자인을<br/>
        <span className="text-neutral-500">6개 회사 페르소나</span>에게<br/>
        물어보세요.
      </h1>
      <p className="font-sans text-lg text-neutral-600 max-w-xl mx-auto mb-10 leading-relaxed">
        토스 PO, 카카오 디자인 리드 등 한국 IT 업계의 시그니처 페르소나가 당신의 작업을 동시에 크리틱합니다.
      </p>
      <Link
        href="/critique"
        className="inline-block bg-neutral-900 text-white px-8 py-4 text-base font-medium hover:bg-neutral-800 transition-colors"
      >
        지금 시작하기 →
      </Link>
    </section>
  )
}
