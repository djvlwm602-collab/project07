/**
 * Role: 사용자가 받은 과거 크리틱 세션 목록을 보여주는 페이지
 * Key Features: localStorage에서 히스토리 로드, HistoryList 렌더링, 상단 네비
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
    <main className="min-h-screen">
      <nav className="px-6 py-4 flex justify-between items-center border-b border-neutral-100">
        <Link href="/" className="font-serif text-xl">Critic 6</Link>
        <Link href="/critique" className="text-sm text-neutral-600 hover:text-neutral-900">
          새 크리틱
        </Link>
      </nav>
      <HistoryList sessions={sessions} />
    </main>
  )
}
