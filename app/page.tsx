/**
 * Role: Critic 6 랜딩 페이지 — Apple 스타일 glass nav, 블랙 Hero, 라이트 그레이 Personas 섹션
 * Key Features: sticky dark translucent nav(blur+saturate), Hero ↔ Personas alternating, 블랙 footer
 * Dependencies: components/Hero, components/PersonaPreviewGrid, next/link
 */
import { Hero } from "@/components/Hero"
import { PersonaPreviewGrid } from "@/components/PersonaPreviewGrid"
import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Apple 시그니처 glass nav: 다크 반투명 + 블러 */}
      <nav className="sticky top-0 z-40 h-12 bg-black/80 backdrop-blur-[20px] backdrop-saturate-[1.8] text-white">
        <div className="max-w-[980px] mx-auto h-full px-6 flex items-center justify-between text-[12px]">
          <Link href="/" className="font-semibold tracking-tight">
            Critic 6
          </Link>
          <Link href="/history" className="text-white/80 hover:text-white">
            내 크리틱
          </Link>
        </div>
      </nav>

      <Hero />
      <PersonaPreviewGrid />

      <footer className="bg-apple-black text-white/60 py-12 text-center text-[12px] tracking-apple-caption">
        © 2026 Critic 6 · 가상 광고 · 페르소나는 패러디 목적입니다.
      </footer>
    </main>
  )
}
