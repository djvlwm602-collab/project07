/**
 * Role: 5초 카운트다운과 랜덤 광고 컴포넌트를 표시하는 모달
 * Key Features: 5초 카운트다운, 광고 랜덤 선택, ESC/배경 클릭으로 닫기 (5초 후)
 * Dependencies: ./ads/PigmaProAd, ./ads/NoCodeKingAd
 * Notes: 카운트다운 종료 전에는 닫기 버튼/ESC/배경 클릭 모두 비활성. 크리틱 페이지의 블러 카드 잠금해제 때 사용.
 */
"use client"

import { useEffect, useRef, useState } from "react"
import { PigmaProAd } from "./ads/PigmaProAd"
import { NoCodeKingAd } from "./ads/NoCodeKingAd"

const COUNTDOWN_SECONDS = 5

type Props = {
  open: boolean
  onClose: () => void  // 광고 시청 완료 후 호출
  onCancel: () => void // 사용자가 닫기 (5초 후에만 가능)
}

const ADS = [PigmaProAd, NoCodeKingAd]

export function AdModal({ open, onClose, onCancel }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS)
  const skipBtnRef = useRef<HTMLButtonElement>(null)

  // 모달이 닫혀있는 동안 다음에 표시할 광고 인덱스를 미리 순환시켜 놓음.
  // 첫 paint 시점에 이미 올바른 광고가 선택되어 있어 flash 없이 번갈아 노출.
  const [adIndex, setAdIndex] = useState(0)
  useEffect(() => {
    if (!open) setAdIndex((i) => (i + 1) % ADS.length)
  }, [open])
  const AdComponent = ADS[adIndex]

  // 카운트다운
  useEffect(() => {
    if (!open) return
    setSecondsLeft(COUNTDOWN_SECONDS)
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [open])

  // ESC 키 (5초 후에만 동작)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && secondsLeft === 0) onCancel()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, secondsLeft, onCancel])

  // 5초 도달 시 skip 버튼에 포커스
  useEffect(() => {
    if (secondsLeft === 0 && skipBtnRef.current) skipBtnRef.current.focus()
  }, [secondsLeft])

  if (!open) return null

  const skip = () => {
    if (secondsLeft > 0) return
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="광고"
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && secondsLeft === 0) onCancel()
      }}
    >
      <div className="w-full max-w-sm">
        <div className="overflow-hidden rounded-t-apple-lg">
          <AdComponent />
        </div>

        <div className="bg-white p-3 flex items-center justify-between rounded-b-apple-lg">
          <div className="text-[12px] text-apple-text/60" aria-live="polite">
            {secondsLeft > 0 ? `${secondsLeft}초 후 건너뛰기` : "건너뛰기 가능"}
          </div>
          <button
            ref={skipBtnRef}
            onClick={skip}
            disabled={secondsLeft > 0}
            className="px-4 py-1.5 text-[13px] bg-apple-blue text-white rounded-pill disabled:bg-apple-text/20 disabled:cursor-not-allowed hover:brightness-110 transition"
          >
            {secondsLeft > 0 ? `${secondsLeft}` : "건너뛰기 ✕"}
          </button>
        </div>

        <p className="text-[10px] text-white/60 text-center mt-2">
          * CRIT.의 가상 광고입니다.
        </p>
      </div>
    </div>
  )
}
