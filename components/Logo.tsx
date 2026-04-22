/**
 * Role: CRIT. 워드마크 로고 — Merriweather Bold (균일 획, 가독성 좋은 편집 세리프)
 * Key Features: font-display(bold 700) + 타이트 자간, default/large 사이즈, light/dark 컬러
 * Dependencies: next/link, app/layout.tsx의 Merriweather 변수
 * Notes: server component.
 */
import Link from "next/link"

type Props = {
  size?: "default" | "large"
  color?: "dark" | "light"
  className?: string
}

export function Logo({ size = "default", color = "dark", className = "" }: Props) {
  const sizeClass = size === "large" ? "text-5xl md:text-6xl" : "text-[18px]"
  const colorClass = color === "light" ? "text-white" : "text-apple-text"
  return (
    <Link
      href="/"
      aria-label="CRIT. 홈으로"
      className={`font-display font-bold tracking-[-0.015em] hover:opacity-80 transition-opacity ${sizeClass} ${colorClass} ${className}`}
    >
      CRIT.
    </Link>
  )
}
