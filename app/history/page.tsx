/**
 * Role: 과거 크리틱 세션 목록 페이지 — Logo nav + 화이트 배경
 * Key Features: localStorage에서 히스토리 로드, HistoryList 렌더링
 * Dependencies: components/HistoryList, components/Logo, lib/storage(loadHistory), lib/types
 * Notes: useEffect로 클라이언트 마운트 후 로드 — SSR 시 storage 접근 방지
 */
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { HistoryList } from "@/components/HistoryList"
import { Logo } from "@/components/Logo"
import { loadHistory } from "@/lib/storage"
import type { CritiqueSession } from "@/lib/types"

export default function HistoryPage() {
  const [sessions, setSessions] = useState<CritiqueSession[]>([])

  useEffect(() => {
    setSessions(loadHistory())
  }, [])

  return (
    <main className="min-h-screen bg-white">
      <nav className="border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <Logo />
          <Link
            href="/critique"
            className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            새 크리틱
          </Link>
        </div>
      </nav>
      <HistoryList sessions={sessions} />
    </main>
  )
}
