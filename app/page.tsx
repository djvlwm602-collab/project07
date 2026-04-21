/**
 * Role: CRIT. 랜딩 — Apple 스토어 톤 비주얼 + CRIT. 리브랜딩 카피
 * Key Features: glass dark nav, 블랙 Hero(세리프 이탤릭 H1), 라이트 그레이 ReviewerLineup, 흰색 HowItWorks, 블랙 Footer
 * Dependencies: components/Logo, components/ReviewerLineup, next/link
 * Notes: server component. Hero는 블랙 배경 위 CRIT. 브랜드 아이덴티티(세리프 이탤릭) 유지.
 */
import Link from "next/link"
import { Logo } from "@/components/Logo"
import { ReviewerLineup } from "@/components/ReviewerLineup"

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Apple 시그니처 glass dark nav */}
      <nav className="sticky top-0 z-40 h-12 bg-black/80 backdrop-blur-[20px] backdrop-saturate-[1.8] text-white">
        <div className="max-w-[1120px] mx-auto h-full px-6 flex items-center justify-between">
          <Link
            href="/"
            aria-label="CRIT. 홈으로"
            className="font-serif italic text-[17px] tracking-tight hover:opacity-80 transition-opacity"
          >
            CRIT<span className="not-italic">.</span>
          </Link>
          <Link
            href="/history"
            className="text-[12px] text-white/80 hover:text-white transition-colors"
          >
            내 크리틱
          </Link>
        </div>
      </nav>

      <Hero />
      <HowItWorks />
      <ReviewerLineup />

      <footer className="bg-apple-black text-white/55 py-12 px-6 text-center text-[12px] leading-relaxed tracking-apple-caption">
        CRIT. · Portfolio Review by Industry Pros
        <br />본 서비스의 리뷰어는 가상의 캐릭터이며, 실제 인물·기업과 관련이 없습니다.
      </footer>
    </main>
  )
}

function Hero() {
  return (
    <section className="bg-apple-black text-white">
      <div className="max-w-[980px] mx-auto px-6 pt-28 pb-24 md:pt-36 md:pb-32 text-center">
        <p className="text-[11px] md:text-[12px] uppercase tracking-[0.24em] text-white/60 mb-7">
          Portfolio Review by Industry Pros
        </p>
        <h1 className="font-serif font-bold text-[44px] md:text-[64px] leading-[1.10] tracking-tight text-white mb-7">
          당신의 디자인 작업물을,
          <br />
          <span className="text-white/90">전문가의 책상 위로.</span>
        </h1>
        <p className="text-[17px] md:text-[19px] leading-apple-card text-white/70 max-w-xl mx-auto mb-10">
          현업 PO·디자인 리드가 당신의 작업을 들여다봅니다.
          <br />
          리뷰어는 직접 고르세요. 크리틱은 5분이면 도착합니다.
        </p>
        <Link
          href="/critique"
          className="inline-flex items-center justify-center bg-apple-blue text-white rounded-pill px-6 py-3 text-[17px] font-normal hover:brightness-110 transition"
        >
          내 디자인 작업물 올리기 →
        </Link>
      </div>
    </section>
  )
}

const STEPS = [
  {
    num: "01",
    title: "디자인 작업물 올리기",
    body: "스크린샷 1장 + 맥락 한 줄. 그걸로 충분합니다.",
  },
  {
    num: "02",
    title: "리뷰어 선택",
    body: "원하는 리뷰어를 고르세요. 관점이 다른 사람끼리 섞어도 좋습니다.",
  },
  {
    num: "03",
    title: "입체적 크리틱",
    body: "강점·우려·제안이 각 리뷰어의 관점으로 한 화면에 도착합니다.",
  },
]

function HowItWorks() {
  return (
    <section className="bg-white border-t border-neutral-100">
      <div className="max-w-5xl mx-auto px-6 py-20 md:py-24">
        <h2 className="text-[32px] md:text-[40px] font-bold leading-apple-section tracking-[-0.003em] text-apple-text text-center mb-14">
          이렇게 진행됩니다
        </h2>
        <ol className="grid md:grid-cols-3 gap-10">
          {STEPS.map((s) => (
            <li key={s.num} className="text-center md:text-left">
              <p className="font-serif text-2xl text-apple-text/40 mb-3">{s.num}</p>
              <h3 className="text-[21px] font-semibold leading-apple-card tracking-apple-caption text-apple-text mb-2">
                {s.title}
              </h3>
              <p className="text-[15px] text-apple-text/70 leading-apple-body">
                {s.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
