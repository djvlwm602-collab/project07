/**
 * Role: 사용자가 과거에 받은 크리틱 세션 목록을 보여주는 컴포넌트
 * Key Features: 빈 상태 처리, 세션별 썸네일/맥락/날짜/잠금 해제 수 표시
 * Dependencies: next/link, lib/types (CritiqueSession)
 * Notes: T20 history 페이지에서 사용. localStorage에서 sessions를 읽어 prop으로 전달받음.
 */
"use client"

import Link from "next/link"
import type { CritiqueSession } from "@/lib/types"

type Props = {
  sessions: CritiqueSession[]
}

export function HistoryList({ sessions }: Props) {
  if (sessions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="font-serif text-xl text-neutral-700 mb-3">아직 받은 크리틱이 없어요</p>
        <Link href="/critique" className="font-sans text-sm text-neutral-900 underline">
          첫 크리틱 받으러 가기 →
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="font-serif text-3xl mb-8">내 크리틱</h1>
      <ul className="space-y-4">
        {sessions.map((s) => (
          <li key={s.id} className="border border-neutral-200 p-4 flex gap-4">
            <img src={s.imageUrl} alt="" className="w-20 h-20 object-cover bg-neutral-100" />
            <div className="flex-1">
              <p className="font-sans text-sm text-neutral-700 mb-1">
                {s.context || "(맥락 없음)"}
              </p>
              <p className="font-sans text-xs text-neutral-400">
                {new Date(s.createdAt).toLocaleString("ko-KR")} · 페르소나 {s.unlockedIds.length}/6 해제됨
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
