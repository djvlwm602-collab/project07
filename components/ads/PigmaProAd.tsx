/**
 * Role: Figma 패러디 광고 인터스티셜 컴포넌트 (280px 높이)
 * Key Features: Mock 디자인 툴 UI, CSS keyframes 애니메이션 (커서 이동, 컬러 사이클, 펄스)
 * Dependencies: 없음 (순수 JSX + inline style)
 * Notes: server component (정적 마크업) — 'use client' 금지. keyframe 이름 prefix `pigma-`로 충돌 방지. CSS keyframe 값은 디자인 의도이므로 수정 금지.
 */
export function PigmaProAd() {
  return (
    <div className="relative h-[280px] overflow-hidden bg-[#1e1b4b] text-white rounded">
      <style>{`
        @keyframes pigma-cursor {
          0% { transform: translate(40px, 30px) rotate(-12deg); }
          25% { transform: translate(160px, 50px) rotate(-12deg); }
          50% { transform: translate(180px, 100px) rotate(-12deg); }
          75% { transform: translate(60px, 130px) rotate(-12deg); }
          100% { transform: translate(40px, 30px) rotate(-12deg); }
        }
        @keyframes pigma-color { 0%{background:#f43f5e}33%{background:#06b6d4}66%{background:#f59e0b}100%{background:#f43f5e} }
        @keyframes pigma-scale { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
        @keyframes pigma-pulse { 0%,100%{background:rgba(255,255,255,0.12)} 50%{background:rgba(255,255,255,0.25)} }
        @keyframes pigma-peek { 0%,80%,100%{transform:translateY(0)} 85%,95%{transform:translateY(-3px)} }
      `}</style>

      {/* Mock app interface */}
      <div className="absolute top-8 left-3 right-3 bottom-[60px] bg-[#0f0d2e] rounded grid grid-cols-[60px_1fr_60px] overflow-hidden shadow-lg">
        {/* Layers panel */}
        <div className="bg-[#181537] p-2 flex flex-col gap-1.5 border-r border-white/5">
          <div className="text-[8px] opacity-40 uppercase tracking-wide px-0.5">Layers</div>
          <div className="flex items-center gap-1 px-1 py-0.5 bg-indigo-500/25 rounded-sm">
            <div className="w-2 h-2 bg-indigo-500" />
            <div className="text-[8px] opacity-90">Frame</div>
          </div>
          <div className="flex items-center gap-1 px-1 py-0.5" style={{ animation: "pigma-pulse 2s infinite" }}>
            <div className="w-2 h-2 bg-violet-400 rounded-full" />
            <div className="text-[8px] opacity-70">Circle</div>
          </div>
          <div className="flex items-center gap-1 px-1 py-0.5">
            <div className="w-2 h-2 bg-rose-500" />
            <div className="text-[8px] opacity-70">Shape</div>
          </div>
          <div className="flex items-center gap-1 px-1 py-0.5 opacity-50">
            <div className="w-2 h-2 bg-pink-200 rounded-full" />
            <div className="text-[8px] opacity-60">🐷</div>
          </div>
        </div>

        {/* Canvas */}
        <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg,#1e1b4b,#312e81)" }}>
          <div className="absolute inset-0 opacity-60" style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "12px 12px",
          }} />
          <div className="absolute top-6 left-7 w-[60px] h-8 rounded shadow-md" style={{ animation: "pigma-color 3s infinite, pigma-scale 2s infinite" }} />
          <div className="absolute top-[70px] left-[110px] w-6 h-6 rounded-full bg-violet-400" style={{ animation: "pigma-scale 1.8s infinite", boxShadow: "0 2px 8px rgba(167,139,250,0.5)" }} />
          <div className="absolute top-[115px] left-7 w-[120px] h-2 bg-white/40 rounded-sm" />
          <div className="absolute top-[130px] left-7 w-20 h-1.5 bg-white/25 rounded-sm" />

          <div className="absolute" style={{ animation: "pigma-cursor 5s infinite ease-in-out" }}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="#10b981">
              <path d="M0,0 L0,12 L4,8 L7,14 L9,13 L6,7 L11,7 Z" />
            </svg>
            <div className="absolute top-[18px] left-[14px] bg-emerald-500 text-white text-[8px] px-1.5 py-0.5 rounded-sm font-medium whitespace-nowrap">
              Yuna
            </div>
          </div>
        </div>

        {/* Inspector */}
        <div className="bg-[#181537] p-2 border-l border-white/5 relative">
          <div className="text-[8px] opacity-40 uppercase tracking-wide px-0.5 mb-1.5">Fill</div>
          <div className="flex gap-0.5 mb-2">
            <div className="w-3.5 h-3.5 rounded-sm" style={{ animation: "pigma-color 3s infinite" }} />
          </div>
          <div className="text-[8px] opacity-40 uppercase tracking-wide px-0.5 mb-1.5">Size</div>
          <div className="text-[8px] opacity-70 px-0.5">W 60</div>
          <div className="text-[8px] opacity-70 px-0.5">H 32</div>
          <div className="absolute bottom-2 right-1.5 text-sm" style={{ animation: "pigma-peek 4s infinite" }}>🐷</div>
        </div>
      </div>

      {/* Brand bar */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-3" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.5))" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative w-[18px] h-6">
              <div className="absolute top-0 left-0 w-2 h-2 bg-pink-200" style={{ borderRadius: "50% 50% 50% 0" }} />
              <div className="absolute top-0 left-2 w-2 h-2 bg-purple-500 rounded-full" />
              <div className="absolute top-2 left-0 w-2 h-2 bg-cyan-500" style={{ borderRadius: "50% 0 50% 50%" }} />
              <div className="absolute top-2 left-2 w-2 h-2 bg-emerald-500" style={{ borderRadius: "0 50% 50% 50%" }} />
              <div className="absolute top-4 left-0 w-2 h-2 bg-amber-500" style={{ borderRadius: "50% 50% 0 50%" }} />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight">Pigma <span className="font-normal opacity-70">Pro</span></div>
              <div className="text-[10px] opacity-65">실시간 협업 · 디자이너 100만이 선택한 그것™</div>
            </div>
          </div>
          <button className="bg-white text-[#1e1b4b] border-0 px-3.5 py-1.5 rounded text-[11px] font-semibold">
            7일 무료 →
          </button>
        </div>
      </div>
    </div>
  )
}
