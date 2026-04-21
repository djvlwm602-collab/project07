/**
 * Role: 6개의 PersonaCard를 반응형 그리드로 배치하는 컨테이너
 * Key Features: 1/2/3 columns 반응형 레이아웃, 잠금 해제 콜백 위임
 * Dependencies: components/PersonaCard, lib/types (PersonaCardState, PersonaId)
 * Notes: T19 결과 페이지에서 사용. 'use client' 필수 (자식 카드가 콜백 prop 수신).
 */
"use client"

import { PersonaCard } from "./PersonaCard"
import type { PersonaCardState, PersonaId } from "@/lib/types"

type Props = {
  states: PersonaCardState[]
  onUnlock: (id: PersonaId) => void
}

// 6개 페르소나 카드를 그리드로 렌더하고 각 카드의 잠금 해제 클릭을 부모로 전달
export function ResultGrid({ states, onUnlock }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {states.map((state) => (
        <PersonaCard
          key={state.id}
          state={state}
          onUnlockClick={() => onUnlock(state.id)}
        />
      ))}
    </div>
  )
}
