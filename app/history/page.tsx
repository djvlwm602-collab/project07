/**
 * Role: 과거 크리틱 세션 목록 페이지 — glass dark nav + 라이트 그레이 배경
 * Key Features: localStorage에서 히스토리 로드, HistoryList 렌더링
 * Dependencies: components/HistoryList, lib/storage(loadHistory), lib/types
 * Notes: useEffect로 클라이언트 마운트 후 로드 — SSR 시 storage 접근 방지
 */
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { HistoryList } from "@/components/HistoryList"
import { loadHistory } from "@/lib/storage"
import type { CritiqueSession } from "@/lib/types"

export default function HistoryPage() {
  const [sessions, setSessions] = useState<CritiqueSession[]>([])

  useEffect(() => {
    setSessions(loadHistory())
  }, [])

  return (
    <main className="min-h-screen bg-apple-gray">
      <nav className="sticky top-0 z-40 h-12 bg-black/80 backdrop-blur-[20px] backdrop-saturate-[1.8] text-white">
        <div className="max-w-[1120px] mx-auto h-full px-6 flex items-center justify-between">
          <Link
            href="/"
            aria-label="CRIT. 홈으로"
            className="font-serif italic text-[17px] tracking-tight hover:opacity-80 transition-opacity"
          >
            CRIT<span className="not-italic">.</span>
          </Link>
          <Link
            href="/critique"
            className="text-[12px] text-white/80 hover:text-white transition-colors"
          >
            새 크리틱
          </Link>
        </div>
      </nav>
      <HistoryList sessions={sessions} />
    </main>
  )
}
