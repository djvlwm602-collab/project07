import type { Metadata } from "next"
import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google"
import "./globals.css"

const sans = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
})

const serif = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-serif",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Critic 6 — 6개 회사 페르소나의 디자인 크리틱",
  description: "당신의 디자인을 토스, 쿠팡, 네이버, 당근, 배민, 카카오의 PO·디자인 리드 페르소나에게 동시에 물어보세요.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${sans.variable} ${serif.variable}`}>
      <body className="bg-white text-neutral-900 font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
