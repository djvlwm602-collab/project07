import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // 본문·UI: Pretendard (한국어 최적화)
        sans: [
          "var(--font-sans)",
          "Pretendard Variable",
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "sans-serif",
        ],
        // 헤딩: Noto Serif KR (Editorial Minimal 톤)
        serif: [
          "var(--font-serif)",
          "Noto Serif KR",
          "ui-serif",
          "Georgia",
          "serif",
        ],
      },
      colors: {
        // 각 리뷰어의 회사 시그니처 컬러 — 카드 좌측 3px 바에서만 포인트로 사용
        brand: {
          toss: "#0064ff",
          coupang: "#fb1d1d",
          naver: "#03c75a",
          karrot: "#ff6f0f",
          baemin: "#2ac1bc",
          kakao: "#fee500",
        },
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
