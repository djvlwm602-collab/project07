import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Critic 6 — 6개 회사 페르소나의 디자인 크리틱",
  description:
    "당신의 디자인을 토스, 쿠팡, 네이버, 당근, 배민, 카카오의 PO·디자인 리드 페르소나에게 동시에 물어보세요.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* Pretendard: 빌드 타임 @import 대신 런타임 <link>로 로드 (빌드 hang 방지) */}
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
