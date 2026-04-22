import type { Metadata } from "next"
import { Noto_Serif_KR, Merriweather } from "next/font/google"
import "./globals.css"

const serif = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-serif",
  display: "swap",
})

// CRIT. 워드마크 전용 — Merriweather (균일한 획 대비, 가독성 좋은 편집 톤 세리프)
const display = Merriweather({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-display",
  display: "swap",
})

export const metadata: Metadata = {
  title: "CRIT. — 현업 PO·디자인 리드의 디자인 작업물 리뷰",
  description:
    "당신의 디자인 작업물을 전문가의 책상 위로. 현업 PO·디자인 리드가 당신의 작업을 들여다봅니다. 리뷰어는 직접 고르세요. 크리틱은 5분이면 도착합니다.",
  openGraph: {
    title: "당신의 디자인 작업물을, 전문가의 책상 위로.",
    description:
      "현업 PO·디자인 리드가 당신의 작업을 들여다봅니다. 리뷰어는 직접 고르세요.",
    siteName: "CRIT.",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CRIT. — Portfolio Review by Industry Pros",
    description: "전문가의 책상 위에, 당신의 디자인 작업물을 올려보세요.",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${serif.variable} ${display.variable}`}>
      <head>
        {/* Pretendard: 빌드 타임 @import 대신 런타임 <link>로 로드 */}
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  )
}
