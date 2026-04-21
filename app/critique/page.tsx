/**
 * Role: 크리틱 페이지 클라이언트 컴포넌트 — 업로드/제출/스트리밍/결과/잠금해제/거부 4가지 모드 통합
 * Key Features: idle/submitting/result/rejected 모드 전환, SSE 스트리밍, sessionStorage 복원, 광고 게이트 잠금해제
 * Dependencies: components/UploadZone, components/ResultGrid, components/ErrorScreen, components/AdModal, lib/personas, lib/storage, lib/sse, lib/gemini, lib/types
 * Notes: 'use client' 필수 (state/fetch/SSE). callPersonas는 useCallback([mode])로 mode를 캡처 — 의도된 stale closure 허용 (plan verbatim)
 */
"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { UploadZone } from "@/components/UploadZone"
import { ResultGrid } from "@/components/ResultGrid"
import { ErrorScreen } from "@/components/ErrorScreen"
import { AdModal } from "@/components/AdModal"
import { ALL_PERSONA_IDS } from "@/lib/personas"
import {
  saveCurrentSession,
  loadCurrentSession,
  clearCurrentSession,
  appendToHistory,
} from "@/lib/storage"
import { readSSE } from "@/lib/sse"
import { parsePersonaResponse } from "@/lib/gemini"
import type {
  CritiqueSession,
  PersonaCardState,
  PersonaId,
  PersonaResponse,
} from "@/lib/types"

type Mode = "idle" | "submitting" | "result" | "rejected"

function pickInitialUnlocked(): PersonaId[] {
  const shuffled = [...ALL_PERSONA_IDS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 2)
}

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export default function CritiquePage() {
  const [mode, setMode] = useState<Mode>("idle")
  const [session, setSession] = useState<CritiqueSession | null>(null)
  const [rejection, setRejection] = useState<{ reason: string; suggestion?: string } | null>(null)
  const [adState, setAdState] = useState<{ open: boolean; pendingId: PersonaId | null }>({
    open: false,
    pendingId: null,
  })
  // 스트리밍 중 누적 버퍼 (id별)
  const buffersRef = useRef<Record<string, string>>({})

  // 마운트 시 sessionStorage 복원
  useEffect(() => {
    const restored = loadCurrentSession()
    if (restored) {
      setSession(restored)
      setMode("result")
      // 진행 중이던 페르소나 재호출
      if (restored.inFlightIds.length > 0) {
        callPersonas(restored, restored.inFlightIds, /* skipGatekeeper */ true)
      }
    }
  }, [])

  // session 변할 때마다 sessionStorage 동기화
  useEffect(() => {
    if (session) saveCurrentSession(session)
  }, [session])

  // 카드 상태 도출
  const cardStates: PersonaCardState[] = session
    ? ALL_PERSONA_IDS.map((id) => {
        const isUnlocked = session.unlockedIds.includes(id)
        const isInFlight = session.inFlightIds.includes(id)
        const response = session.responses[id]
        let status: PersonaCardState["status"]
        if (!isUnlocked) status = "locked"
        else if (response) status = "unlocked-done"
        else if (isInFlight) status = "unlocked-streaming"
        else status = "unlocked-loading"
        return { id, status, content: response }
      })
    : []

  const submit = useCallback(async ({ dataUrl, context }: { dataUrl: string; context: string }) => {
    const id = makeId()
    const initialUnlocked = pickInitialUnlocked()
    const newSession: CritiqueSession = {
      id,
      imageUrl: dataUrl,
      context,
      createdAt: Date.now(),
      unlockedIds: initialUnlocked,
      responses: {},
      inFlightIds: [...initialUnlocked],
    }
    setSession(newSession)
    setMode("submitting")

    // 게이트키퍼 + 초기 2명 호출
    await callPersonas(newSession, initialUnlocked, /* skipGatekeeper */ false)
  }, [])

  const callPersonas = useCallback(
    async (currentSession: CritiqueSession, ids: PersonaId[], skipGatekeeper: boolean) => {
      try {
        const res = await fetch("/api/critique", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageDataUrl: currentSession.imageUrl,
            context: currentSession.context,
            personaIds: ids,
            skipGatekeeper,
          }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        for await (const event of readSSE(res)) {
          if (event.type === "rejected") {
            setRejection({ reason: event.reason, suggestion: event.suggestion })
            setMode("rejected")
            clearCurrentSession()
            setSession(null)
            return
          }
          if (event.type === "chunk") {
            const id = event.persona
            buffersRef.current[id] = (buffersRef.current[id] ?? "") + event.chunk
            const partial = parsePersonaResponse(buffersRef.current[id])
            setSession((prev) => {
              if (!prev) return prev
              return {
                ...prev,
                responses: { ...prev.responses, [id]: partial as PersonaResponse },
              }
            })
            if (mode !== "result") setMode("result")
          }
          if (event.type === "done") {
            const id = event.persona
            buffersRef.current[id] = ""
            setSession((prev) => {
              if (!prev) return prev
              const next: CritiqueSession = {
                ...prev,
                responses: { ...prev.responses, [id]: event.final },
                inFlightIds: prev.inFlightIds.filter((p) => p !== id),
              }
              // 모두 해제 + 모두 완료 시 히스토리에 저장
              if (
                next.unlockedIds.length === ALL_PERSONA_IDS.length &&
                next.inFlightIds.length === 0
              ) {
                appendToHistory(next)
              }
              return next
            })
            setMode("result")
          }
          if (event.type === "error") {
            const id = event.persona
            setSession((prev) => {
              if (!prev) return prev
              return {
                ...prev,
                inFlightIds: prev.inFlightIds.filter((p) => p !== id),
                responses: prev.responses,
              }
            })
          }
        }
      } catch (err) {
        // 네트워크/서버 에러: in-flight 모두 비우기
        setSession((prev) => prev ? { ...prev, inFlightIds: [] } : prev)
      }
    },
    [mode]
  )

  const requestUnlock = (id: PersonaId) => {
    setAdState({ open: true, pendingId: id })
  }

  const onAdComplete = () => {
    const id = adState.pendingId
    setAdState({ open: false, pendingId: null })
    if (!id || !session) return
    const newSession: CritiqueSession = {
      ...session,
      unlockedIds: [...session.unlockedIds, id],
      inFlightIds: [...session.inFlightIds, id],
    }
    setSession(newSession)
    callPersonas(newSession, [id], /* skipGatekeeper */ true)
  }

  const onAdCancel = () => setAdState({ open: false, pendingId: null })

  const reset = () => {
    clearCurrentSession()
    setSession(null)
    setRejection(null)
    setMode("idle")
    buffersRef.current = {}
  }

  if (mode === "rejected" && rejection) {
    return <ErrorScreen reason={rejection.reason} suggestion={rejection.suggestion} onRetry={reset} />
  }

  if (mode === "idle") {
    return (
      <main className="min-h-screen">
        <Nav />
        <UploadZone onSubmit={submit} />
      </main>
    )
  }

  if (mode === "submitting") {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="font-serif text-2xl mb-3">디자인 분석 중…</div>
          <div className="text-sm text-neutral-500">잠시만 기다려주세요</div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      <Nav onNew={reset} />
      <div className="max-w-7xl mx-auto px-6 py-8">
        {session && (
          <div className="mb-6">
            <p className="text-xs text-neutral-500 mb-1">맥락</p>
            <p className="font-sans text-sm text-neutral-700">{session.context || "(없음)"}</p>
          </div>
        )}
        <ResultGrid states={cardStates} onUnlock={requestUnlock} />
      </div>
      <AdModal open={adState.open} onClose={onAdComplete} onCancel={onAdCancel} />
    </main>
  )
}

function Nav({ onNew }: { onNew?: () => void }) {
  return (
    <nav className="px-6 py-4 flex justify-between items-center border-b border-neutral-100">
      <a href="/" className="font-serif text-xl">Critic 6</a>
      <div className="flex gap-4 items-center">
        {onNew && (
          <button onClick={onNew} className="text-sm text-neutral-600 hover:text-neutral-900">
            새 크리틱
          </button>
        )}
        <a href="/history" className="text-sm text-neutral-600 hover:text-neutral-900">
          내 크리틱
        </a>
      </div>
    </nav>
  )
}
