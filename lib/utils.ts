/**
 * Role: Tailwind className 병합 유틸 — clsx + tailwind-merge 조합
 * Key Features: cn() — 조건부 클래스 + Tailwind 충돌 자동 해결
 * Dependencies: clsx, tailwind-merge
 */
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
