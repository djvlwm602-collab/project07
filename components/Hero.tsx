/**
 * Role: 랜딩 페이지 상단 Apple 스타일 Hero — 블랙 배경 + 56px display headline + CTA 2개
 * Key Features: cinematic 블랙 섹션, Apple Blue primary CTA, 라이트 링크, 섹션 alternating 시작
 * Dependencies: next/link
 * Notes: server component. Apple 디자인 토큰(tailwind.config) + .apple-display(globals.css) 사용.
 */
import Link from "next/link"

export function Hero() {
  return (
    <section className="bg-apple-black text-white">
      <div className="max-w-[980px] mx-auto px-6 pt-28 pb-24 md:pt-40 md:pb-32 text-center">
        <p className="text-[12px] md:text-[13px] uppercase tracking-[0.2em] text-white/60 mb-6">
          Critic 6
        </p>

        <h1 className="apple-display text-[40px] md:text-[56px]">
          당신의 디자인을
          <br />
          <span className="text-white/70">6개 회사 페르소나</span>에게
          <br />
          물어보세요.
        </h1>

        <p className="mt-7 mx-auto max-w-xl text-[19px] md:text-[21px] leading-apple-card tracking-apple-card-title text-white/70">
          토스 PO, 카카오 디자인 리드 등 한국 IT 업계의 시그니처 페르소나가 당신의 작업을 동시에 크리틱합니다.
        </p>

        <div className="mt-10 flex items-center justify-center gap-5 flex-wrap">
          <Link
            href="/critique"
            className="inline-flex items-center justify-center bg-apple-blue text-white rounded-apple px-[22px] py-[10px] text-[17px] font-normal hover:brightness-110 transition"
          >
            지금 시작하기
          </Link>

          <a
            href="#personas"
            className="inline-flex items-center text-apple-link-dark text-[17px] hover:underline"
          >
            페르소나 보기 <span aria-hidden className="ml-1">›</span>
          </a>
        </div>
      </div>
    </section>
  )
}
