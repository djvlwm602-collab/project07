/**
 * Role: 랜딩의 리뷰어 라인업 — Apple 스토어 톤 (라이트 그레이 섹션 + 화이트 카드 + apple-card 섀도우)
 * Key Features: 반응형 그리드(모바일 2열/태블릿 3열/데스크톱 4열), 원형 프로필 아바타(결과 카드와 공유),
 *               hover 시 shadow 강조, 마지막 셀 점선 Coming 슬롯
 * Dependencies: @/lib/personas (PERSONAS, PERSONA_LOGO)
 * Notes: server component. 아바타 LOGO 매핑은 lib/personas.ts의 PERSONA_LOGO에서 단일 관리.
 */
import { PERSONAS, PERSONA_LOGO } from "@/lib/personas"
import type { Persona } from "@/lib/types"

export function ReviewerLineup() {
  return (
    <section
      aria-label="현재 리뷰 가능한 리뷰어 목록"
      className="bg-apple-gray"
    >
      <div className="max-w-[1120px] mx-auto px-6 py-20 md:py-24">
        <div className="flex justify-between items-end mb-12 flex-wrap gap-3">
          <h2 className="text-[32px] md:text-[40px] font-bold leading-apple-section tracking-[-0.003em] text-apple-text">
            지금 만날 수 있는 리뷰어
          </h2>
          <p className="text-[12px] text-apple-text/55">리뷰어는 계속 추가됩니다</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {PERSONAS.map((p) => (
            <article
              key={p.id}
              className="relative bg-white rounded-apple-lg p-6 min-h-[220px] flex flex-col shadow-apple-card hover:shadow-apple-card-hover transition-shadow"
            >
              <div className="flex items-center gap-3 mb-4">
                <Avatar persona={p} />
                <p className="text-[11px] uppercase tracking-[0.12em] text-apple-text/60 min-w-0 truncate">
                  {p.company} · {p.role}
                </p>
              </div>
              <h3 className="text-[20px] leading-apple-card tracking-apple-caption font-bold text-apple-text mb-3">
                {p.title}
              </h3>
              <p className="text-[14px] italic text-apple-text/75 leading-apple-body">
                &ldquo;{p.oneLineQuote}&rdquo;
              </p>
            </article>
          ))}

          {/* Coming 슬롯 — 리뷰어 풀 확장을 시각적으로 시사 */}
          <article
            aria-label="추후 추가될 리뷰어"
            className="rounded-apple-lg p-6 border border-dashed border-apple-text/25 flex flex-col items-center justify-center text-center min-h-[220px]"
          >
            <p className="font-serif text-xl text-apple-text/50 mb-2">Coming</p>
            <p className="text-[12px] text-apple-text/45 leading-apple-body">
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

function Avatar({ persona }: { persona: Persona }) {
  const logo = PERSONA_LOGO[persona.id]
  return (
    <div
      className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-[12px] leading-none"
      style={{
        backgroundColor: persona.brandColor,
        color: logo.dark ? "#1d1d1f" : "#fff",
      }}
      aria-label={`${persona.company} 로고`}
    >
      {logo.text}
    </div>
  )
}
