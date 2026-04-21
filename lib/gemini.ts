/**
 * Role: Gemini API 래퍼 — 페르소나 프롬프트 빌더, 부분 JSON 파서, 스트리밍/게이트키퍼 호출
 * Key Features: buildPersonaPrompt, parsePersonaResponse, streamPersonaResponse, runGatekeeper
 * Dependencies: @google/generative-ai, partial-json, ./types
 * Notes: 네트워크 호출 함수(stream/gatekeeper)는 단위 테스트 대상이 아님 — 통합 테스트에서 모킹
 */
import { GoogleGenerativeAI, SchemaType, type GenerationConfig, type ResponseSchema } from "@google/generative-ai"
import { parse as parsePartialJson, Allow } from "partial-json"
import type { Persona, PersonaResponse, GatekeeperResult } from "./types"

// SDK의 SchemaType enum을 사용해야 responseSchema가 실제로 적용됨 (string 리터럴로는 무시됨)
export const PERSONA_RESPONSE_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    oneliner: { type: SchemaType.STRING, description: "페르소나 톤이 가장 잘 드러나는 한 마디 (15~30자)" },
    strengths: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    concerns: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    suggestions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
  },
  required: ["oneliner", "strengths", "concerns", "suggestions"],
}

export const GATEKEEPER_RESPONSE_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    valid: { type: SchemaType.BOOLEAN },
    category: { type: SchemaType.STRING, enum: ["ui", "graphic", "wireframe", "other"] },
    confidence: { type: SchemaType.STRING, enum: ["high", "medium", "low"] },
    reason: { type: SchemaType.STRING },
    suggestion: { type: SchemaType.STRING },
  },
  required: ["valid"],
}

export type PersonaPrompt = {
  systemInstruction: string
  userText: string
}

// 역할: 페르소나 정보를 시스템 프롬프트로 변환 — 모델이 일관된 톤·관점을 유지하도록 강제
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

반드시 아래 JSON 구조로만 답하세요. 다른 키를 추가하거나 변형하지 마세요:
{
  "oneliner": "페르소나 톤이 드러나는 한 마디 (15~30자)",
  "strengths": ["강점1", "강점2", "강점3"],
  "concerns": ["우려1", "우려2", "우려3"],
  "suggestions": ["제안1", "제안2", "제안3"]
}
- 각 배열은 2~3개 요소
- 모든 필드는 필수. 크리틱이 어려워도 oneliner에 소감을 넣고 나머지 배열은 "이미지가 명확치 않아 구체적 평가는 어렵다" 같은 내용으로라도 채우세요.`

  const userText = `맥락: ${userContext || "(없음)"}`
  return { systemInstruction, userText }
}

// 역할: 스트리밍 중간 청크(불완전 JSON)도 partial 파싱 — UI에서 단계적 렌더링 가능
export function parsePersonaResponse(text: string): Partial<PersonaResponse> {
  if (!text || !text.trim()) return {}
  try {
    const parsed = parsePartialJson(text, Allow.ALL) as Partial<PersonaResponse>
    return parsed ?? {}
  } catch {
    return {}
  }
}

// 역할: 환경변수에서 API 키를 읽어 GoogleGenerativeAI 인스턴스 생성 — 키 누락 시 명시적 실패
export function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error("GEMINI_API_KEY missing")
  return new GoogleGenerativeAI(apiKey)
}

// responseSchema를 같이 전달해야 flash-lite 같은 경량 모델도 스키마를 강제로 따름
export const PERSONA_GENERATION_CONFIG: GenerationConfig = {
  temperature: 0.85,
  maxOutputTokens: 600,
  responseMimeType: "application/json",
  responseSchema: PERSONA_RESPONSE_SCHEMA,
}

export const GATEKEEPER_GENERATION_CONFIG: GenerationConfig = {
  temperature: 0.2,
  maxOutputTokens: 200,
  responseMimeType: "application/json",
  responseSchema: GATEKEEPER_RESPONSE_SCHEMA,
}

// 모델 이름을 환경변수로 분리 — 무료 티어 한도 우회용 모델 전환(lite) 및 유료 전환 시 flash 복원을 쉽게 하기 위함
// 기본값은 무료 티어에서 한도가 상대적으로 넉넉한 flash-lite (needs verification: 정확한 RPD는 공식 문서 확인 필요)
export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite"

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

// 역할: 페르소나 시스템 프롬프트 + 이미지로 Gemini 스트리밍 호출 — 청크 단위 텍스트 yield
export async function* streamPersonaResponse(
  persona: Persona,
  userContext: string,
  image: GeminiImageInput
): AsyncGenerator<string, void, void> {
  const genAI = getGenAI()
  const { systemInstruction, userText } = buildPersonaPrompt(persona, userContext)
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
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

// 역할: 업로드된 이미지가 디자인 크리틱 대상인지 검증 — 일반 사진/밈 등을 게이트에서 차단
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
    model: GEMINI_MODEL,
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
    // 파싱 실패 시 안전하게 valid 처리 (게이트 통과) — 게이트키퍼가 죽어 사용자 흐름이 막히지 않게 함
    return { valid: true, confidence: "low" }
  }
}
