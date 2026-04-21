import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Apple 디자인 시스템: SF Pro 계열 → 한국어 최적화 Pretendard 우선, Mac은 SF Pro로 fallback
        sans: [
          "Pretendard Variable",
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "SF Pro Text",
          "system-ui",
          "Helvetica Neue",
          "sans-serif",
        ],
        // 기존 마크업 호환: font-serif를 사용하던 headline들이 그대로 동작하도록 동일 스택 매핑
        serif: [
          "Pretendard Variable",
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "system-ui",
          "sans-serif",
        ],
      },
      colors: {
        brand: {
          toss: "#0064ff",
          coupang: "#fb1d1d",
          naver: "#03c75a",
          karrot: "#ff6f0f",
          baemin: "#2ac1bc",
          kakao: "#fee500",
        },
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
        "apple-sm": "5px",
        apple: "8px",
        "apple-md": "11px",
        "apple-lg": "12px",
        pill: "980px",
      },
      boxShadow: {
        // Apple 제품 카드용 소프트 디퓨즈드 섀도우 — 시스템 전체에서 유일한 공식 섀도우
        "apple-card": "rgba(0, 0, 0, 0.22) 3px 5px 30px 0px",
      },
      letterSpacing: {
        "apple-display": "-0.28px",
        "apple-body": "-0.374px",
        "apple-caption": "-0.224px",
        "apple-micro": "-0.12px",
        "apple-tile": "0.196px",
        "apple-card-title": "0.231px",
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
      },
      animation: {
        "blur-in": "blur-in 0.4s ease-out",
      },
    },
  },
  plugins: [],
}

export default config
