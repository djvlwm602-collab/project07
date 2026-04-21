/**
 * Role: Pixel Master (Pro Design Program) 패러디 광고 인터스티셜 컴포넌트 (280px 높이)
 * Key Features: 추천사 슬라이드 캐러셀, CSS keyframes 애니메이션 (슬라이드, 글로우)
 * Dependencies: 없음 (순수 JSX + inline style)
 * Notes: server component (정적 마크업) — 'use client' 금지. keyframe 이름 prefix `pm-`로 충돌 방지. CSS keyframe 값은 디자인 의도이므로 수정 금지.
 */
export function PixelMasterAd() {
  return (
    <div className="relative h-[280px] overflow-hidden rounded" style={{ background: "#0f1419", color: "#f5f1e8" }}>
      <style>{`
        @keyframes pm-slide {
          0%, 25% { transform: translateY(0); }
          33%, 58% { transform: translateY(-100%); }
          66%, 91% { transform: translateY(-200%); }
          100% { transform: translateY(0); }
        }
        @keyframes pm-glow {
          0%,100%{ box-shadow: 0 0 0 rgba(212,175,55,0); }
          50%{ box-shadow: 0 0 16px rgba(212,175,55,0.25); }
        }
      `}</style>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, #d4af37, transparent)" }} />

      <div className="absolute top-9 left-5 right-5 h-[120px] overflow-hidden">
        <div style={{ animation: "pm-slide 6s infinite" }}>
          {[
            { initial: "K", year: "2024", company: "TOSS", quote: "3개월 만에 시야가 완전히 달라졌습니다." },
            { initial: "P", year: "2024", company: "KAKAO", quote: "포트폴리오의 깊이가 달라졌어요." },
            { initial: "L", year: "2024", company: "NAVER", quote: "사고의 프레임을 다시 짰습니다." },
          ].map((t, i) => (
            <div key={i} className="h-[120px] py-3.5 flex items-center gap-3.5 border-b border-white/5">
              <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-serif font-semibold"
                   style={{ background: "linear-gradient(135deg,#3a4a5c,#1f2937)", color: "#d4af37" }}>
                {t.initial}
              </div>
              <div className="flex-1">
                <div className="text-[11px] opacity-50 tracking-widest uppercase mb-1">{t.year} · {t.company}</div>
                <div className="font-serif text-[13px] leading-snug opacity-95">"{t.quote}"</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 px-5 py-3.5" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.4))" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-serif text-lg tracking-wide" style={{ color: "#d4af37", animation: "pm-glow 3s infinite" }}>
              PIXEL MASTER
            </div>
            <div className="text-[10px] opacity-50 tracking-widest uppercase mt-0.5">Pro Design Program</div>
          </div>
          <div className="text-[10px] opacity-50 tracking-wide">EST. 2019</div>
        </div>
      </div>
    </div>
  )
}
