/**
 * Role: 모든 리뷰어 응답을 단일 Gemini 호출로 스트리밍 (무료 티어 호출 절감)
 * Key Features: streamMergedReviewers — merged system prompt + MERGED_RESPONSE_SCHEMA로 1회 호출
 *              parseMergedResponse — 부분/전체 JSON에서 reviewers map 추출
 * Dependencies: @google/generative-ai, partial-json, ./personas, ./personas-merged-prompt, ./gemini(GEMINI_MODEL/getGenAI/GeminiImageInput)
 * Notes: 각 리뷰어 응답 shape는 PersonaResponse와 동일 → UI는 그대로 재사용.
 */
import { type GenerationConfig } from "@google/generative-ai"
import { PERSONAS } from "./personas"
import { buildMergedSystemPrompt, buildMergedResponseSchema } from "./personas-merged-prompt"
import { getGenAI, GEMINI_MODEL, type GeminiImageInput } from "./gemini"
import type { PersonaId } from "./types"

// 파싱 함수는 클라/서버 공용을 위해 분리 모듈에서 re-export
export { parseMergedResponse, type MergedReviewers } from "./parse-merged"

// maxOutputTokens를 넉넉히 — N명 × 응답 평균 ~500토큰 → 3600으로 여유
const MERGED_GENERATION_CONFIG: Omit<GenerationConfig, "responseSchema"> = {
  temperature: 0.85,
  maxOutputTokens: 3600,
  responseMimeType: "application/json",
}

// 역할: PERSONAS 전체(또는 지정된 서브셋)에 대해 단일 Gemini 스트리밍 호출
export async function* streamMergedReviewers(
  userContext: string,
  image: GeminiImageInput,
  personaIds: PersonaId[] = PERSONAS.map((p) => p.id)
): AsyncGenerator<string, void, void> {
  const genAI = getGenAI()
  const personas = PERSONAS.filter((p) => personaIds.includes(p.id))
  const systemInstruction = buildMergedSystemPrompt(personas)
  const responseSchema = buildMergedResponseSchema(personaIds)

  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction,
    generationConfig: { ...MERGED_GENERATION_CONFIG, responseSchema },
  })

  const userText = `맥락: ${userContext || "(없음)"}`
  const result = await model.generateContentStream([
    userText,
    { inlineData: { mimeType: image.mimeType, data: image.data } },
  ])

  for await (const chunk of result.stream) {
    const text = chunk.text()
    if (text) yield text
  }
}
