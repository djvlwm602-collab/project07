/**
 * Role: 크리틱 페이지 — 업로드/제출/단일-호출-스트리밍/결과/광고-해제/거부 모드 통합
 * Key Features: idle/submitting/result/rejected 전환, SSE merged-chunk/done 파싱,
 *               모든 리뷰어를 단일 Gemini 호출로 받아 클라이언트에 저장 → 광고 해제는 UI 블러만 제거
 * Dependencies: components/UploadZone, ResultGrid, ErrorScreen, AdModal, Logo, LoadingStage,
 *               lib/personas, lib/storage, lib/sse, lib/parse-merged, lib/types
 * Notes: 'use client'. 과거 per-persona 호출 경로는 제거. 캐시 히트 플로우는 후속 커밋에서 도입.
 */
"use client"

import { useCallback, useEffect, useState } from "react"
import { UploadZone } from "@/components/UploadZone"
import { ResultGrid } from "@/components/ResultGrid"
import { ErrorScreen } from "@/components/ErrorScreen"
import { AdModal } from "@/components/AdModal"
import { Logo } from "@/components/Logo"
import { LoadingStage } from "@/components/LoadingStage"
import { ALL_PERSONA_IDS } from "@/lib/personas"
import {
  saveCurrentSession,
  loadCurrentSession,
  clearCurrentSession,
  appendToHistory,
  getCachedCritique,
  setCachedCritique,
} from "@/lib/storage"
import { readSSE } from "@/lib/sse"
import { parseMergedResponse } from "@/lib/parse-merged"
import { sha256Base64Url } from "@/lib/hash"
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

  // 마운트 시 sessionStorage 복원
  useEffect(() => {
    const restored = loadCurrentSession()
    if (restored) {
      setSession(restored)
      // 이미 responses가 채워져 있으면 결과 화면, 아니면 재호출
      const hasContent = Object.keys(restored.responses).length > 0
      setMode("result")
      if (!hasContent && restored.inFlightIds.length > 0) {
        callMerged(restored)
      }
    }
  }, [])

  // session 변할 때마다 sessionStorage 동기화
  useEffect(() => {
    if (session) saveCurrentSession(session)
  }, [session])

  // 카드 상태 도출 — 세션의 orderedIds 우선, 없으면 기본 순서
  const renderOrder: PersonaId[] = session?.orderedIds ?? ALL_PERSONA_IDS
  const cardStates: PersonaCardState[] = session
    ? renderOrder.map((id) => {
        const isUnlocked = session.unlockedIds.includes(id)
        const isInFlight = session.inFlightIds.includes(id)
        const response = session.responses[id]
        const errorMsg = session.errors?.[id]
        let status: PersonaCardState["status"]
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
    // 잠금 해제 2개를 앞에, 나머지를 뒤에. 세션 내내 고정되어 잠금 해제 시 카드 이동 없음
    const rest = ALL_PERSONA_IDS.filter((pid) => !initialUnlocked.includes(pid))
    const orderedIds: PersonaId[] = [...initialUnlocked, ...rest]

    // 동일 이미지+맥락에 대한 이전 결과가 localStorage에 있으면 Gemini 호출을 건너뜀
    const [imageHash, contextHash] = await Promise.all([
      sha256Base64Url(dataUrl),
      sha256Base64Url(context),
    ])
    const cached = getCachedCritique(imageHash, contextHash)

    if (cached) {
      const cachedSession: CritiqueSession = {
        id,
        imageUrl: dataUrl,
        context,
        createdAt: Date.now(),
        unlockedIds: initialUnlocked,
        responses: cached.responses,
        inFlightIds: [],
        orderedIds,
      }
      setSession(cachedSession)
      setMode("submitting")
      // 너무 즉시 결과로 뛰어가면 "안 돌았다"는 느낌 → 800ms 페이드인
      setTimeout(() => setMode("result"), 800)
      return
    }

    const newSession: CritiqueSession = {
      id,
      imageUrl: dataUrl,
      context,
      createdAt: Date.now(),
      unlockedIds: initialUnlocked,
      responses: {},
      // 단일 호출이지만 UI 상태(스트리밍 중 스피너)를 위해 전체 리뷰어를 inFlight로 초기화
      inFlightIds: [...ALL_PERSONA_IDS],
      orderedIds,
    }
    setSession(newSession)
    setMode("submitting")
    await callMerged(newSession, imageHash, contextHash)
  }, [])

  // 모든 리뷰어를 단일 Gemini 호출로 받아와 responses에 저장. 과거 per-persona 호출 대체.
  // imageHash/contextHash가 함께 전달되면 merged-done 시 캐시에 저장해 재방문 시 Gemini 호출 0회.
  const callMerged = useCallback(async (
    currentSession: CritiqueSession,
    imageHash?: string,
    contextHash?: string
  ) => {
    try {
      const res = await fetch("/api/critique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageDataUrl: currentSession.imageUrl,
          context: currentSession.context,
          personaIds: ALL_PERSONA_IDS,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      let buffer = ""
      for await (const event of readSSE(res)) {
        if (event.type === "rejected") {
          setRejection({ reason: event.reason, suggestion: event.suggestion })
          setMode("rejected")
          clearCurrentSession()
          setSession(null)
          return
        }
        if (event.type === "merged-chunk") {
          buffer += event.chunk
          const reviewers = parseMergedResponse(buffer)
          setSession((prev) => {
            if (!prev) return prev
            return { ...prev, responses: { ...prev.responses, ...reviewers } }
          })
          setMode((m) => (m === "submitting" ? "result" : m))
        }
        if (event.type === "merged-done") {
          const reviewers = event.final.reviewers as Record<PersonaId, PersonaResponse>
          setSession((prev) => {
            if (!prev) return prev
            const next: CritiqueSession = {
              ...prev,
              responses: { ...prev.responses, ...reviewers },
              inFlightIds: [],
            }
            // 모든 리뷰어 해제 + 모두 완료 시 히스토리에 저장
            if (
              next.unlockedIds.length === ALL_PERSONA_IDS.length &&
              next.inFlightIds.length === 0
            ) {
              appendToHistory(next)
            }
            return next
          })
          // 동일 이미지+맥락 재업로드 시 Gemini 0회 호출을 위해 캐시 저장
          if (imageHash && contextHash) {
            setCachedCritique(imageHash, contextHash, reviewers)
          }
          setMode("result")
        }
        if (event.type === "error") {
          // merged 경로의 top-level 에러 — 전원 실패로 마킹
          const message = event.message
          setSession((prev) => {
            if (!prev) return prev
            const nextErrors = { ...(prev.errors ?? {}) }
            for (const pid of ALL_PERSONA_IDS) {
              if (!prev.responses[pid]) nextErrors[pid] = message
            }
            return { ...prev, inFlightIds: [], errors: nextErrors }
          })
          setMode((m) => (m === "submitting" ? "result" : m))
        }
      }
    } catch (err) {
      // 네트워크/서버 에러: 전원 error 마킹
      const message = err instanceof Error ? err.message : "네트워크 오류"
      setSession((prev) => {
        if (!prev) return prev
        const nextErrors = { ...(prev.errors ?? {}) }
        for (const pid of ALL_PERSONA_IDS) {
          if (!prev.responses[pid]) nextErrors[pid] = message
        }
        return { ...prev, inFlightIds: [], errors: nextErrors }
      })
      setMode((m) => (m === "submitting" ? "result" : m))
    }
  }, [])

  const requestUnlock = (id: PersonaId) => {
    setAdState({ open: true, pendingId: id })
  }

  // 광고 시청 완료 — 이미 클라에 응답이 있으므로 서버 호출 없이 UI 블러만 제거
  const onAdComplete = () => {
    const id = adState.pendingId
    setAdState({ open: false, pendingId: null })
    if (!id || !session) return
    setSession({
      ...session,
      unlockedIds: [...session.unlockedIds, id],
    })
  }

  const onAdCancel = () => setAdState({ open: false, pendingId: null })

  const reset = () => {
    clearCurrentSession()
    setSession(null)
    setRejection(null)
    setMode("idle")
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
        <LoadingStage />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-apple-gray">
      <Nav onNew={reset} />
      <div className="max-w-[1120px] mx-auto px-6 py-10">
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
