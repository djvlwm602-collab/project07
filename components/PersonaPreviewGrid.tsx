/**
 * Role: 랜딩 페이지에서 6개 페르소나를 카드 그리드로 미리보기
 * Key Features: PERSONAS 정적 데이터 매핑, 브랜드 컬러 닷, 한 줄 인용구 표시
 * Dependencies: @/lib/personas (PERSONAS)
 * Notes: server component (정적 데이터만 사용) — 'use client' 금지
 */
import { PERSONAS } from "@/lib/personas"

export function PersonaPreviewGrid() {
  return (
    <section className="max-w-5xl mx-auto px-6 py-16">
      <p className="font-sans text-xs uppercase tracking-[0.2em] text-neutral-500 text-center mb-8">
        Personas
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {PERSONAS.map((p) => (
          <div key={p.id} className="border border-neutral-200 p-6 hover:border-neutral-400 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.brandColor }} />
              <span className="font-sans text-xs uppercase tracking-wider text-neutral-500">
                {p.company} · {p.role}
              </span>
            </div>
            <h3 className="font-serif text-xl mb-3 text-neutral-900">{p.title}</h3>
            <p className="font-sans text-sm italic text-neutral-600 leading-relaxed">
              "{p.oneLineQuote}"
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
