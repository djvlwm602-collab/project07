/**
 * Role: CRIT. 워드마크 로고 — 세리프 이탤릭, 마지막 점은 not-italic으로 강세
 * Key Features: 홈(/) 이동, default/large 두 사이즈, light/dark 컬러, aria-label
 * Dependencies: next/link
 * Notes: server component.
 */
import Link from "next/link"

type Props = {
  size?: "default" | "large"
  color?: "dark" | "light"
  className?: string
}

export function Logo({ size = "default", color = "dark", className = "" }: Props) {
  const sizeClass = size === "large" ? "text-5xl md:text-6xl" : "text-[17px]"
  const colorClass = color === "light" ? "text-white" : "text-apple-text"
  return (
    <Link
      href="/"
      aria-label="CRIT. 홈으로"
      className={`font-serif italic tracking-tight hover:opacity-80 transition-opacity ${sizeClass} ${colorClass} ${className}`}
    >
      CRIT<span className="not-italic">.</span>
    </Link>
  )
}
