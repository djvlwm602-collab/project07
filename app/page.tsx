/**
 * Role: Critic 6 랜딩 페이지 (서버 컴포넌트) — Hero, 페르소나 프리뷰, 푸터를 구성한다
 * Key Features: nav, Hero, PersonaPreviewGrid, footer
 * Dependencies: components/Hero, components/PersonaPreviewGrid, next/link
 */
import { Hero } from "@/components/Hero"
import { PersonaPreviewGrid } from "@/components/PersonaPreviewGrid"
import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen">
      <nav className="px-6 py-4 flex justify-between items-center border-b border-neutral-100">
        <span className="font-serif text-xl">Critic 6</span>
        <Link href="/history" className="font-sans text-sm text-neutral-600 hover:text-neutral-900">
          내 크리틱
        </Link>
      </nav>
      <Hero />
      <PersonaPreviewGrid />
      <footer className="py-12 text-center text-xs text-neutral-400">
        © 2026 Critic 6 · 가상 광고/페르소나는 패러디 목적입니다.
      </footer>
    </main>
  )
}
