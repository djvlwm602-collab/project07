/**
 * Role: 랜딩 페이지에서 6개 페르소나를 Apple 스타일 카드 그리드로 미리보기
 * Key Features: 라이트 그레이 섹션(블랙 Hero와 alternating), 화이트 카드 + apple-card shadow, 브랜드 컬러 닷
 * Dependencies: @/lib/personas (PERSONAS)
 * Notes: server component. #personas 앵커로 Hero의 "페르소나 보기" 링크 타겟.
 */
import { PERSONAS } from "@/lib/personas"

export function PersonaPreviewGrid() {
  return (
    <section id="personas" className="bg-apple-gray">
      <div className="max-w-[980px] mx-auto px-6 py-20 md:py-28">
        <p className="text-[12px] uppercase tracking-[0.2em] text-apple-text/60 text-center mb-3">
          Personas
        </p>
        <h2 className="text-[32px] md:text-[40px] font-semibold leading-apple-section tracking-[-0.003em] text-apple-text text-center mb-14">
          6명의 시그니처 관점
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PERSONAS.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-apple p-6 min-h-[200px] flex flex-col shadow-apple-card"
            >
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: p.brandColor }}
                />
                <span className="text-[11px] uppercase tracking-[0.12em] text-apple-text/60">
                  {p.company} · {p.role}
                </span>
              </div>

              <h3 className="text-[21px] leading-apple-card tracking-apple-card-title font-bold text-apple-text mb-4">
                {p.title}
              </h3>

              <p className="text-[15px] text-apple-text/75 leading-apple-body italic">
                &ldquo;{p.oneLineQuote}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
