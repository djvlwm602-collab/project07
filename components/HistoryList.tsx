/**
 * Role: 과거 크리틱 세션 목록 — Apple 스타일 카드 리스트
 * Key Features: 빈 상태 처리, 화이트 카드 + apple-card shadow, 섬네일/맥락/날짜 표시
 * Dependencies: next/link, lib/types (CritiqueSession)
 * Notes: 'use client'. history 페이지에서 sessions prop으로 주입.
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
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <p className="text-[21px] text-apple-text mb-4 leading-apple-card">
          아직 받은 크리틱이 없어요
        </p>
        <Link
          href="/critique"
          className="inline-flex items-center text-apple-link text-[17px] hover:underline"
        >
          첫 크리틱 받으러 가기 <span aria-hidden className="ml-1">›</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <h1 className="text-[32px] md:text-[40px] font-semibold leading-apple-section tracking-[-0.003em] text-apple-text mb-10">
        내 크리틱
      </h1>
      <ul className="space-y-3">
        {sessions.map((s) => (
          <li
            key={s.id}
            className="bg-white rounded-apple shadow-apple-card p-4 flex gap-4"
          >
            <img
              src={s.imageUrl}
              alt=""
              className="w-20 h-20 object-cover rounded-apple-sm bg-apple-gray"
            />
            <div className="flex-1">
              <p className="text-[15px] text-apple-text mb-1">
                {s.context || "(맥락 없음)"}
              </p>
              <p className="text-[12px] text-apple-text/50 tracking-apple-caption">
                {new Date(s.createdAt).toLocaleString("ko-KR")} · 페르소나 {s.unlockedIds.length}/6 해제됨
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
