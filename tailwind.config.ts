import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // 본문·UI: Pretendard
        sans: [
          "var(--font-sans)",
          "Pretendard Variable",
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "sans-serif",
        ],
        // 헤딩·브랜드 세리프 아이덴티티: Noto Serif KR
        serif: [
          "var(--font-serif)",
          "Noto Serif KR",
          "ui-serif",
          "Georgia",
          "serif",
        ],
        // CRIT. 워드마크 전용 — Merriweather (균일한 획, 편집 세리프 톤)
        display: [
          "var(--font-display)",
          "Merriweather",
          "Georgia",
          "ui-serif",
          "serif",
        ],
      },
      colors: {
        // 리뷰어 카드 3px 바에서만 포인트로 사용
        brand: {
          toss: "#0064ff",
          coupang: "#fb1d1d",
          naver: "#03c75a",
          karrot: "#ff6f0f",
          baemin: "#2ac1bc",
          kakao: "#fee500",
        },
        // Apple 시스템 팔레트
        apple: {
          black: "#000000",
          gray: "#f5f5f7",
          text: "#1d1d1f",
          blue: "#0071e3",
          link: "#0066cc",
          "link-dark": "#2997ff",
          "surface-1": "#272729",
          "surface-2": "#262628",
          "surface-3": "#28282a",
          "surface-4": "#2a2a2d",
          "button-active": "#ededf2",
          "button-light": "#fafafc",
        },
      },
      borderRadius: {
        "apple-sm": "6px",
        apple: "12px", // 일반 버튼/폼
        "apple-md": "14px",
        "apple-lg": "18px", // 카드
        "apple-xl": "22px", // 큰 패널
        pill: "980px", // Apple 시그니처 pill
      },
      boxShadow: {
        // Apple 카드 섀도우 — 매우 subtle 이중 레이어
        "apple-card":
          "0 0 1px rgba(0, 0, 0, 0.06), 0 6px 20px -4px rgba(0, 0, 0, 0.10)",
        "apple-card-hover":
          "0 0 1px rgba(0, 0, 0, 0.08), 0 12px 28px -6px rgba(0, 0, 0, 0.14)",
      },
      letterSpacing: {
        "apple-display": "-0.28px",
        "apple-body": "-0.374px",
        "apple-caption": "-0.224px",
      },
      lineHeight: {
        "apple-hero": "1.07",
        "apple-section": "1.10",
        "apple-tile": "1.14",
        "apple-card": "1.19",
        "apple-body": "1.47",
      },
      keyframes: {
        "blur-in": {
          "0%": { filter: "blur(8px)", opacity: "0" },
          "100%": { filter: "blur(0)", opacity: "1" },
        },
        "loading-dot": {
          "0%, 60%, 100%": { transform: "translateY(0)", opacity: "0.35" },
          "30%": { transform: "translateY(-6px)", opacity: "1" },
        },
        // 로고 마키 — 아이템 세트를 두 번 이어 붙여 -50% 이동으로 매끄러운 무한 루프
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "blur-in": "blur-in 0.4s ease-out",
        "loading-dot": "loading-dot 1.4s ease-in-out infinite",
        marquee: "marquee 30s linear infinite",
      },
    },
  },
  plugins: [],
}

export default config
