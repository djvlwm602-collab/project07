/**
 * Role: 과거 크리틱 세션 목록 — 리뷰어 해제 수, 섬네일, 맥락, 날짜 표시
 * Key Features: 빈 상태 처리, shadow-sm + rounded-2xl Editorial 카드
 * Dependencies: next/link, lib/personas (ALL_PERSONA_IDS), lib/types (CritiqueSession)
 * Notes: 'use client'. history 페이지에서 sessions prop으로 주입.
 */
"use client"

import Link from "next/link"
import { ALL_PERSONA_IDS } from "@/lib/personas"
import type { CritiqueSession } from "@/lib/types"

type Props = {
  sessions: CritiqueSession[]
}

export function HistoryList({ sessions }: Props) {
  if (sessions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <p className="font-serif text-xl text-neutral-700 mb-4">
          아직 받은 크리틱이 없어요
        </p>
        <Link
          href="/critique"
          className="inline-flex items-center text-sm text-neutral-900 underline underline-offset-4 hover:no-underline"
        >
          첫 크리틱 받으러 가기 →
        </Link>
      </div>
    )
  }

  const total = ALL_PERSONA_IDS.length

  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <h1 className="font-serif text-3xl md:text-4xl text-neutral-900 mb-10 tracking-tight">
        내 크리틱
      </h1>
      <ul className="space-y-3">
        {sessions.map((s) => (
          <li
            key={s.id}
            className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-4 flex gap-4"
          >
            <img
              src={s.imageUrl}
              alt=""
              className="w-20 h-20 object-cover rounded-lg bg-neutral-100"
            />
            <div className="flex-1">
              <p className="text-sm text-neutral-800 mb-1">
                {s.context || "(맥락 없음)"}
              </p>
              <p className="text-xs text-neutral-500">
                {new Date(s.createdAt).toLocaleString("ko-KR")} · 리뷰어{" "}
                {s.unlockedIds.length}/{total}명 해제됨
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
