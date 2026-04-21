/**
 * Role: 랜딩의 리뷰어 라인업 섹션 — 현재 리뷰 가능한 리뷰어 카드 + Coming 슬롯으로 확장 가능성 시각화
 * Key Features: 반응형 그리드(모바일 2열/태블릿 3열/데스크톱 4열), 카드 좌측 3px 시그니처 바,
 *               hover 테두리 강조, 마지막 셀은 점선 Coming 슬롯
 * Dependencies: @/lib/personas (PERSONAS) — 코드 식별자는 Persona 유지, 사용자 대면 카피만 "리뷰어"
 * Notes: server component. 리뷰어 풀이 늘어나도 카피 수정 없이 카드만 추가하면 확장 가능.
 */
import { PERSONAS } from "@/lib/personas"

export function ReviewerLineup() {
  return (
    <section
      aria-label="현재 리뷰 가능한 리뷰어 목록"
      className="border-t border-neutral-100"
    >
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="flex justify-between items-end mb-10 flex-wrap gap-3">
          <h2 className="font-serif text-3xl md:text-4xl text-neutral-900 tracking-tight">
            지금 만날 수 있는 리뷰어
          </h2>
          <p className="text-xs text-neutral-500">리뷰어는 계속 추가됩니다</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {PERSONAS.map((p) => (
            <article
              key={p.id}
              className="relative bg-white rounded-2xl p-5 pl-6 border border-neutral-200 hover:border-neutral-900 transition-colors"
            >
              {/* 회사 시그니처 컬러 3px 세로 바 (1포인트 액센트) */}
              <div
                className="absolute left-3 top-5 bottom-5 w-[3px] rounded-full"
                style={{ backgroundColor: p.brandColor }}
                aria-hidden
              />
              <p className="text-[11px] uppercase tracking-widest text-neutral-500 mb-2">
                {p.company} · {p.role}
              </p>
              <h3 className="font-serif text-xl text-neutral-900 mb-3 leading-tight">
                {p.title}
              </h3>
              <p className="text-sm italic text-neutral-600 leading-relaxed">
                &ldquo;{p.oneLineQuote}&rdquo;
              </p>
            </article>
          ))}

          {/* Coming 슬롯 — 리뷰어 풀 확장을 시각적으로 시사 */}
          <article
            aria-label="추후 추가될 리뷰어"
            className="rounded-2xl p-5 border border-dashed border-neutral-300 flex flex-col items-center justify-center text-center min-h-[180px]"
          >
            <p className="font-serif text-xl text-neutral-500 mb-2">Coming</p>
            <p className="text-xs text-neutral-400 leading-relaxed">
              더 많은 리뷰어가
              <br />
              합류할 예정입니다
            </p>
          </article>
        </div>
      </div>
    </section>
  )
}
