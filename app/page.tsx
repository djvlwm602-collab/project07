/**
 * Role: CRIT. 랜딩 페이지 — 헤더, Hero, 리뷰어 라인업, 진행 방식, 푸터 구성
 * Key Features: Editorial Minimal 톤(흑백 + 1포인트 액센트), 세리프 헤딩, 검정 pill CTA
 * Dependencies: components/Logo, components/ReviewerLineup, next/link
 * Notes: server component. Hero와 HowItWorks는 이 파일에 인라인(재사용 필요 없어 컴포넌트 분리 안 함).
 */
import Link from "next/link"
import { Logo } from "@/components/Logo"
import { ReviewerLineup } from "@/components/ReviewerLineup"

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <header className="max-w-6xl mx-auto px-6 py-5 flex justify-between items-center">
        <Logo />
        <Link
          href="/history"
          className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          내 크리틱
        </Link>
      </header>

      <Hero />
      <ReviewerLineup />
      <HowItWorks />

      <footer className="border-t border-neutral-100 py-12 px-6 text-center text-xs text-neutral-400 leading-relaxed">
        CRIT. · Portfolio Review by Industry Pros
        <br />본 서비스의 리뷰어는 가상의 캐릭터이며, 실제 인물·기업과 관련이 없습니다.
      </footer>
    </main>
  )
}

function Hero() {
  return (
    <section className="max-w-3xl mx-auto px-6 pt-20 pb-24 text-center">
      <p className="text-[11px] uppercase tracking-[0.24em] text-neutral-500 mb-6">
        Portfolio Review by Industry Pros
      </p>
      <h1 className="font-serif text-5xl md:text-6xl leading-[1.12] tracking-tight text-neutral-900 mb-7">
        당신의 포트폴리오를,
        <br />
        <span className="italic">전문가의 책상 위로.</span>
      </h1>
      <p className="text-base md:text-lg text-neutral-600 leading-relaxed mb-10 max-w-xl mx-auto">
        현업 PO·디자인 리드가 당신의 작업을 들여다봅니다.
        <br />
        리뷰어는 직접 고르세요. 크리틱은 5분이면 도착합니다.
      </p>
      <Link
        href="/critique"
        className="inline-flex items-center bg-neutral-900 text-white rounded-full px-6 py-3 text-base font-medium hover:bg-neutral-800 transition-colors"
      >
        내 포트폴리오 올리기 →
      </Link>
    </section>
  )
}

const STEPS = [
  {
    num: "01",
    title: "포트폴리오 올리기",
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
    <section className="bg-neutral-50 border-t border-neutral-100">
      <div className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="font-serif text-3xl md:text-4xl text-neutral-900 text-center mb-14 tracking-tight">
          이렇게 진행됩니다
        </h2>
        <ol className="grid md:grid-cols-3 gap-10">
          {STEPS.map((s) => (
            <li key={s.num} className="text-center md:text-left">
              <p className="font-serif text-2xl text-neutral-400 mb-3">{s.num}</p>
              <h3 className="font-serif text-xl text-neutral-900 mb-2">{s.title}</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
