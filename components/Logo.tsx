/**
 * Role: CRIT. 워드마크 로고 — 세리프 이탤릭, 마지막 점은 not-italic으로 강세
 * Key Features: 클릭 시 홈(/)으로, default/large 두 사이즈, aria-label 제공
 * Dependencies: next/link
 * Notes: server component (Link는 server에서도 사용 가능).
 */
import Link from "next/link"

type Props = {
  size?: "default" | "large"
  className?: string
}

export function Logo({ size = "default", className = "" }: Props) {
  const sizeClass = size === "large" ? "text-5xl md:text-6xl" : "text-xl"
  return (
    <Link
      href="/"
      aria-label="CRIT. 홈으로"
      className={`font-serif italic tracking-tight text-neutral-900 hover:opacity-80 transition-opacity ${sizeClass} ${className}`}
    >
      CRIT<span className="not-italic">.</span>
    </Link>
  )
}
