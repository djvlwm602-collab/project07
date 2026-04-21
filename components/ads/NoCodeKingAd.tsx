/**
 * Role: NoCodeKing AI 패러디 광고 인터스티셜 컴포넌트 (280px 높이)
 * Key Features: Before/After 카드 비교 UI, CSS keyframes 애니메이션 (펄스, 스케일)
 * Dependencies: 없음 (순수 JSX + inline style)
 * Notes: server component (정적 마크업) — 'use client' 금지. keyframe 이름 prefix `nck-`로 충돌 방지. CSS keyframe 값은 디자인 의도이므로 수정 금지.
 */
export function NoCodeKingAd() {
  return (
    <div className="relative h-[280px] overflow-hidden bg-black text-white rounded">
      <style>{`
        @keyframes nck-pulse { 0%,100%{box-shadow:0 0 0 rgba(168,85,247,0)} 50%{box-shadow:0 0 30px rgba(168,85,247,0.6)} }
        @keyframes nck-scale { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
      `}</style>

      <div className="absolute top-10 left-5 right-5 grid grid-cols-2 gap-2 h-[140px]">
        <div className="bg-[#1f1f2e] rounded p-3">
          <div className="text-[9px] opacity-50 mb-1.5">BEFORE</div>
          <div className="h-2 bg-neutral-700 rounded mb-1" />
          <div className="h-2 bg-neutral-700 rounded mb-1 w-[70%]" />
          <div className="h-5 bg-neutral-600 rounded mt-2.5" />
        </div>
        <div
          className="rounded p-3"
          style={{ background: "linear-gradient(135deg,#3b82f6,#a855f7)", animation: "nck-pulse 2s infinite, nck-scale 3s infinite" }}
        >
          <div className="text-[9px] opacity-90 mb-1.5">AFTER ✨</div>
          <div className="h-2 bg-white/90 rounded mb-1" />
          <div className="h-2 bg-white/90 rounded mb-1 w-[70%]" />
          <div className="h-5 bg-white/95 rounded mt-2.5" />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="text-lg font-bold mb-0.5" style={{
          background: "linear-gradient(90deg,#fff,#a78bfa)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>NoCodeKing AI</div>
        <div className="text-[11px] opacity-70">코드 한 줄 없이 — AI가 앱을 만들어 드립니다</div>
      </div>
    </div>
  )
}
