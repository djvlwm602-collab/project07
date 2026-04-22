/**
 * Role: 방향별 점진적 블러(progressive blur) 오버레이 — 카로셀/마키 양 끝의 페이드아웃용
 * Key Features: 방향(top/right/bottom/left), 레이어 수, 블러 강도 조절 가능
 * Dependencies: motion/react, @/lib/utils (cn)
 * Notes: 'use client' — framer motion(motion) 기반. 절대 위치로 쓰며 부모가 relative여야 함.
 */
"use client"

import { cn } from "@/lib/utils"
import { HTMLMotionProps, motion } from "motion/react"

export const GRADIENT_ANGLES = {
  top: 0,
  right: 90,
  bottom: 180,
  left: 270,
}

export type ProgressiveBlurProps = {
  direction?: keyof typeof GRADIENT_ANGLES
  blurLayers?: number
  className?: string
  blurIntensity?: number
} & HTMLMotionProps<"div">

export function ProgressiveBlur({
  direction = "bottom",
  blurLayers = 8,
  className,
  blurIntensity = 0.25,
  ...props
}: ProgressiveBlurProps) {
  const layers = Math.max(blurLayers, 2)
  const segmentSize = 1 / (blurLayers + 1)

  return (
    <div className={cn("relative", className)}>
      {Array.from({ length: layers }).map((_, index) => {
        const angle = GRADIENT_ANGLES[direction]
        const gradientStops = [
          index * segmentSize,
          (index + 1) * segmentSize,
          (index + 2) * segmentSize,
          (index + 3) * segmentSize,
        ].map(
          (pos, posIndex) =>
            `rgba(255, 255, 255, ${
              posIndex === 1 || posIndex === 2 ? 1 : 0
            }) ${pos * 100}%`
        )

        const gradient = `linear-gradient(${angle}deg, ${gradientStops.join(
          ", "
        )})`

        return (
          <motion.div
            key={index}
            className="pointer-events-none absolute inset-0 rounded-[inherit]"
            style={{
              maskImage: gradient,
              WebkitMaskImage: gradient,
              backdropFilter: `blur(${index * blurIntensity}px)`,
            }}
            {...props}
          />
        )
      })}
    </div>
  )
}
