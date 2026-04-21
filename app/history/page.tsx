/**
 * Role: 과거 크리틱 세션 목록 페이지 — Apple 스타일 glass nav + 라이트 그레이 배경
 * Key Features: localStorage에서 히스토리 로드, HistoryList 렌더링
 * Dependencies: components/HistoryList, lib/storage(loadHistory), lib/types
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
        <div className="max-w-[1120px] mx-auto h-full px-6 flex items-center justify-between text-[12px]">
          <Link href="/" className="font-semibold tracking-tight">
            Critic 6
          </Link>
          <Link href="/critique" className="text-white/80 hover:text-white">
            새 크리틱
          </Link>
        </div>
      </nav>
      <HistoryList sessions={sessions} />
    </main>
  )
}
