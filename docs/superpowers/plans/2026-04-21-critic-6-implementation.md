# Critic 6 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 디자이너가 본인 작업물을 올리면 6개 한국 IT 기업 페르소나(PO/Design Lead)가 동시에 스트리밍으로 크리틱을 주는 Next.js 웹앱 MVP. 광고 시청으로 4개 카드 잠금 해제 메커닉 포함.

**Architecture:** Next.js 14 App Router 기반 풀스택. 클라이언트는 React + Tailwind, 서버는 Edge Function이 Gemini 2.5 Flash와 SSE로 6명 동시 스트리밍. 잠긴 카드는 광고 시청 후에만 API 호출. localStorage로 히스토리, sessionStorage로 현재 세션 영속.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Gemini 2.5 Flash, Vitest, Playwright, MSW, partial-json, Vercel.

**Spec:** `docs/superpowers/specs/2026-04-21-critic-6-design.md`

---

## File Structure

### 신규 생성 파일

**Foundation:**
- `package.json` — 의존성/스크립트
- `tsconfig.json` — TypeScript 설정
- `next.config.mjs` — Next.js 설정
- `tailwind.config.ts` — Tailwind 설정
- `postcss.config.js` — PostCSS
- `.env.local.example` — 환경변수 템플릿
- `.eslintrc.json` — ESLint
- `vitest.config.ts` — 단위/통합 테스트
- `playwright.config.ts` — E2E 테스트

**App (라우트/페이지):**
- `app/layout.tsx` — 루트 레이아웃 (폰트, 메타)
- `app/globals.css` — Tailwind 베이스 + 글로벌 스타일
- `app/page.tsx` — 랜딩
- `app/critique/page.tsx` — 업로드 + 결과 (SPA형)
- `app/history/page.tsx` — 로컬 히스토리

**API:**
- `app/api/critique/route.ts` — Gemini 스트리밍 엔드포인트 (Edge runtime)

**Lib (순수 로직):**
- `lib/types.ts` — 공유 타입
- `lib/personas.ts` — 6명 페르소나 데이터
- `lib/gemini.ts` — Gemini SDK 래퍼
- `lib/gatekeeper.ts` — 입력 검증 호출
- `lib/storage.ts` — localStorage/sessionStorage CRUD
- `lib/image.ts` — 클라이언트 리사이즈/검증
- `lib/sse.ts` — SSE 헬퍼 (서버/클라이언트)

**Components:**
- `components/Hero.tsx` — 랜딩 히어로
- `components/PersonaPreviewGrid.tsx` — 랜딩의 페르소나 카드 미리보기
- `components/UploadZone.tsx` — 드래그앤드롭 + 맥락 입력
- `components/ResultGrid.tsx` — 6개 카드 그리드
- `components/PersonaCard.tsx` — 단일 카드 (잠금/스트리밍)
- `components/AdModal.tsx` — 광고 모달 (5초 카운트다운)
- `components/ads/PigmaProAd.tsx` — 광고 1
- `components/ads/NoCodeKingAd.tsx` — 광고 2
- `components/ads/PixelMasterAd.tsx` — 광고 3
- `components/ErrorScreen.tsx` — 게이트키퍼 거부 화면
- `components/HistoryList.tsx` — 히스토리 페이지

**Tests:**
- `tests/unit/personas.test.ts`
- `tests/unit/storage.test.ts`
- `tests/unit/image.test.ts`
- `tests/unit/gemini.test.ts`
- `tests/integration/critique-route.test.ts`
- `tests/e2e/happy-path.spec.ts`
- `tests/e2e/refresh-recovery.spec.ts`
- `tests/setup.ts` — 테스트 셋업 (MSW 등)

### 디렉터리 책임

각 디렉터리는 단일 책임을 가집니다:
- `app/` — 라우팅 + 서버 컴포넌트 + API. 비즈니스 로직 X.
- `components/` — 프레젠테이션. localStorage·fetch 직접 호출 X (props로 받음).
- `lib/` — 순수 로직 + 외부 IO 래퍼. UI 의존성 X.
- `tests/` — 외부에서 lib/components를 검증. 내부 구현 의존 최소화.

---

## Task Overview

총 23개 태스크, 6단계 (Phase). 각 태스크 후 커밋. Phase 끝마다 푸시 권장.

- **Phase 1: Foundation (T1~T3)** — 프로젝트 셋업
- **Phase 2: Data Layer (T4~T7)** — 타입·페르소나·이미지·스토리지
- **Phase 3: Gemini 통합 (T8~T10)** — Gemini 래퍼·게이트키퍼·API 라우트
- **Phase 4: UI 컴포넌트 (T11~T17)** — 레이아웃·업로드·카드·광고
- **Phase 5: 페이지 (T18~T20)** — 랜딩·크리틱·히스토리
- **Phase 6: 통합/배포 (T21~T23)** — E2E·수동 체크·Vercel 배포

---

## Phase 1: Foundation

### Task 1: Next.js 프로젝트 초기화

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.mjs`
- Create: `.env.local.example`
- Create: `.eslintrc.json`

- [ ] **Step 1: Next.js 프로젝트 초기화 (수동, 인터랙티브 회피)**

저장소 루트에서 실행 (현재 디렉터리는 `/Users/yklee/Desktop/ultraplan2`):

```bash
# 임시 디렉터리에 Next.js 생성 후 필요 파일만 복사 (대화형 프롬프트 회피)
cd /tmp && rm -rf critic6-init && \
  npx --yes create-next-app@14 critic6-init \
    --typescript --tailwind --eslint --app \
    --src-dir false --import-alias "@/*" --use-npm
```

생성 후 필요한 파일을 프로젝트로 복사:

```bash
cd /Users/yklee/Desktop/ultraplan2
cp /tmp/critic6-init/package.json .
cp /tmp/critic6-init/tsconfig.json .
cp /tmp/critic6-init/next.config.mjs . 2>/dev/null || cp /tmp/critic6-init/next.config.js .
cp /tmp/critic6-init/postcss.config.* .
cp /tmp/critic6-init/tailwind.config.* .
cp /tmp/critic6-init/.eslintrc.json .
cp -r /tmp/critic6-init/app .
cp /tmp/critic6-init/next-env.d.ts .
```

- [ ] **Step 2: package.json에 추가 의존성 명시**

기존 `package.json`의 `dependencies`와 `devDependencies`에 추가 (예시):

```json
{
  "dependencies": {
    "next": "14.2.x",
    "react": "^18",
    "react-dom": "^18",
    "@google/generative-ai": "^0.21.0",
    "partial-json": "^0.1.7",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "typescript": "^5",
    "tailwindcss": "^3.4.0",
    "postcss": "^8",
    "autoprefixer": "^10",
    "eslint": "^8",
    "eslint-config-next": "14.2.x"
  }
}
```

- [ ] **Step 3: 의존성 설치**

```bash
npm install
```

기대: 에러 없이 완료. `node_modules/` 생성.

- [ ] **Step 4: `.env.local.example` 작성**

```bash
# /Users/yklee/Desktop/ultraplan2/.env.local.example 내용
GEMINI_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 5: `.gitignore` 보강**

기존 `.gitignore`에 추가:

```
# next
.next/
out/

# env
.env
.env.local
.env*.local

# vercel
.vercel/

# testing
/coverage
/playwright-report
/test-results
/blob-report
/playwright/.cache/

# OS
.DS_Store
```

- [ ] **Step 6: 개발 서버 동작 확인**

```bash
npm run dev
```

다른 터미널에서:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000
```

기대: `200`. 확인 후 `Ctrl+C`로 종료.

- [ ] **Step 7: 커밋**

```bash
git add package.json package-lock.json tsconfig.json next.config.* postcss.config.* tailwind.config.* .eslintrc.json next-env.d.ts app/ .env.local.example .gitignore
git commit -m "chore: initialize Next.js 14 project with Tailwind and TypeScript"
```

---

### Task 2: 베이스 테마 + 폰트 설정

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Modify: `tailwind.config.ts`

- [ ] **Step 1: `app/layout.tsx` 작성**

```tsx
// app/layout.tsx
import type { Metadata } from "next"
import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google"
import "./globals.css"

const sans = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
})

const serif = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-serif",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Critic 6 — 6개 회사 페르소나의 디자인 크리틱",
  description: "당신의 디자인을 토스, 쿠팡, 네이버, 당근, 배민, 카카오의 PO·디자인 리드 페르소나에게 동시에 물어보세요.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${sans.variable} ${serif.variable}`}>
      <body className="bg-white text-neutral-900 font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 2: `app/globals.css` 작성**

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --font-sans: "Noto Sans KR", system-ui, sans-serif;
  --font-serif: "Noto Serif KR", Georgia, serif;
}

html, body {
  height: 100%;
}

body {
  font-family: var(--font-sans);
}

.font-serif {
  font-family: var(--font-serif);
}
```

- [ ] **Step 3: `tailwind.config.ts` 보강**

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
      },
      colors: {
        brand: {
          toss: "#0064ff",
          coupang: "#fb1d1d",
          naver: "#03c75a",
          karrot: "#ff6f0f",
          baemin: "#2ac1bc",
          kakao: "#fee500",
        },
      },
      keyframes: {
        "blur-in": {
          "0%": { filter: "blur(8px)", opacity: "0" },
          "100%": { filter: "blur(0)", opacity: "1" },
        },
      },
      animation: {
        "blur-in": "blur-in 0.4s ease-out",
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 4: 페이지 임시 변경 후 시각 확인**

`app/page.tsx`를 임시로 수정:

```tsx
// app/page.tsx (임시)
export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <h1 className="font-serif text-4xl">Critic 6</h1>
    </main>
  )
}
```

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속해 세리프 폰트로 "Critic 6" 텍스트 확인. 확인 후 종료.

- [ ] **Step 5: 커밋**

```bash
git add app/layout.tsx app/globals.css app/page.tsx tailwind.config.ts
git commit -m "chore: setup Editorial Minimal theme with Noto Sans/Serif KR"
```

---

### Task 3: 테스트 인프라 셋업

**Files:**
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`
- Create: `playwright.config.ts`
- Modify: `package.json` (스크립트)

- [ ] **Step 1: 테스트 의존성 설치**

```bash
npm install -D vitest @vitejs/plugin-react jsdom \
  @testing-library/react @testing-library/jest-dom \
  msw @playwright/test
```

기대: 에러 없이 완료.

- [ ] **Step 2: `vitest.config.ts` 작성**

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
})
```

- [ ] **Step 3: `tests/setup.ts` 작성**

```ts
// tests/setup.ts
import "@testing-library/jest-dom/vitest"
import { afterEach } from "vitest"
import { cleanup } from "@testing-library/react"

afterEach(() => {
  cleanup()
})
```

- [ ] **Step 4: `playwright.config.ts` 작성**

```ts
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
})
```

- [ ] **Step 5: `package.json`에 스크립트 추가**

기존 `package.json`의 `scripts` 섹션을 다음과 같이 업데이트:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

- [ ] **Step 6: smoke 테스트로 vitest 동작 확인**

```bash
mkdir -p tests/unit
```

```ts
// tests/unit/smoke.test.ts (임시)
import { describe, it, expect } from "vitest"

describe("smoke", () => {
  it("vitest works", () => {
    expect(1 + 1).toBe(2)
  })
})
```

```bash
npm run test
```

기대: 1 passed.

- [ ] **Step 7: smoke 테스트 제거**

```bash
rm tests/unit/smoke.test.ts
```

- [ ] **Step 8: 커밋**

```bash
git add vitest.config.ts playwright.config.ts tests/setup.ts package.json package-lock.json
git commit -m "chore: setup Vitest and Playwright test infrastructure"
```

---

## Phase 2: Data Layer

### Task 4: 공유 타입 정의

**Files:**
- Create: `lib/types.ts`

- [ ] **Step 1: `lib/types.ts` 작성**

```ts
// lib/types.ts

export type PersonaId = "toss" | "coupang" | "naver" | "karrot" | "baemin" | "kakao"

export type PersonaRole = "PO" | "Design Lead"

export type Persona = {
  id: PersonaId
  company: string
  role: PersonaRole
  title: string                    // 예: "검증의 칼날"
  brandColor: string               // 시그니처 컬러 (#hex)
  oneLineQuote: string             // 톤 예시
  toneDescription: string          // 프롬프트용 톤 가이드
  focusAreas: string[]             // 평가 축
}

export type PersonaResponse = {
  oneliner: string
  strengths: string[]
  concerns: string[]
  suggestions: string[]
}

export type CardStatus =
  | "locked"                // 잠김 (광고 미시청)
  | "unlocked-loading"      // 광고 시청 후 호출 시작 직전
  | "unlocked-streaming"    // 스트리밍 중
  | "unlocked-done"         // 완료
  | "error"                 // 실패

export type PersonaCardState = {
  id: PersonaId
  status: CardStatus
  content?: PersonaResponse        // 부분 또는 완료된 응답
  error?: string
}

export type GatekeeperResult = {
  valid: boolean
  category?: "ui" | "graphic" | "wireframe" | "other"
  confidence?: "high" | "medium" | "low"
  reason?: string
  suggestion?: string
}

export type CritiqueSession = {
  id: string                       // UUID
  imageUrl: string                 // base64 data URL
  context: string
  createdAt: number                // epoch ms
  unlockedIds: PersonaId[]
  responses: Partial<Record<PersonaId, PersonaResponse>>
  inFlightIds: PersonaId[]
}

// SSE 이벤트 타입
export type SSEEvent =
  | { type: "rejected"; reason: string; suggestion?: string }
  | { type: "chunk"; persona: PersonaId; chunk: string }
  | { type: "done"; persona: PersonaId; final: PersonaResponse }
  | { type: "error"; persona: PersonaId; message: string }
```

- [ ] **Step 2: 커밋 (테스트는 다음 태스크에서 함께)**

```bash
git add lib/types.ts
git commit -m "feat: add shared types for personas, sessions, and SSE events"
```

---

### Task 5: 페르소나 정의 + 단위 테스트

**Files:**
- Create: `lib/personas.ts`
- Create: `tests/unit/personas.test.ts`

- [ ] **Step 1: 실패하는 테스트 먼저 작성**

```ts
// tests/unit/personas.test.ts
import { describe, it, expect } from "vitest"
import { PERSONAS, getPersona, ALL_PERSONA_IDS } from "@/lib/personas"
import type { PersonaId } from "@/lib/types"

describe("PERSONAS", () => {
  it("정확히 6명을 정의한다", () => {
    expect(PERSONAS).toHaveLength(6)
  })

  it("ID는 6개 모두 유니크하다", () => {
    const ids = PERSONAS.map(p => p.id)
    expect(new Set(ids).size).toBe(6)
  })

  it("모든 페르소나가 필수 필드를 갖는다", () => {
    for (const p of PERSONAS) {
      expect(p.id).toBeTruthy()
      expect(p.company).toBeTruthy()
      expect(["PO", "Design Lead"]).toContain(p.role)
      expect(p.title).toBeTruthy()
      expect(p.brandColor).toMatch(/^#[0-9a-f]{6}$/i)
      expect(p.oneLineQuote).toBeTruthy()
      expect(p.toneDescription.length).toBeGreaterThan(20)
      expect(p.focusAreas.length).toBeGreaterThanOrEqual(3)
    }
  })

  it("PO 3명, Design Lead 3명이다", () => {
    const pos = PERSONAS.filter(p => p.role === "PO")
    const dls = PERSONAS.filter(p => p.role === "Design Lead")
    expect(pos).toHaveLength(3)
    expect(dls).toHaveLength(3)
  })

  it("스펙에 정의된 6명이 모두 있다", () => {
    const expected: PersonaId[] = ["toss", "coupang", "naver", "karrot", "baemin", "kakao"]
    expect(PERSONAS.map(p => p.id).sort()).toEqual(expected.sort())
  })
})

describe("getPersona", () => {
  it("ID로 페르소나를 가져온다", () => {
    expect(getPersona("toss").company).toBe("토스")
  })

  it("없는 ID에 에러를 던진다", () => {
    // @ts-expect-error invalid id
    expect(() => getPersona("none")).toThrow()
  })
})

describe("ALL_PERSONA_IDS", () => {
  it("6개 ID 배열을 노출한다", () => {
    expect(ALL_PERSONA_IDS).toHaveLength(6)
  })
})
```

- [ ] **Step 2: 실패 확인**

```bash
npm run test
```

기대: `personas.ts` 미존재로 import 에러.

- [ ] **Step 3: `lib/personas.ts` 구현**

```ts
// lib/personas.ts
import type { Persona, PersonaId } from "./types"

export const PERSONAS: Persona[] = [
  {
    id: "toss",
    company: "토스",
    role: "PO",
    title: "검증의 칼날",
    brandColor: "#0064ff",
    oneLineQuote: "이 가설, 사용자한테 진짜 물어보셨어요?",
    toneDescription: [
      "- 격식 있는 존댓말 (~하시죠, ~해보셨어요?)",
      "- 검증 안 된 가설을 정곡으로 찌름",
      "- 차분하지만 날카로움",
      "- 데이터/근거 자주 언급",
    ].join("\n"),
    focusAreas: [
      "가설 검증 가능성",
      "핵심 사용자 행동의 명확성",
      "데이터로 측정 가능한지 여부",
    ],
  },
  {
    id: "coupang",
    company: "쿠팡",
    role: "PO",
    title: "전환의 무사",
    brandColor: "#fb1d1d",
    oneLineQuote: "구매 전환율에 어떤 영향이 있죠?",
    toneDescription: [
      "- 무미건조하지만 임팩트 있음",
      "- 숫자/지표로 말함 (전환율, ROI)",
      "- 비즈니스 임팩트를 우선시",
      "- 효율과 속도를 강조",
    ].join("\n"),
    focusAreas: [
      "구매/액션 전환율 영향",
      "비용 대비 임팩트",
      "사용자 마찰 지점",
    ],
  },
  {
    id: "naver",
    company: "네이버",
    role: "PO",
    title: "스케일의 눈",
    brandColor: "#03c75a",
    oneLineQuote: "수천만 사용자가 쓴다고 생각해보세요.",
    toneDescription: [
      "- 신중하고 거시적인 존댓말",
      "- 다양한 사용자(50대, 모바일 환경 약함 등) 환기",
      "- 안정성·접근성·생태계 호환성 강조",
      "- 보수적이지만 합리적",
    ].join("\n"),
    focusAreas: [
      "대규모 사용자 호환성",
      "접근성 (a11y)",
      "기존 생태계와의 일관성",
    ],
  },
  {
    id: "karrot",
    company: "당근마켓",
    role: "Design Lead",
    title: "동네의 온도",
    brandColor: "#ff6f0f",
    oneLineQuote: "옆집 이웃에게 말 거는 느낌, 좀 더 있었으면 좋겠어요 :)",
    toneDescription: [
      "- 부드럽고 친근한 존댓말",
      "- 격려를 먼저, 우려는 조심스럽게",
      "- 가끔 자연스러운 이모지 (:), 😌)",
      "- 동네/이웃의 따뜻한 정서를 비유로 사용",
    ].join("\n"),
    focusAreas: [
      "친근함과 진입 장벽",
      "감정적 거리감",
      "일상 정서와의 자연스러운 연결",
    ],
  },
  {
    id: "baemin",
    company: "배민",
    role: "Design Lead",
    title: "B급의 미학",
    brandColor: "#2ac1bc",
    oneLineQuote: "어머 이 폰트… 우리 한나체랑 한판 붙여볼래요? ㅎㅎ",
    toneDescription: [
      "- 친근한 존댓말에 위트가 가끔 들어감",
      "- B급 유머 OK, 진심도 함께",
      "- 자기 회사 폰트(한나체, 주아체) 가끔 언급",
      "- 일상의 재미와 친근함을 강조",
    ].join("\n"),
    focusAreas: [
      "브랜드 톤앤매너의 일관성",
      "일상감/친근함",
      "타이포그래피 위계",
    ],
  },
  {
    id: "kakao",
    company: "카카오",
    role: "Design Lead",
    title: "관계의 결",
    brandColor: "#fee500",
    oneLineQuote: "사용자가 이 화면에서 어떤 감정을 느끼면 좋을까요?",
    toneDescription: [
      "- 정돈된 친근함, 부드러운 명확함의 존댓말",
      "- 감정 어휘가 풍부 (감정선, 결, 흐름)",
      "- 관계 중심으로 사고 (사용자와의 관계, 기능 간 관계)",
      "- 친숙함을 우선시",
    ].join("\n"),
    focusAreas: [
      "사용자 감정선",
      "관계성 (사용자-제품, 기능-기능)",
      "친숙함과 명확함의 균형",
    ],
  },
]

export const ALL_PERSONA_IDS: PersonaId[] = PERSONAS.map(p => p.id)

export function getPersona(id: PersonaId): Persona {
  const found = PERSONAS.find(p => p.id === id)
  if (!found) throw new Error(`Unknown persona id: ${id}`)
  return found
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm run test tests/unit/personas.test.ts
```

기대: 7 passed.

- [ ] **Step 5: 커밋**

```bash
git add lib/personas.ts tests/unit/personas.test.ts
git commit -m "feat: define 6 company personas with tones and focus areas"
```

---

### Task 6: 이미지 유틸 + 단위 테스트

**Files:**
- Create: `lib/image.ts`
- Create: `tests/unit/image.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// tests/unit/image.test.ts
import { describe, it, expect } from "vitest"
import {
  validateImageFile,
  resizeImage,
  ImageValidationError,
  MAX_FILE_SIZE_BYTES,
  MIN_DIMENSION,
  MAX_DIMENSION,
} from "@/lib/image"

function makeFile(name: string, type: string, size: number): File {
  const blob = new Blob([new Uint8Array(size)], { type })
  return new File([blob], name, { type })
}

describe("validateImageFile", () => {
  it("PNG/JPEG/WebP는 통과한다", () => {
    expect(() => validateImageFile(makeFile("a.png", "image/png", 1024))).not.toThrow()
    expect(() => validateImageFile(makeFile("a.jpg", "image/jpeg", 1024))).not.toThrow()
    expect(() => validateImageFile(makeFile("a.webp", "image/webp", 1024))).not.toThrow()
  })

  it("지원 안 하는 포맷은 거부한다", () => {
    expect(() => validateImageFile(makeFile("a.gif", "image/gif", 1024))).toThrow(ImageValidationError)
    expect(() => validateImageFile(makeFile("a.txt", "text/plain", 1024))).toThrow(ImageValidationError)
  })

  it("크기 초과 (>5MB)는 거부한다", () => {
    expect(() => validateImageFile(makeFile("a.png", "image/png", MAX_FILE_SIZE_BYTES + 1))).toThrow(ImageValidationError)
  })

  it("0 바이트는 거부한다", () => {
    expect(() => validateImageFile(makeFile("a.png", "image/png", 0))).toThrow(ImageValidationError)
  })
})

describe("resizeImage 상수", () => {
  it("MIN/MAX 차원 정의", () => {
    expect(MIN_DIMENSION).toBe(200)
    expect(MAX_DIMENSION).toBe(1920)
  })
})
```

- [ ] **Step 2: 실패 확인**

```bash
npm run test tests/unit/image.test.ts
```

기대: import 에러.

- [ ] **Step 3: `lib/image.ts` 구현**

```ts
// lib/image.ts

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
export const MIN_DIMENSION = 200
export const MAX_DIMENSION = 1920
export const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"] as const

export class ImageValidationError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message)
    this.name = "ImageValidationError"
  }
}

export function validateImageFile(file: File): void {
  if (!ALLOWED_TYPES.includes(file.type as typeof ALLOWED_TYPES[number])) {
    throw new ImageValidationError(
      `지원하지 않는 파일 형식입니다 (PNG/JPG/WebP만 지원).`,
      "INVALID_TYPE"
    )
  }
  if (file.size === 0) {
    throw new ImageValidationError("빈 파일은 업로드할 수 없습니다.", "EMPTY")
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new ImageValidationError(
      `파일이 너무 큽니다 (최대 ${Math.round(MAX_FILE_SIZE_BYTES / 1024 / 1024)}MB).`,
      "TOO_LARGE"
    )
  }
}

/**
 * 이미지를 base64 data URL로 변환하면서 필요시 리사이즈.
 * 브라우저 환경에서만 동작.
 */
export async function resizeImage(file: File): Promise<{ dataUrl: string; width: number; height: number }> {
  const bitmap = await createImageBitmap(file)
  const { width: ow, height: oh } = bitmap

  if (ow < MIN_DIMENSION || oh < MIN_DIMENSION) {
    bitmap.close()
    throw new ImageValidationError(
      `이미지가 너무 작아요 (최소 ${MIN_DIMENSION}px 필요).`,
      "TOO_SMALL"
    )
  }

  let nw = ow
  let nh = oh
  const maxSide = Math.max(ow, oh)
  if (maxSide > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / maxSide
    nw = Math.round(ow * scale)
    nh = Math.round(oh * scale)
  }

  const canvas = document.createElement("canvas")
  canvas.width = nw
  canvas.height = nh
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(bitmap, 0, 0, nw, nh)
  bitmap.close()

  // PNG는 투명도 보존, 그 외 JPEG로 압축
  const outType = file.type === "image/png" ? "image/png" : "image/jpeg"
  const dataUrl = canvas.toDataURL(outType, 0.9)
  return { dataUrl, width: nw, height: nh }
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm run test tests/unit/image.test.ts
```

기대: 6 passed. (resizeImage는 브라우저 API라 jsdom에서 작동 제한적이므로 단위 테스트는 validate만 다룸. resize는 E2E에서 검증.)

- [ ] **Step 5: 커밋**

```bash
git add lib/image.ts tests/unit/image.test.ts
git commit -m "feat: image validation and resize utility"
```

---

### Task 7: 스토리지 유틸 + 단위 테스트

**Files:**
- Create: `lib/storage.ts`
- Create: `tests/unit/storage.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// tests/unit/storage.test.ts
import { describe, it, expect, beforeEach } from "vitest"
import {
  saveCurrentSession,
  loadCurrentSession,
  clearCurrentSession,
  appendToHistory,
  loadHistory,
  HISTORY_LIMIT,
} from "@/lib/storage"
import type { CritiqueSession } from "@/lib/types"

function makeSession(id: string): CritiqueSession {
  return {
    id,
    imageUrl: "data:image/png;base64,xxx",
    context: "test",
    createdAt: Date.now(),
    unlockedIds: [],
    responses: {},
    inFlightIds: [],
  }
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

describe("currentSession (sessionStorage)", () => {
  it("저장 후 불러올 수 있다", () => {
    const s = makeSession("a")
    saveCurrentSession(s)
    expect(loadCurrentSession()).toEqual(s)
  })

  it("clear 후엔 null", () => {
    saveCurrentSession(makeSession("a"))
    clearCurrentSession()
    expect(loadCurrentSession()).toBeNull()
  })

  it("저장 안 된 상태에선 null", () => {
    expect(loadCurrentSession()).toBeNull()
  })
})

describe("history (localStorage)", () => {
  it("초기엔 빈 배열", () => {
    expect(loadHistory()).toEqual([])
  })

  it("최대 N개까지 저장, FIFO로 가장 오래된 것 삭제", () => {
    for (let i = 0; i < HISTORY_LIMIT + 2; i++) {
      appendToHistory(makeSession(`s${i}`))
    }
    const h = loadHistory()
    expect(h).toHaveLength(HISTORY_LIMIT)
    expect(h[0].id).toBe(`s${HISTORY_LIMIT + 1}`) // 최신
    expect(h[h.length - 1].id).toBe("s2")          // 가장 오래된 (s0, s1은 밀려남)
  })
})
```

- [ ] **Step 2: 실패 확인**

```bash
npm run test tests/unit/storage.test.ts
```

기대: import 에러.

- [ ] **Step 3: `lib/storage.ts` 구현**

```ts
// lib/storage.ts
import type { CritiqueSession } from "./types"

const SESSION_KEY = "critic6_current_session"
const HISTORY_KEY = "critic6_history"
export const HISTORY_LIMIT = 5

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function saveCurrentSession(session: CritiqueSession): void {
  if (typeof window === "undefined") return
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function loadCurrentSession(): CritiqueSession | null {
  if (typeof window === "undefined") return null
  return safeParse<CritiqueSession>(sessionStorage.getItem(SESSION_KEY))
}

export function clearCurrentSession(): void {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(SESSION_KEY)
}

export function loadHistory(): CritiqueSession[] {
  if (typeof window === "undefined") return []
  return safeParse<CritiqueSession[]>(localStorage.getItem(HISTORY_KEY)) ?? []
}

export function appendToHistory(session: CritiqueSession): void {
  if (typeof window === "undefined") return
  const current = loadHistory()
  // 최신을 앞에 두고 오래된 것 삭제
  const next = [session, ...current].slice(0, HISTORY_LIMIT)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm run test tests/unit/storage.test.ts
```

기대: 5 passed.

- [ ] **Step 5: 커밋**

```bash
git add lib/storage.ts tests/unit/storage.test.ts
git commit -m "feat: localStorage history and sessionStorage current session"
```

---

## Phase 3: Gemini Integration

### Task 8: Gemini 래퍼 + 단위 테스트

**Files:**
- Create: `lib/gemini.ts`
- Create: `tests/unit/gemini.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// tests/unit/gemini.test.ts
import { describe, it, expect } from "vitest"
import {
  buildPersonaPrompt,
  parsePersonaResponse,
  PERSONA_RESPONSE_SCHEMA,
} from "@/lib/gemini"
import { getPersona } from "@/lib/personas"

describe("buildPersonaPrompt", () => {
  it("페르소나 시스템 프롬프트에 회사명·직무·톤이 포함된다", () => {
    const persona = getPersona("toss")
    const prompt = buildPersonaPrompt(persona, "약관 동의 화면")
    expect(prompt.systemInstruction).toContain("토스")
    expect(prompt.systemInstruction).toContain("PO")
    expect(prompt.systemInstruction).toContain("격식 있는 존댓말")
    expect(prompt.systemInstruction).toContain("가설 검증 가능성")
    expect(prompt.userText).toContain("약관 동의 화면")
  })

  it("JSON 스키마를 출력 강제용으로 노출", () => {
    expect(PERSONA_RESPONSE_SCHEMA.required).toContain("oneliner")
    expect(PERSONA_RESPONSE_SCHEMA.required).toContain("strengths")
    expect(PERSONA_RESPONSE_SCHEMA.required).toContain("concerns")
    expect(PERSONA_RESPONSE_SCHEMA.required).toContain("suggestions")
  })
})

describe("parsePersonaResponse", () => {
  it("완성된 JSON 텍스트를 파싱한다", () => {
    const json = JSON.stringify({
      oneliner: "정곡",
      strengths: ["a", "b"],
      concerns: ["c"],
      suggestions: ["d", "e"],
    })
    const r = parsePersonaResponse(json)
    expect(r).toEqual({ oneliner: "정곡", strengths: ["a", "b"], concerns: ["c"], suggestions: ["d", "e"] })
  })

  it("불완전 JSON도 partial로 파싱한다 (스트리밍 중)", () => {
    const partial = '{"oneliner": "검증의", "strengths": ["가설을'
    const r = parsePersonaResponse(partial)
    expect(r.oneliner).toBe("검증의")
  })

  it("완전 빈 문자열은 빈 객체 반환", () => {
    const r = parsePersonaResponse("")
    expect(r).toEqual({})
  })
})
```

- [ ] **Step 2: 실패 확인**

```bash
npm run test tests/unit/gemini.test.ts
```

기대: import 에러.

- [ ] **Step 3: `lib/gemini.ts` 구현**

```ts
// lib/gemini.ts
import { GoogleGenerativeAI, type GenerationConfig } from "@google/generative-ai"
import { parse as parsePartialJson, Allow } from "partial-json"
import type { Persona, PersonaResponse, GatekeeperResult } from "./types"

export const PERSONA_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    oneliner: { type: "string", description: "페르소나 톤이 가장 잘 드러나는 한 마디 (15~30자)" },
    strengths: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 3 },
    concerns: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 3 },
    suggestions: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 3 },
  },
  required: ["oneliner", "strengths", "concerns", "suggestions"],
} as const

export const GATEKEEPER_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    valid: { type: "boolean" },
    category: { type: "string", enum: ["ui", "graphic", "wireframe", "other"] },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
    reason: { type: "string" },
    suggestion: { type: "string" },
  },
  required: ["valid"],
} as const

export type PersonaPrompt = {
  systemInstruction: string
  userText: string
}

export function buildPersonaPrompt(persona: Persona, userContext: string): PersonaPrompt {
  const systemInstruction = `당신은 ${persona.company}의 ${persona.role}입니다. 이름은 가상의 인물입니다.
다음 디자인 작업물을 보고 ${persona.company} 관점에서 솔직한 크리틱을 해주세요.

말투 가이드:
${persona.toneDescription}
- 한국어로 답변
- 자연스럽고 사람 같은 톤 (AI 티 내지 말 것)

평가 시 특히 다음을 신경 써서 보세요:
${persona.focusAreas.map(a => `- ${a}`).join("\n")}

피해야 할 것:
- 일반론적 얘기 ("디자인이 좋네요")
- 다른 회사 페르소나 흉내 (당신은 ${persona.company} 사람입니다)
- 영어 표현 남용 (자연스러운 곳만)

안전장치:
- 이미지가 디자인 작업물로 보기 어렵다면, 솔직하게
  "이 이미지에서 제가 크리틱할 부분을 찾기 어려워요"라고 답하고
  구체적인 비평을 억지로 하지 마세요.`

  const userText = `맥락: ${userContext || "(없음)"}`
  return { systemInstruction, userText }
}

export function parsePersonaResponse(text: string): Partial<PersonaResponse> {
  if (!text || !text.trim()) return {}
  try {
    const parsed = parsePartialJson(text, Allow.ALL) as Partial<PersonaResponse>
    return parsed ?? {}
  } catch {
    return {}
  }
}

export function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error("GEMINI_API_KEY missing")
  return new GoogleGenerativeAI(apiKey)
}

export const PERSONA_GENERATION_CONFIG: GenerationConfig = {
  temperature: 0.85,
  maxOutputTokens: 600,
  responseMimeType: "application/json",
}

export const GATEKEEPER_GENERATION_CONFIG: GenerationConfig = {
  temperature: 0.2,
  maxOutputTokens: 200,
  responseMimeType: "application/json",
}

export type GeminiImageInput = {
  mimeType: string
  data: string // base64 (data URL prefix 제외)
}

/**
 * data URL ("data:image/png;base64,...")에서 mimeType과 base64를 추출.
 */
export function extractImageInput(dataUrl: string): GeminiImageInput {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) throw new Error("Invalid data URL")
  return { mimeType: match[1], data: match[2] }
}

export async function* streamPersonaResponse(
  persona: Persona,
  userContext: string,
  image: GeminiImageInput
): AsyncGenerator<string, void, void> {
  const genAI = getGenAI()
  const { systemInstruction, userText } = buildPersonaPrompt(persona, userContext)
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction,
    generationConfig: PERSONA_GENERATION_CONFIG,
  })

  const result = await model.generateContentStream([
    userText,
    { inlineData: { mimeType: image.mimeType, data: image.data } },
  ])

  for await (const chunk of result.stream) {
    const text = chunk.text()
    if (text) yield text
  }
}

export async function runGatekeeper(
  userContext: string,
  image: GeminiImageInput
): Promise<GatekeeperResult> {
  const genAI = getGenAI()
  const systemInstruction = `이 이미지를 분석해 디자인/UI 크리틱을 받을 만한 작업물인지 판단합니다.

크리틱 가능 대상:
- 웹/앱/모바일 UI 스크린샷
- 와이어프레임, 목업, 프로토타입
- 랜딩 페이지, 대시보드, 폼
- 그래픽 디자인 작업물 (포스터, 배너 등)
- 디자인 시스템 컴포넌트

크리틱 불가 대상:
- 일반 사진 (사람, 풍경, 음식, 동물 등)
- 밈, 낙서, 만화
- 코드 스크린샷, 텍스트만 있는 문서
- 판독이 어려울 정도로 불명확한 이미지

JSON으로 답하세요.
- valid가 false면 reason에 친근한 한국어 이유, suggestion에 대안 제시.
- confidence가 medium 이상이면 valid 우선.`

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction,
    generationConfig: GATEKEEPER_GENERATION_CONFIG,
  })

  const result = await model.generateContent([
    `맥락: ${userContext || "(없음)"}`,
    { inlineData: { mimeType: image.mimeType, data: image.data } },
  ])

  const text = result.response.text()
  try {
    const parsed = JSON.parse(text) as GatekeeperResult
    return parsed
  } catch {
    // 파싱 실패 시 안전하게 valid 처리 (게이트 통과)
    return { valid: true, confidence: "low" }
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm run test tests/unit/gemini.test.ts
```

기대: 5 passed. (네트워크 호출하는 함수는 통합 테스트에서 모킹.)

- [ ] **Step 5: 커밋**

```bash
git add lib/gemini.ts tests/unit/gemini.test.ts
git commit -m "feat: Gemini wrapper with prompt builder and partial JSON streaming parse"
```

---

### Task 9: SSE 헬퍼

**Files:**
- Create: `lib/sse.ts`

- [ ] **Step 1: `lib/sse.ts` 작성**

```ts
// lib/sse.ts
import type { SSEEvent } from "./types"

/** 서버 측: SSE 라인을 만들어 ReadableStreamDefaultController에 enqueue */
export function writeSSE(controller: ReadableStreamDefaultController<Uint8Array>, event: SSEEvent) {
  const line = `data: ${JSON.stringify(event)}\n\n`
  controller.enqueue(new TextEncoder().encode(line))
}

/** 서버: SSE 응답 헤더 */
export const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
}

/**
 * 클라이언트: fetch Response에서 SSE 이벤트를 async iterator로 받음.
 */
export async function* readSSE(response: Response): AsyncGenerator<SSEEvent, void, void> {
  if (!response.body) throw new Error("No response body")
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let idx: number
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const raw = buffer.slice(0, idx).trim()
      buffer = buffer.slice(idx + 2)
      if (!raw.startsWith("data:")) continue
      const json = raw.slice(5).trim()
      try {
        yield JSON.parse(json) as SSEEvent
      } catch {
        // ignore malformed
      }
    }
  }
}
```

- [ ] **Step 2: 커밋 (별도 테스트는 통합 테스트에서 자연스럽게 검증)**

```bash
git add lib/sse.ts
git commit -m "feat: SSE write/read helpers for server and client"
```

---

### Task 10: API 라우트 + 통합 테스트

**Files:**
- Create: `app/api/critique/route.ts`
- Create: `tests/integration/critique-route.test.ts`

- [ ] **Step 1: `app/api/critique/route.ts` 작성**

```ts
// app/api/critique/route.ts
import { NextRequest } from "next/server"
import { ALL_PERSONA_IDS, getPersona } from "@/lib/personas"
import {
  extractImageInput,
  runGatekeeper,
  streamPersonaResponse,
  parsePersonaResponse,
} from "@/lib/gemini"
import { writeSSE, SSE_HEADERS } from "@/lib/sse"
import type { PersonaId, PersonaResponse } from "@/lib/types"

// Edge runtime은 일부 SDK 비호환 가능 — Node runtime 권장 (로컬 개발 안정)
export const runtime = "nodejs"
export const maxDuration = 60

type RequestBody = {
  imageDataUrl: string
  context: string
  personaIds: PersonaId[]
  skipGatekeeper?: boolean // 잠금 해제로 단일 페르소나 호출 시 사용 (이미 검증됨)
}

export async function POST(req: NextRequest) {
  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return new Response("Invalid JSON", { status: 400 })
  }

  const { imageDataUrl, context, personaIds, skipGatekeeper } = body
  if (!imageDataUrl || !Array.isArray(personaIds) || personaIds.length === 0) {
    return new Response("Missing fields", { status: 400 })
  }

  // 잘못된 ID 필터
  const validIds = personaIds.filter((id): id is PersonaId =>
    ALL_PERSONA_IDS.includes(id as PersonaId)
  )
  if (validIds.length === 0) {
    return new Response("No valid persona ids", { status: 400 })
  }

  let imageInput
  try {
    imageInput = extractImageInput(imageDataUrl)
  } catch {
    return new Response("Invalid image data URL", { status: 400 })
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        // 1. 게이트키퍼 (skip 가능)
        if (!skipGatekeeper) {
          const gate = await runGatekeeper(context, imageInput)
          if (!gate.valid) {
            writeSSE(controller, {
              type: "rejected",
              reason: gate.reason ?? "이 이미지로는 디자인 크리틱이 어려워요.",
              suggestion: gate.suggestion,
            })
            controller.close()
            return
          }
        }

        // 2. 6명(혹은 단일) 병렬 스트리밍
        await Promise.all(
          validIds.map(async (id) => {
            const persona = getPersona(id)
            let buffer = ""
            try {
              for await (const chunk of streamPersonaResponse(persona, context, imageInput)) {
                buffer += chunk
                writeSSE(controller, { type: "chunk", persona: id, chunk })
              }
              const final = parsePersonaResponse(buffer) as PersonaResponse
              writeSSE(controller, { type: "done", persona: id, final })
            } catch (err) {
              const message = err instanceof Error ? err.message : "Unknown error"
              writeSSE(controller, { type: "error", persona: id, message })
            }
          })
        )

        controller.close()
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown server error"
        controller.enqueue(
          new TextEncoder().encode(`data: ${JSON.stringify({ type: "error", persona: "unknown", message })}\n\n`)
        )
        controller.close()
      }
    },
  })

  return new Response(stream, { headers: SSE_HEADERS })
}
```

- [ ] **Step 2: 통합 테스트 작성 (Gemini 모킹)**

```ts
// tests/integration/critique-route.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest"
import { POST } from "@/app/api/critique/route"
import { NextRequest } from "next/server"

vi.mock("@/lib/gemini", async () => {
  const actual = await vi.importActual<typeof import("@/lib/gemini")>("@/lib/gemini")
  return {
    ...actual,
    runGatekeeper: vi.fn(),
    streamPersonaResponse: vi.fn(),
  }
})

import { runGatekeeper, streamPersonaResponse } from "@/lib/gemini"

const SAMPLE_DATA_URL = "data:image/png;base64,iVBORw0KGgo="

function makeReq(body: object) {
  return new NextRequest("http://localhost/api/critique", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

async function readAll(res: Response): Promise<string> {
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let out = ""
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    out += decoder.decode(value)
  }
  return out
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("POST /api/critique", () => {
  it("게이트키퍼 거부 시 rejected 이벤트 전송 후 종료", async () => {
    vi.mocked(runGatekeeper).mockResolvedValue({
      valid: false,
      reason: "고양이 사진이네요",
      suggestion: "UI 스크린샷을 올려주세요",
    })

    const res = await POST(makeReq({
      imageDataUrl: SAMPLE_DATA_URL,
      context: "",
      personaIds: ["toss"],
    }))

    const body = await readAll(res)
    expect(body).toContain('"type":"rejected"')
    expect(body).toContain("고양이 사진이네요")
    expect(streamPersonaResponse).not.toHaveBeenCalled()
  })

  it("게이트키퍼 통과 시 페르소나 스트림 chunk + done 이벤트 전송", async () => {
    vi.mocked(runGatekeeper).mockResolvedValue({ valid: true })
    vi.mocked(streamPersonaResponse).mockImplementation(async function* () {
      yield '{"oneliner":"테스트",'
      yield '"strengths":["a"],"concerns":["b"],"suggestions":["c"]}'
    })

    const res = await POST(makeReq({
      imageDataUrl: SAMPLE_DATA_URL,
      context: "test",
      personaIds: ["toss"],
    }))

    const body = await readAll(res)
    expect(body).toContain('"type":"chunk"')
    expect(body).toContain('"type":"done"')
    expect(body).toContain('"persona":"toss"')
  })

  it("개별 페르소나 실패 시 error 이벤트, 다른 페르소나는 계속", async () => {
    vi.mocked(runGatekeeper).mockResolvedValue({ valid: true })
    vi.mocked(streamPersonaResponse).mockImplementation(async function* (persona) {
      if (persona.id === "toss") throw new Error("Safety filter")
      yield '{"oneliner":"ok","strengths":["a"],"concerns":["b"],"suggestions":["c"]}'
    })

    const res = await POST(makeReq({
      imageDataUrl: SAMPLE_DATA_URL,
      context: "",
      personaIds: ["toss", "naver"],
    }))

    const body = await readAll(res)
    expect(body).toContain('"type":"error"')
    expect(body).toContain('"persona":"toss"')
    expect(body).toContain('"persona":"naver"')
  })

  it("skipGatekeeper=true면 게이트키퍼 호출 없음", async () => {
    vi.mocked(streamPersonaResponse).mockImplementation(async function* () {
      yield '{"oneliner":"x","strengths":["a"],"concerns":["b"],"suggestions":["c"]}'
    })

    await POST(makeReq({
      imageDataUrl: SAMPLE_DATA_URL,
      context: "",
      personaIds: ["toss"],
      skipGatekeeper: true,
    }))

    expect(runGatekeeper).not.toHaveBeenCalled()
  })

  it("imageDataUrl 없으면 400", async () => {
    const res = await POST(makeReq({ context: "", personaIds: ["toss"] }))
    expect(res.status).toBe(400)
  })

  it("personaIds 비어있으면 400", async () => {
    const res = await POST(makeReq({ imageDataUrl: SAMPLE_DATA_URL, context: "", personaIds: [] }))
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 3: 통합 테스트 실행**

```bash
npm run test tests/integration/critique-route.test.ts
```

기대: 6 passed.

- [ ] **Step 4: 커밋**

```bash
git add app/api/critique/route.ts tests/integration/critique-route.test.ts
git commit -m "feat: /api/critique SSE endpoint with gatekeeper and parallel persona streaming"
```

---

## Phase 4: UI Components

### Task 11: Hero + 페르소나 미리보기 (랜딩 컴포넌트)

**Files:**
- Create: `components/Hero.tsx`
- Create: `components/PersonaPreviewGrid.tsx`

- [ ] **Step 1: `components/Hero.tsx` 작성**

```tsx
// components/Hero.tsx
import Link from "next/link"

export function Hero() {
  return (
    <section className="max-w-4xl mx-auto px-6 pt-20 pb-12 text-center">
      <p className="font-sans text-sm uppercase tracking-[0.2em] text-neutral-500 mb-6">
        Critic 6
      </p>
      <h1 className="font-serif text-5xl md:text-6xl leading-tight tracking-tight text-neutral-900 mb-6">
        당신의 디자인을<br/>
        <span className="text-neutral-500">6개 회사 페르소나</span>에게<br/>
        물어보세요.
      </h1>
      <p className="font-sans text-lg text-neutral-600 max-w-xl mx-auto mb-10 leading-relaxed">
        토스 PO, 카카오 디자인 리드 등 한국 IT 업계의 시그니처 페르소나가 당신의 작업을 동시에 크리틱합니다.
      </p>
      <Link
        href="/critique"
        className="inline-block bg-neutral-900 text-white px-8 py-4 text-base font-medium hover:bg-neutral-800 transition-colors"
      >
        지금 시작하기 →
      </Link>
    </section>
  )
}
```

- [ ] **Step 2: `components/PersonaPreviewGrid.tsx` 작성**

```tsx
// components/PersonaPreviewGrid.tsx
import { PERSONAS } from "@/lib/personas"

export function PersonaPreviewGrid() {
  return (
    <section className="max-w-5xl mx-auto px-6 py-16">
      <p className="font-sans text-xs uppercase tracking-[0.2em] text-neutral-500 text-center mb-8">
        Personas
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {PERSONAS.map((p) => (
          <div key={p.id} className="border border-neutral-200 p-6 hover:border-neutral-400 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.brandColor }} />
              <span className="font-sans text-xs uppercase tracking-wider text-neutral-500">
                {p.company} · {p.role}
              </span>
            </div>
            <h3 className="font-serif text-xl mb-3 text-neutral-900">{p.title}</h3>
            <p className="font-sans text-sm italic text-neutral-600 leading-relaxed">
              "{p.oneLineQuote}"
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 3: 커밋**

```bash
git add components/Hero.tsx components/PersonaPreviewGrid.tsx
git commit -m "feat: Hero and PersonaPreviewGrid components for landing"
```

---

### Task 12: UploadZone 컴포넌트

**Files:**
- Create: `components/UploadZone.tsx`

- [ ] **Step 1: `components/UploadZone.tsx` 작성**

```tsx
// components/UploadZone.tsx
"use client"

import { useCallback, useRef, useState } from "react"
import { resizeImage, validateImageFile, ImageValidationError } from "@/lib/image"

type Props = {
  onSubmit: (args: { dataUrl: string; context: string }) => void
  disabled?: boolean
}

export function UploadZone({ onSubmit, disabled }: Props) {
  const [dragOver, setDragOver] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [context, setContext] = useState("")
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    setError(null)
    try {
      validateImageFile(file)
      const { dataUrl } = await resizeImage(file)
      setDataUrl(dataUrl)
      setPreviewUrl(dataUrl)
    } catch (err) {
      if (err instanceof ImageValidationError) setError(err.message)
      else setError("이미지를 처리할 수 없어요. 다른 파일로 시도해 주세요.")
    }
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const submit = () => {
    if (!dataUrl) return
    onSubmit({ dataUrl, context: context.trim() })
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="font-serif text-3xl mb-2">디자인을 올려주세요</h1>
      <p className="font-sans text-sm text-neutral-500 mb-8">PNG · JPG · WebP, 최대 5MB</p>

      <label
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`block border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
          dragOver ? "border-neutral-900 bg-neutral-50" : "border-neutral-300"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={onChange}
          className="hidden"
          disabled={disabled}
        />
        {previewUrl ? (
          <div>
            <img src={previewUrl} alt="" className="max-h-64 mx-auto mb-4" />
            <p className="text-sm text-neutral-500">다른 파일 선택</p>
          </div>
        ) : (
          <div className="py-12">
            <p className="font-sans text-base text-neutral-700 mb-2">파일을 끌어다 놓거나 클릭하세요</p>
            <p className="font-sans text-xs text-neutral-400">PNG · JPG · WebP · 최대 5MB</p>
          </div>
        )}
      </label>

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

      <label className="block mt-8">
        <span className="font-sans text-sm text-neutral-700 mb-2 block">맥락 (선택)</span>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value.slice(0, 200))}
          placeholder="예: 무신사 신규 가입 플로우의 약관 동의 화면"
          rows={2}
          className="w-full border border-neutral-300 px-3 py-2 font-sans text-sm focus:outline-none focus:border-neutral-900"
          disabled={disabled}
        />
        <p className="text-xs text-neutral-400 mt-1 text-right">{context.length}/200</p>
      </label>

      <button
        onClick={submit}
        disabled={!dataUrl || disabled}
        className="w-full mt-6 py-4 bg-neutral-900 text-white font-medium disabled:bg-neutral-300 disabled:cursor-not-allowed hover:bg-neutral-800 transition-colors"
      >
        크리틱 받기 →
      </button>
    </div>
  )
}
```

- [ ] **Step 2: 커밋**

```bash
git add components/UploadZone.tsx
git commit -m "feat: UploadZone with drag-drop, image validation, and context input"
```

---

### Task 13: 광고 컴포넌트 3종

**Files:**
- Create: `components/ads/PigmaProAd.tsx`
- Create: `components/ads/NoCodeKingAd.tsx`
- Create: `components/ads/PixelMasterAd.tsx`

- [ ] **Step 1: `components/ads/PigmaProAd.tsx` 작성**

```tsx
// components/ads/PigmaProAd.tsx
export function PigmaProAd() {
  return (
    <div className="relative h-[280px] overflow-hidden bg-[#1e1b4b] text-white rounded">
      <style>{`
        @keyframes pigma-cursor {
          0% { transform: translate(40px, 30px) rotate(-12deg); }
          25% { transform: translate(160px, 50px) rotate(-12deg); }
          50% { transform: translate(180px, 100px) rotate(-12deg); }
          75% { transform: translate(60px, 130px) rotate(-12deg); }
          100% { transform: translate(40px, 30px) rotate(-12deg); }
        }
        @keyframes pigma-color { 0%{background:#f43f5e}33%{background:#06b6d4}66%{background:#f59e0b}100%{background:#f43f5e} }
        @keyframes pigma-scale { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
        @keyframes pigma-pulse { 0%,100%{background:rgba(255,255,255,0.12)} 50%{background:rgba(255,255,255,0.25)} }
        @keyframes pigma-peek { 0%,80%,100%{transform:translateY(0)} 85%,95%{transform:translateY(-3px)} }
      `}</style>

      {/* Mock app interface */}
      <div className="absolute top-8 left-3 right-3 bottom-[60px] bg-[#0f0d2e] rounded grid grid-cols-[60px_1fr_60px] overflow-hidden shadow-lg">
        {/* Layers panel */}
        <div className="bg-[#181537] p-2 flex flex-col gap-1.5 border-r border-white/5">
          <div className="text-[8px] opacity-40 uppercase tracking-wide px-0.5">Layers</div>
          <div className="flex items-center gap-1 px-1 py-0.5 bg-indigo-500/25 rounded-sm">
            <div className="w-2 h-2 bg-indigo-500" />
            <div className="text-[8px] opacity-90">Frame</div>
          </div>
          <div className="flex items-center gap-1 px-1 py-0.5" style={{ animation: "pigma-pulse 2s infinite" }}>
            <div className="w-2 h-2 bg-violet-400 rounded-full" />
            <div className="text-[8px] opacity-70">Circle</div>
          </div>
          <div className="flex items-center gap-1 px-1 py-0.5">
            <div className="w-2 h-2 bg-rose-500" />
            <div className="text-[8px] opacity-70">Shape</div>
          </div>
          <div className="flex items-center gap-1 px-1 py-0.5 opacity-50">
            <div className="w-2 h-2 bg-pink-200 rounded-full" />
            <div className="text-[8px] opacity-60">🐷</div>
          </div>
        </div>

        {/* Canvas */}
        <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg,#1e1b4b,#312e81)" }}>
          <div className="absolute inset-0 opacity-60" style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "12px 12px",
          }} />
          <div className="absolute top-6 left-7 w-[60px] h-8 rounded shadow-md" style={{ animation: "pigma-color 3s infinite, pigma-scale 2s infinite" }} />
          <div className="absolute top-[70px] left-[110px] w-6 h-6 rounded-full bg-violet-400" style={{ animation: "pigma-scale 1.8s infinite", boxShadow: "0 2px 8px rgba(167,139,250,0.5)" }} />
          <div className="absolute top-[115px] left-7 w-[120px] h-2 bg-white/40 rounded-sm" />
          <div className="absolute top-[130px] left-7 w-20 h-1.5 bg-white/25 rounded-sm" />

          <div className="absolute" style={{ animation: "pigma-cursor 5s infinite ease-in-out" }}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="#10b981">
              <path d="M0,0 L0,12 L4,8 L7,14 L9,13 L6,7 L11,7 Z" />
            </svg>
            <div className="absolute top-[18px] left-[14px] bg-emerald-500 text-white text-[8px] px-1.5 py-0.5 rounded-sm font-medium whitespace-nowrap">
              Yuna
            </div>
          </div>
        </div>

        {/* Inspector */}
        <div className="bg-[#181537] p-2 border-l border-white/5 relative">
          <div className="text-[8px] opacity-40 uppercase tracking-wide px-0.5 mb-1.5">Fill</div>
          <div className="flex gap-0.5 mb-2">
            <div className="w-3.5 h-3.5 rounded-sm" style={{ animation: "pigma-color 3s infinite" }} />
          </div>
          <div className="text-[8px] opacity-40 uppercase tracking-wide px-0.5 mb-1.5">Size</div>
          <div className="text-[8px] opacity-70 px-0.5">W 60</div>
          <div className="text-[8px] opacity-70 px-0.5">H 32</div>
          <div className="absolute bottom-2 right-1.5 text-sm" style={{ animation: "pigma-peek 4s infinite" }}>🐷</div>
        </div>
      </div>

      {/* Brand bar */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-3" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.5))" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative w-[18px] h-6">
              <div className="absolute top-0 left-0 w-2 h-2 bg-pink-200" style={{ borderRadius: "50% 50% 50% 0" }} />
              <div className="absolute top-0 left-2 w-2 h-2 bg-purple-500 rounded-full" />
              <div className="absolute top-2 left-0 w-2 h-2 bg-cyan-500" style={{ borderRadius: "50% 0 50% 50%" }} />
              <div className="absolute top-2 left-2 w-2 h-2 bg-emerald-500" style={{ borderRadius: "0 50% 50% 50%" }} />
              <div className="absolute top-4 left-0 w-2 h-2 bg-amber-500" style={{ borderRadius: "50% 50% 0 50%" }} />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight">Pigma <span className="font-normal opacity-70">Pro</span></div>
              <div className="text-[10px] opacity-65">실시간 협업 · 디자이너 100만이 선택한 그것™</div>
            </div>
          </div>
          <button className="bg-white text-[#1e1b4b] border-0 px-3.5 py-1.5 rounded text-[11px] font-semibold">
            7일 무료 →
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: `components/ads/NoCodeKingAd.tsx` 작성**

```tsx
// components/ads/NoCodeKingAd.tsx
export function NoCodeKingAd() {
  return (
    <div className="relative h-[280px] overflow-hidden bg-black text-white rounded">
      <style>{`
        @keyframes nck-pulse { 0%,100%{box-shadow:0 0 0 rgba(168,85,247,0)} 50%{box-shadow:0 0 30px rgba(168,85,247,0.6)} }
        @keyframes nck-scale { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
      `}</style>

      <div className="absolute top-10 left-5 right-5 grid grid-cols-2 gap-2 h-[140px]">
        <div className="bg-[#1f1f2e] rounded p-3">
          <div className="text-[9px] opacity-50 mb-1.5">BEFORE</div>
          <div className="h-2 bg-neutral-700 rounded mb-1" />
          <div className="h-2 bg-neutral-700 rounded mb-1 w-[70%]" />
          <div className="h-5 bg-neutral-600 rounded mt-2.5" />
        </div>
        <div
          className="rounded p-3"
          style={{ background: "linear-gradient(135deg,#3b82f6,#a855f7)", animation: "nck-pulse 2s infinite, nck-scale 3s infinite" }}
        >
          <div className="text-[9px] opacity-90 mb-1.5">AFTER ✨</div>
          <div className="h-2 bg-white/90 rounded mb-1" />
          <div className="h-2 bg-white/90 rounded mb-1 w-[70%]" />
          <div className="h-5 bg-white/95 rounded mt-2.5" />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="text-lg font-bold mb-0.5" style={{
          background: "linear-gradient(90deg,#fff,#a78bfa)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>NoCodeKing AI</div>
        <div className="text-[11px] opacity-70">코드 한 줄 없이 — AI가 앱을 만들어 드립니다</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: `components/ads/PixelMasterAd.tsx` 작성**

```tsx
// components/ads/PixelMasterAd.tsx
export function PixelMasterAd() {
  return (
    <div className="relative h-[280px] overflow-hidden rounded" style={{ background: "#0f1419", color: "#f5f1e8" }}>
      <style>{`
        @keyframes pm-slide {
          0%, 25% { transform: translateY(0); }
          33%, 58% { transform: translateY(-100%); }
          66%, 91% { transform: translateY(-200%); }
          100% { transform: translateY(0); }
        }
        @keyframes pm-glow {
          0%,100%{ box-shadow: 0 0 0 rgba(212,175,55,0); }
          50%{ box-shadow: 0 0 16px rgba(212,175,55,0.25); }
        }
      `}</style>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, #d4af37, transparent)" }} />

      <div className="absolute top-9 left-5 right-5 h-[120px] overflow-hidden">
        <div style={{ animation: "pm-slide 6s infinite" }}>
          {[
            { initial: "K", year: "2024", company: "TOSS", quote: "3개월 만에 시야가 완전히 달라졌습니다." },
            { initial: "P", year: "2024", company: "KAKAO", quote: "포트폴리오의 깊이가 달라졌어요." },
            { initial: "L", year: "2024", company: "NAVER", quote: "사고의 프레임을 다시 짰습니다." },
          ].map((t, i) => (
            <div key={i} className="h-[120px] py-3.5 flex items-center gap-3.5 border-b border-white/5">
              <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-serif font-semibold"
                   style={{ background: "linear-gradient(135deg,#3a4a5c,#1f2937)", color: "#d4af37" }}>
                {t.initial}
              </div>
              <div className="flex-1">
                <div className="text-[11px] opacity-50 tracking-widest uppercase mb-1">{t.year} · {t.company}</div>
                <div className="font-serif text-[13px] leading-snug opacity-95">"{t.quote}"</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 px-5 py-3.5" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.4))" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-serif text-lg tracking-wide" style={{ color: "#d4af37", animation: "pm-glow 3s infinite" }}>
              PIXEL MASTER
            </div>
            <div className="text-[10px] opacity-50 tracking-widest uppercase mt-0.5">Senior Design Program</div>
          </div>
          <div className="text-[10px] opacity-50 tracking-wide">EST. 2019</div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 커밋**

```bash
git add components/ads/PigmaProAd.tsx components/ads/NoCodeKingAd.tsx components/ads/PixelMasterAd.tsx
git commit -m "feat: 3 parody ad components (Pigma Pro, NoCodeKing AI, Pixel Master)"
```

---

### Task 14: AdModal (5초 카운트다운 + 랜덤 광고)

**Files:**
- Create: `components/AdModal.tsx`

- [ ] **Step 1: `components/AdModal.tsx` 작성**

```tsx
// components/AdModal.tsx
"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { PigmaProAd } from "./ads/PigmaProAd"
import { NoCodeKingAd } from "./ads/NoCodeKingAd"
import { PixelMasterAd } from "./ads/PixelMasterAd"

const COUNTDOWN_SECONDS = 5

type Props = {
  open: boolean
  onClose: () => void  // 광고 시청 완료 후 호출
  onCancel: () => void // 사용자가 닫기 (5초 후에만 가능)
}

const ADS = [PigmaProAd, NoCodeKingAd, PixelMasterAd]

export function AdModal({ open, onClose, onCancel }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS)
  const skipBtnRef = useRef<HTMLButtonElement>(null)

  // 모달 열릴 때마다 광고 1개 랜덤 선택 (모달이 닫혔다 다시 열리면 다시 뽑음)
  const AdComponent = useMemo(() => {
    if (!open) return PigmaProAd
    return ADS[Math.floor(Math.random() * ADS.length)]
  }, [open])

  // 카운트다운
  useEffect(() => {
    if (!open) return
    setSecondsLeft(COUNTDOWN_SECONDS)
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [open])

  // ESC 키 (5초 후에만 동작)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && secondsLeft === 0) onCancel()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, secondsLeft, onCancel])

  // 5초 도달 시 skip 버튼에 포커스
  useEffect(() => {
    if (secondsLeft === 0 && skipBtnRef.current) skipBtnRef.current.focus()
  }, [secondsLeft])

  if (!open) return null

  const skip = () => {
    if (secondsLeft > 0) return
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="광고"
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && secondsLeft === 0) onCancel()
      }}
    >
      <div className="w-full max-w-sm">
        <AdComponent />

        <div className="bg-white p-3 flex items-center justify-between rounded-b">
          <div className="text-xs text-neutral-500" aria-live="polite">
            {secondsLeft > 0 ? `${secondsLeft}초 후 건너뛰기` : "건너뛰기 가능"}
          </div>
          <button
            ref={skipBtnRef}
            onClick={skip}
            disabled={secondsLeft > 0}
            className="px-4 py-1.5 text-sm bg-neutral-900 text-white disabled:bg-neutral-300 disabled:cursor-not-allowed font-medium"
          >
            {secondsLeft > 0 ? `${secondsLeft}` : "건너뛰기 ✕"}
          </button>
        </div>

        <p className="text-[10px] text-neutral-400 text-center mt-2">
          * Critic 6의 가상 광고입니다.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 커밋**

```bash
git add components/AdModal.tsx
git commit -m "feat: AdModal with 5-second countdown and random ad selection"
```

---

### Task 15: PersonaCard (잠금/스트리밍 표시)

**Files:**
- Create: `components/PersonaCard.tsx`

- [ ] **Step 1: `components/PersonaCard.tsx` 작성**

```tsx
// components/PersonaCard.tsx
"use client"

import { getPersona } from "@/lib/personas"
import type { PersonaCardState } from "@/lib/types"

type Props = {
  state: PersonaCardState
  onUnlockClick: () => void
}

export function PersonaCard({ state, onUnlockClick }: Props) {
  const p = getPersona(state.id)
  const isLocked = state.status === "locked"
  const isLoading = state.status === "unlocked-loading"
  const hasError = state.status === "error"

  return (
    <div
      className={`relative border border-neutral-200 bg-white p-5 min-h-[300px] flex flex-col ${
        isLocked ? "select-none" : "animate-blur-in"
      }`}
    >
      {/* 헤더: 회사 + 타이틀 */}
      <div className={isLocked ? "blur-sm" : ""}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.brandColor }} />
          <span className="font-sans text-[11px] uppercase tracking-widest text-neutral-500">
            {p.company} · {p.role}
          </span>
        </div>
        <h3 className="font-serif text-lg text-neutral-900 mb-3">{p.title}</h3>
      </div>

      {/* 본문 */}
      <div className={`flex-1 ${isLocked ? "blur-md pointer-events-none" : ""}`}>
        {hasError ? (
          <ErrorView message={state.error ?? "응답 생성 실패"} />
        ) : (
          <ContentView state={state} />
        )}
      </div>

      {/* 잠금 오버레이 */}
      {isLocked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40">
          <div className="text-2xl mb-3">🔒</div>
          <button
            onClick={onUnlockClick}
            className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors"
            aria-label={`${p.company} ${p.role} 페르소나 잠금 해제, 광고 보고 열기`}
          >
            광고 보고 열기 (5초)
          </button>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60">
          <div className="text-sm text-neutral-500">응답 받는 중…</div>
        </div>
      )}
    </div>
  )
}

function ContentView({ state }: { state: PersonaCardState }) {
  const c = state.content ?? {}
  return (
    <div className="space-y-4">
      {c.oneliner && (
        <p className="font-serif text-base italic text-neutral-800 leading-relaxed border-l-2 border-neutral-300 pl-3">
          "{c.oneliner}"
        </p>
      )}
      <Section label="강점" items={c.strengths} />
      <Section label="우려" items={c.concerns} />
      <Section label="제안" items={c.suggestions} />
    </div>
  )
}

function Section({ label, items }: { label: string; items?: string[] }) {
  if (!items || items.length === 0) return null
  return (
    <div>
      <div className="font-sans text-[11px] uppercase tracking-widest text-neutral-500 mb-1.5">{label}</div>
      <ul className="space-y-1">
        {items.map((s, i) => (
          <li key={i} className="font-sans text-sm text-neutral-700 leading-relaxed">· {s}</li>
        ))}
      </ul>
    </div>
  )
}

function ErrorView({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <p className="text-sm text-neutral-500 mb-3">응답을 받을 수 없었어요</p>
      <p className="text-xs text-neutral-400">{message}</p>
    </div>
  )
}
```

- [ ] **Step 2: 커밋**

```bash
git add components/PersonaCard.tsx
git commit -m "feat: PersonaCard with locked, loading, streaming, and error states"
```

---

### Task 16: ResultGrid + ErrorScreen

**Files:**
- Create: `components/ResultGrid.tsx`
- Create: `components/ErrorScreen.tsx`

- [ ] **Step 1: `components/ResultGrid.tsx` 작성**

```tsx
// components/ResultGrid.tsx
"use client"

import { PersonaCard } from "./PersonaCard"
import type { PersonaCardState, PersonaId } from "@/lib/types"

type Props = {
  states: PersonaCardState[]
  onUnlock: (id: PersonaId) => void
}

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
```

- [ ] **Step 2: `components/ErrorScreen.tsx` 작성**

```tsx
// components/ErrorScreen.tsx
"use client"

type Props = {
  reason: string
  suggestion?: string
  onRetry: () => void
}

export function ErrorScreen({ reason, suggestion, onRetry }: Props) {
  return (
    <div className="max-w-md mx-auto px-6 py-16 text-center">
      <div className="text-5xl mb-6">🎨</div>
      <h2 className="font-serif text-2xl mb-4">
        이 이미지로는 디자인 크리틱이 어려워요
      </h2>
      <p className="font-sans text-sm text-neutral-600 mb-2">
        <strong>이유:</strong> {reason}
      </p>
      {suggestion && (
        <p className="font-sans text-sm text-neutral-600 mb-8">
          <strong>추천:</strong> {suggestion}
        </p>
      )}
      <button
        onClick={onRetry}
        className="mt-4 px-6 py-3 bg-neutral-900 text-white font-medium hover:bg-neutral-800 transition-colors"
      >
        다시 올리기
      </button>
    </div>
  )
}
```

- [ ] **Step 3: 커밋**

```bash
git add components/ResultGrid.tsx components/ErrorScreen.tsx
git commit -m "feat: ResultGrid and ErrorScreen components"
```

---

### Task 17: HistoryList 컴포넌트

**Files:**
- Create: `components/HistoryList.tsx`

- [ ] **Step 1: `components/HistoryList.tsx` 작성**

```tsx
// components/HistoryList.tsx
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
```

- [ ] **Step 2: 커밋**

```bash
git add components/HistoryList.tsx
git commit -m "feat: HistoryList component for viewing past critiques"
```

---

## Phase 5: Pages

### Task 18: 랜딩 페이지

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: `app/page.tsx` 작성**

```tsx
// app/page.tsx
import { Hero } from "@/components/Hero"
import { PersonaPreviewGrid } from "@/components/PersonaPreviewGrid"
import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen">
      <nav className="px-6 py-4 flex justify-between items-center border-b border-neutral-100">
        <span className="font-serif text-xl">Critic 6</span>
        <Link href="/history" className="font-sans text-sm text-neutral-600 hover:text-neutral-900">
          내 크리틱
        </Link>
      </nav>
      <Hero />
      <PersonaPreviewGrid />
      <footer className="py-12 text-center text-xs text-neutral-400">
        © 2026 Critic 6 · 가상 광고/페르소나는 패러디 목적입니다.
      </footer>
    </main>
  )
}
```

- [ ] **Step 2: 시각 확인**

```bash
npm run dev
```

`http://localhost:3000`에서 랜딩 확인 후 종료.

- [ ] **Step 3: 커밋**

```bash
git add app/page.tsx
git commit -m "feat: landing page with hero and persona preview grid"
```

---

### Task 19: 크리틱 페이지 (업로드 + 결과 + 잠금 해제)

**Files:**
- Create: `app/critique/page.tsx`

- [ ] **Step 1: `app/critique/page.tsx` 작성**

이 페이지는 클라이언트 컴포넌트로, 4가지 모드를 갖습니다:
1. `idle`: 업로드 폼
2. `submitting`: 게이트키퍼 검증 중
3. `result`: 6개 카드 그리드 + 광고 모달
4. `rejected`: 게이트키퍼 거부 화면

```tsx
// app/critique/page.tsx
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
```

- [ ] **Step 2: 커밋**

```bash
git add app/critique/page.tsx
git commit -m "feat: critique page with upload, streaming results, and ad-gated unlock"
```

---

### Task 20: 히스토리 페이지

**Files:**
- Create: `app/history/page.tsx`

- [ ] **Step 1: `app/history/page.tsx` 작성**

```tsx
// app/history/page.tsx
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
```

- [ ] **Step 2: 커밋**

```bash
git add app/history/page.tsx
git commit -m "feat: history page reading from localStorage"
```

---

## Phase 6: Integration & Deployment

### Task 21: E2E 테스트 — Happy Path

**Files:**
- Create: `tests/e2e/happy-path.spec.ts`
- Create: `tests/e2e/fixtures/sample-ui.png` (작은 PNG)

- [ ] **Step 1: 샘플 이미지 준비**

```bash
mkdir -p tests/e2e/fixtures
# 1x1 투명 PNG를 base64로 만들어 1024x1024로 패딩한 단색 PNG로 변환 (수동 또는 ImageMagick)
# 이미 있다면 건너뜀. 없으면 ImageMagick로:
which convert >/dev/null && convert -size 800x600 xc:'#cccccc' tests/e2e/fixtures/sample-ui.png || \
  echo "ImageMagick 없음 — tests/e2e/fixtures/sample-ui.png를 직접 800x600 PNG로 준비하세요"
```

기대: `tests/e2e/fixtures/sample-ui.png` 파일 존재.

- [ ] **Step 2: `tests/e2e/happy-path.spec.ts` 작성**

```ts
// tests/e2e/happy-path.spec.ts
import { test, expect } from "@playwright/test"
import path from "path"

test.describe("Critic 6 happy path", () => {
  test("랜딩 → 업로드 → 결과 페이지 → 4개 잠금 → 광고 시청 → 1개 해제", async ({ page }) => {
    // 1. 랜딩
    await page.goto("/")
    await expect(page.getByRole("heading", { name: /6개 회사 페르소나/ })).toBeVisible()

    // 2. 업로드 페이지로 이동
    await page.getByRole("link", { name: /지금 시작하기/ }).click()
    await expect(page).toHaveURL(/\/critique/)

    // 3. 파일 선택
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(path.resolve(__dirname, "fixtures/sample-ui.png"))

    // 4. 맥락 입력
    await page.getByPlaceholder(/약관 동의 화면/).fill("테스트 화면")

    // 5. 제출
    await page.getByRole("button", { name: /크리틱 받기/ }).click()

    // 6. 결과 화면 진입 (게이트키퍼 통과 가정 — 실제 Gemini 호출 발생)
    // 시간 여유: 게이트키퍼 1~2초 + 첫 청크
    // 단, CI에선 Gemini 호출 비용 발생하므로 .env.local에 GEMINI_API_KEY 필요
    await expect(page.locator('button:has-text("광고 보고 열기")')).toHaveCount(4, { timeout: 30_000 })

    // 7. 첫 번째 블러 카드 클릭 → 광고 모달 열림
    await page.locator('button:has-text("광고 보고 열기")').first().click()
    await expect(page.getByRole("dialog", { name: /광고/ })).toBeVisible()

    // 8. 5초 카운트다운 + 건너뛰기
    await expect(page.locator('button:has-text("건너뛰기 ✕")')).toBeVisible({ timeout: 7_000 })
    await page.locator('button:has-text("건너뛰기 ✕")').click()

    // 9. 카드 하나가 잠금 해제됨 (블러 버튼이 3개로 줄어듦)
    await expect(page.locator('button:has-text("광고 보고 열기")')).toHaveCount(3, { timeout: 15_000 })
  })
})
```

- [ ] **Step 3: E2E 실행 (로컬에서 GEMINI_API_KEY 필요)**

```bash
# .env.local에 GEMINI_API_KEY 설정 필요
npm run test:e2e
```

기대: 시나리오 통과. 실패 시 `playwright-report/` 확인.

- [ ] **Step 4: 커밋**

```bash
git add tests/e2e/happy-path.spec.ts tests/e2e/fixtures/sample-ui.png
git commit -m "test: E2E happy path scenario for upload, stream, and unlock"
```

---

### Task 22: E2E — 새로고침 복구

**Files:**
- Create: `tests/e2e/refresh-recovery.spec.ts`

- [ ] **Step 1: `tests/e2e/refresh-recovery.spec.ts` 작성**

```ts
// tests/e2e/refresh-recovery.spec.ts
import { test, expect } from "@playwright/test"
import path from "path"

test("결과 화면 새로고침 시 sessionStorage에서 복원", async ({ page }) => {
  await page.goto("/critique")
  await page.locator('input[type="file"]').setInputFiles(path.resolve(__dirname, "fixtures/sample-ui.png"))
  await page.getByPlaceholder(/약관 동의 화면/).fill("복원 테스트")
  await page.getByRole("button", { name: /크리틱 받기/ }).click()

  // 결과 화면 진입 대기
  await expect(page.locator('button:has-text("광고 보고 열기")')).toHaveCount(4, { timeout: 30_000 })

  // 새로고침
  await page.reload()

  // 잠금 4개가 그대로 표시 (sessionStorage 복원)
  await expect(page.locator('button:has-text("광고 보고 열기")')).toHaveCount(4, { timeout: 15_000 })

  // 맥락 텍스트도 복원
  await expect(page.locator("text=복원 테스트")).toBeVisible()
})
```

- [ ] **Step 2: 실행**

```bash
npm run test:e2e -- tests/e2e/refresh-recovery.spec.ts
```

기대: 통과.

- [ ] **Step 3: 커밋**

```bash
git add tests/e2e/refresh-recovery.spec.ts
git commit -m "test: E2E refresh recovery via sessionStorage"
```

---

### Task 23: 수동 체크리스트 + Vercel 배포

**Files:**
- Create: `docs/MANUAL_CHECKLIST.md`
- Modify: `README.md`

- [ ] **Step 1: 빌드 확인**

```bash
npm run build
```

기대: 에러 없이 완료. `.next/` 디렉터리 생성.

- [ ] **Step 2: `docs/MANUAL_CHECKLIST.md` 작성**

```md
# 배포 전 수동 체크리스트

## 기능
- [ ] 모바일 (iPhone Safari, Android Chrome) 레이아웃 깨짐 없음
- [ ] 키보드만으로 전체 플로우 가능 (Tab/Enter/ESC)
- [ ] 6명 카드 동시 스트리밍 시 시각적 깨짐 없음
- [ ] 광고 3종 모두 랜덤 노출 확인 (5번 시도)
- [ ] 잘못된 이미지(고양이 사진 등) 업로드 시 친절한 거부 메시지
- [ ] localStorage 풀 차면 가장 오래된 항목 자동 삭제 (6번째 크리틱 후 첫 번째가 사라짐)
- [ ] 새로고침 시 진행 중 세션 복원
- [ ] 잠긴 카드는 광고 보기 전 Gemini 호출 발생 안 함 (네트워크 탭 확인)

## 비주얼
- [ ] Editorial Minimal 톤 (흑백 + 세리프 헤딩)
- [ ] 페르소나 카드의 회사별 시그니처 컬러바 표시
- [ ] 광고 모달의 5초 카운트다운 정확
- [ ] PIGMA Pro 광고에서 🐷 부활절 달걀 표시

## 에러
- [ ] 네트워크 끊김 시 적절한 안내
- [ ] Gemini API 키 미설정 시 명확한 에러
```

- [ ] **Step 3: `README.md` 업데이트**

```md
# Critic 6

디자이너가 본인 작업물을 올리면 6개 한국 IT 기업 페르소나(토스 PO, 쿠팡 PO, 네이버 PO, 당근 디자인 리드, 배민 디자인 리드, 카카오 디자인 리드)가 동시에 크리틱을 해주는 AI 도구.

## 로컬 실행

```bash
cp .env.local.example .env.local
# .env.local 의 GEMINI_API_KEY를 https://aistudio.google.com/app/apikey 에서 발급받아 입력
npm install
npm run dev
```

http://localhost:3000 접속.

## 테스트

```bash
npm run test           # 단위 + 통합
npm run test:e2e       # E2E (Playwright)
```

## 배포 (Vercel)

1. Vercel 계정에서 이 저장소 import
2. Environment Variables에 `GEMINI_API_KEY` 추가
3. 배포 → 자동으로 Production URL 발급

## 문서

- 디자인 스펙: `docs/superpowers/specs/2026-04-21-critic-6-design.md`
- 구현 계획: `docs/superpowers/plans/2026-04-21-critic-6-implementation.md`
- 수동 체크리스트: `docs/MANUAL_CHECKLIST.md`

## 주의

- 가상 광고(Pigma Pro, NoCodeKing AI, Pixel Master)는 모두 패러디입니다.
- 페르소나 발언은 실제 회사/직원의 의견을 대표하지 않으며, AI가 생성한 가상 캐릭터의 발언입니다.
```

- [ ] **Step 4: 커밋 + 푸시**

```bash
git add docs/MANUAL_CHECKLIST.md README.md
git commit -m "docs: manual deployment checklist and updated README"
git push origin main
```

- [ ] **Step 5: Vercel 배포 (수동)**

수동 작업이므로 가이드만:

1. https://vercel.com/new 에서 `djvlwm602-collab/project07` import
2. Framework Preset: Next.js (자동 인식)
3. Environment Variables: `GEMINI_API_KEY` 추가 (https://aistudio.google.com/app/apikey 에서 발급)
4. Deploy 클릭
5. 배포 완료 후 Production URL 확인 (예: `https://project07.vercel.app`)
6. URL을 README와 포폴 문서에 기재

- [ ] **Step 6: 라이브 URL 수동 체크리스트 실행**

배포된 사이트에서 `docs/MANUAL_CHECKLIST.md`의 모든 항목 점검.

- [ ] **Step 7: 최종 커밋 (URL 기재)**

```bash
# README의 적절한 위치에 라이브 URL 추가 후
git add README.md
git commit -m "docs: add live deployment URL"
git push origin main
```

---

## Self-Review Notes

이 플랜에서 이미 검증한 항목:
- 스펙의 14개 섹션 모두 태스크에 매핑됨
- 페르소나 6명 정의 → Task 5
- 게이트키퍼 → Task 8 + Task 10
- 6명 병렬 스트리밍 → Task 10 + Task 19
- 잠긴 4개는 광고 시청 전 호출 안 함 → Task 19 (요청 시점에만 fetch)
- localStorage/sessionStorage → Task 7 + Task 19
- 광고 3종 + 5초 카운트다운 → Task 13 + Task 14
- 게이트키퍼 거부 시 ErrorScreen → Task 16 + Task 19
- 새로고침 복구 → Task 19 + Task 22
- E2E 시나리오 A/B → Task 21 + Task 22
- 비주얼 디자인 (Editorial Minimal + 회사 컬러바) → Task 2 + Task 11 + Task 15

**알려진 제약:**
- E2E 테스트는 실제 Gemini API 호출 발생 → CI에서 비용 주의 (또는 MSW 모킹으로 대체 가능, v2 후보)
- Pigma Pro 등 광고 컴포넌트는 단위 테스트 없음 (시각만, E2E와 수동에서 검증)
- Edge Runtime 대신 Node Runtime 사용 (`@google/generative-ai` SDK 호환성 문제 회피)

---

**Plan complete and saved to `docs/superpowers/plans/2026-04-21-critic-6-implementation.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — 태스크별로 새 서브에이전트 디스패치, 태스크 사이마다 리뷰, 빠른 반복

**2. Inline Execution** — 이 세션에서 직접 실행, 체크포인트마다 리뷰, 배치 실행

**Which approach?**
