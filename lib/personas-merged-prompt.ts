/**
 * Role: 모든 리뷰어의 시스템 프롬프트를 하나로 합성 + 합병 JSON 스키마 정의
 * Key Features: buildMergedSystemPrompt(personas), MERGED_RESPONSE_SCHEMA (reviewers.{id}: PersonaResponse)
 * Dependencies: @google/generative-ai (SchemaType), ./personas, ./types
 * Notes: 6번 호출을 1회로 합쳐 Gemini 무료 티어 한도를 크게 절약. 말투 유지를 위해 리뷰어별 가이드를 명확히 분리.
 */
import { SchemaType, type ResponseSchema } from "@google/generative-ai"
import type { Persona, PersonaId } from "./types"

// 개별 리뷰어 응답 스키마 (PersonaResponse와 1:1 대응)
const REVIEWER_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    oneliner: { type: SchemaType.STRING, description: "리뷰어 톤이 가장 잘 드러나는 한 마디 (15~30자)" },
    strengths: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    concerns: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    suggestions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
  },
  required: ["oneliner", "strengths", "concerns", "suggestions"],
}

// 모든 리뷰어가 한 JSON에 각 키로 들어가는 통합 스키마
export function buildMergedResponseSchema(personaIds: PersonaId[]): ResponseSchema {
  const reviewerProps: Record<string, ResponseSchema> = {}
  for (const id of personaIds) reviewerProps[id] = REVIEWER_SCHEMA
  return {
    type: SchemaType.OBJECT,
    properties: {
      reviewers: {
        type: SchemaType.OBJECT,
        properties: reviewerProps,
        required: personaIds,
      },
    },
    required: ["reviewers"],
  }
}

// 역할: 모든 리뷰어 시스템 프롬프트를 하나로 합쳐 Gemini 단일 호출로 처리
// 각 리뷰어별 블록을 명확히 구분해 말투가 뭉개지지 않도록 설계
export function buildMergedSystemPrompt(personas: Persona[]): string {
  const reviewerBlocks = personas
    .map((p, idx) => buildReviewerBlock(p, idx + 1))
    .join("\n\n")

  const keysExample = personas
    .map((p) => `    "${p.id}": { "oneliner": ..., "strengths": [...], "concerns": [...], "suggestions": [...] }`)
    .join(",\n")

  return `다음 디자인 작업물을 ${personas.length}명의 한국 IT 업계 현업자 관점으로 각각 크리틱해주세요.
각자의 말투·관점·시그니처 표현을 반드시 지키세요.
말투가 섞이거나 구분이 안 되면 실패한 응답입니다.

각 리뷰어는 모두 가상의 인물입니다. 한국어로 답변하고, AI 티 내지 말고 사람처럼 작성하세요.

${reviewerBlocks}

[응답 형식]
반드시 아래 JSON 구조를 정확히 지키세요. 최상위 키 "reviewers" 하나만 두고, 그 안에 각 리뷰어의 id를 키로 응답을 담습니다.

{
  "reviewers": {
${keysExample}
  }
}

각 리뷰어 블록 규칙:
- oneliner: 그 리뷰어 톤이 드러나는 한 마디 (15~30자)
- strengths / concerns / suggestions: 각 2~3개 요소
- 모든 필드 필수. 크리틱이 어려운 이미지라도 oneliner에 솔직한 소감을 넣고
  나머지 배열은 "이미지가 명확치 않아 구체적 평가는 어렵다" 같은 내용으로라도 채우세요.

피해야 할 것:
- 일반론 ("디자인이 좋네요")
- 다른 리뷰어 말투 섞이기 (블록별 톤 가이드를 엄격히 따를 것)
- 영어 표현 남용 (자연스러운 곳만)`
}

function buildReviewerBlock(persona: Persona, index: number): string {
  return `[리뷰어 ${index}. ${persona.company} ${persona.role} — 키: "${persona.id}"]
- 타이틀: "${persona.title}"
- 말투 가이드:
${indent(persona.toneDescription)}
- 평가 시 특히 다음을 신경 써서 봄:
${persona.focusAreas.map((a) => `  - ${a}`).join("\n")}`
}

function indent(text: string): string {
  return text
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n")
}
