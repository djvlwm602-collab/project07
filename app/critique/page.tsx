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
import { Logo } from "@/components/Logo"
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
      // 진행 중이던 리뷰어 재호출
      if (restored.inFlightIds.length > 0) {
        callPersonas(restored, restored.inFlightIds, /* skipGatekeeper */ true)
      }
    }
  }, [])

  // session 변할 때마다 sessionStorage 동기화
  useEffect(() => {
    if (session) saveCurrentSession(session)
  }, [session])

  // 카드 상태 도출 — 세션의 orderedIds 우선 (잠금해제된 2개가 상단 고정), 없으면 기본 순서
  const renderOrder: PersonaId[] = session?.orderedIds ?? ALL_PERSONA_IDS
  const cardStates: PersonaCardState[] = session
    ? renderOrder.map((id) => {
        const isUnlocked = session.unlockedIds.includes(id)
        const isInFlight = session.inFlightIds.includes(id)
        const response = session.responses[id]
        const errorMsg = session.errors?.[id]
        let status: PersonaCardState["status"]
        // 에러가 있고 실제 응답 내용이 없으면 error 카드로 표시 (무한 로딩 방지)
        if (!isUnlocked) status = "locked"
        else if (errorMsg && !response) status = "error"
        else if (response) status = "unlocked-done"
        else if (isInFlight) status = "unlocked-streaming"
        else status = "unlocked-loading"
        return { id, status, content: response, error: errorMsg }
      })
    : []

  const submit = useCallback(async ({ dataUrl, context }: { dataUrl: string; context: string }) => {
    const id = makeId()
    const initialUnlocked = pickInitialUnlocked()
    // 잠금 해제 2개를 앞에, 나머지를 뒤에. 이 순서는 세션 내내 고정되어 잠금 해제 시 카드 이동 없음
    const rest = ALL_PERSONA_IDS.filter((pid) => !initialUnlocked.includes(pid))
    const orderedIds: PersonaId[] = [...initialUnlocked, ...rest]
    const newSession: CritiqueSession = {
      id,
      imageUrl: dataUrl,
      context,
      createdAt: Date.now(),
      unlockedIds: initialUnlocked,
      responses: {},
      inFlightIds: [...initialUnlocked],
      orderedIds,
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
                errors: { ...(prev.errors ?? {}), [id]: event.message },
              }
            })
            // 에러만 오고 chunk/done이 없을 때도 result 화면으로 전환 — submitting에 갇히는 버그 방지
            setMode((m) => (m === "submitting" ? "result" : m))
          }
        }
      } catch (err) {
        // 네트워크/서버 에러: in-flight 리뷰어를 모두 error로 마킹하고 result 화면으로 진입
        const message = err instanceof Error ? err.message : "네트워크 오류"
        setSession((prev) => {
          if (!prev) return prev
          const nextErrors = { ...(prev.errors ?? {}) }
          for (const pid of prev.inFlightIds) {
            if (!prev.responses[pid]) nextErrors[pid] = message
          }
          return { ...prev, inFlightIds: [], errors: nextErrors }
        })
        setMode((m) => (m === "submitting" ? "result" : m))
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
      <main className="min-h-screen bg-apple-gray">
        <Nav />
        <UploadZone onSubmit={submit} />
      </main>
    )
  }

  if (mode === "submitting") {
    return (
      <main className="min-h-screen bg-apple-gray flex items-center justify-center">
        <div className="text-center">
          <div className="text-[28px] font-semibold tracking-[-0.003em] text-apple-text mb-2">
            작업을 들여다보는 중…
          </div>
          <div className="text-[15px] text-apple-text/60">잠시만 기다려주세요</div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-apple-gray">
      <Nav onNew={reset} />
      <div className="max-w-7xl mx-auto px-6 py-10">
        <header className="mb-10">
          <h1 className="text-[32px] md:text-[40px] font-bold leading-apple-section tracking-[-0.003em] text-apple-text mb-3">
            크리틱 결과
          </h1>
          {session?.context ? (
            <p className="text-[17px] text-apple-text/70 leading-apple-body">
              {session.context}
            </p>
          ) : (
            <p className="text-[15px] text-apple-text/50 italic">
              맥락 없이 올린 작업물이에요
            </p>
          )}
        </header>
        <ResultGrid states={cardStates} onUnlock={requestUnlock} />
      </div>
      <AdModal open={adState.open} onClose={onAdComplete} onCancel={onAdCancel} />
    </main>
  )
}

function Nav({ onNew }: { onNew?: () => void }) {
  return (
    <nav className="sticky top-0 z-40 h-12 bg-black/80 backdrop-blur-[20px] backdrop-saturate-[1.8] text-white">
      <div className="max-w-[1120px] mx-auto h-full px-6 flex items-center justify-between">
        <Logo color="light" />
        <div className="flex gap-5 items-center text-[12px]">
          {onNew && (
            <button onClick={onNew} className="text-white/80 hover:text-white transition-colors">
              새 크리틱
            </button>
          )}
          <a href="/history" className="text-white/80 hover:text-white transition-colors">
            내 크리틱
          </a>
        </div>
      </div>
    </nav>
  )
}
