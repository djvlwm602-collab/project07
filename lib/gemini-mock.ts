/**
 * Role: Gemini API Mock — .env의 MOCK_CRITIQUE=1 로 활성화되는 개발/UI 테스트용 스텁
 * Key Features: mockGatekeeper(딜레이 후 valid), mockPersonaStream(JSON을 청크로 쪼개 SSE 흉내)
 * Dependencies: ./types (Persona, PersonaId, PersonaResponse, GatekeeperResult)
 * Notes: 실제 Gemini 호출을 피해 한도 소모 없이 UI 전체 플로우 테스트 가능.
 *        route.ts에서 USE_MOCK 분기로 스위칭. production 빌드에서도 플래그 없으면 영향 없음.
 */
import type { Persona, PersonaId, PersonaResponse, GatekeeperResult } from "./types"

// 각 리뷰어 톤이 얼추 드러나는 정적 응답 세트 — UI 레이아웃 확인용 콘텐츠
const MOCK_RESPONSES: Record<PersonaId, PersonaResponse> = {
  toss: {
    oneliner: "이 가설, 사용자한테 진짜 물어보셨어요?",
    strengths: [
      "메인 액션 버튼이 엄지 도달 영역에 잘 떨어져 있어 전환 경로가 짧습니다.",
      "첫 화면에서 가치 제안이 한 줄로 즉시 전달되는 점이 깔끔합니다.",
    ],
    concerns: [
      "이 플로우의 핵심 가설이 무엇이고 어떤 지표로 검증할지가 명확치 않네요.",
      "사용자가 이 단계에서 왜 이탈하는지에 대한 데이터 근거가 보이지 않습니다.",
      "두 번째 스텝의 제목이 목표 액션을 지시하지 않고 있어 전환에 마찰이 생길 수 있어요.",
    ],
    suggestions: [
      "핵심 지표 1개를 먼저 정하고 이 UI 변화로 얼마나 움직일지 예측해보시죠.",
      "A/B 테스트가 가능한 구성인지 먼저 따져보시는 걸 권합니다.",
      "리텐션까지 이어지는 가설이라면 D+1 retention까지 지표를 세워두시면 좋겠어요.",
    ],
  },
  coupang: {
    oneliner: "구매 전환율에 어떤 영향이 있죠?",
    strengths: [
      "핵심 CTA가 뷰포트 상단에 위치해 스크롤 없이도 주요 액션이 노출됩니다.",
      "가격 정보와 혜택이 한 블록에 묶여 있어 판단 비용이 낮습니다.",
    ],
    concerns: [
      "이 화면에서 기대하는 전환 액션이 1개인지 여러 개인지 우선순위가 모호합니다.",
      "고객이 구매를 망설이게 할 마찰 지점(배송비·재고 등)이 하단에서야 등장합니다.",
    ],
    suggestions: [
      "CTA 문구에 시간·재고 같은 희소성 힌트를 넣어 즉시성을 올려보세요.",
      "이 화면에 도달한 사용자의 CR을 기준선으로 잡고 개선 폭을 %로 목표화하시죠.",
      "단골 고객과 첫 방문자의 시선 분배가 같은지 세그먼트별 지표를 분리해 보세요.",
    ],
  },
  naver: {
    oneliner: "수천만 사용자가 쓴다고 생각해보세요.",
    strengths: [
      "기존 서비스의 디자인 언어와 일관성이 유지되고 있어 낯선 진입 비용이 낮습니다.",
      "본문 텍스트의 대비비가 충분해 저시력 사용자에게도 우호적입니다.",
    ],
    concerns: [
      "모바일 환경이 약한 50대 이상 사용자에게는 탭 영역이 다소 작게 느껴질 수 있습니다.",
      "스크린리더 사용자를 위한 대체 텍스트·라벨이 누락된 요소가 보이는 듯합니다.",
      "다크모드 전환 시 현재 배경 처리가 어떻게 될지 함께 점검이 필요해 보입니다.",
    ],
    suggestions: [
      "터치 타깃을 최소 44×44dp로 맞추는 검토를 먼저 해보셨으면 합니다.",
      "접근성 라벨과 포커스 순서를 QA 체크리스트에 포함시켜 주세요.",
      "저대역폭 환경에서 이미지·폰트 지연 시 레이아웃 쉬프트가 없는지도 확인이 필요합니다.",
    ],
  },
  karrot: {
    oneliner: "옆집 이웃에게 말 거는 느낌이 있어요 :)",
    strengths: [
      "문구 톤이 부담스럽지 않고 말 걸 듯한 결이 살아 있어요.",
      "사진과 텍스트 사이 숨 쉬는 여백이 편안한 리듬을 만듭니다.",
    ],
    concerns: [
      "주요 CTA가 조금 딱딱한 느낌이라, 서비스 분위기와는 미묘하게 틀어지는 것 같아요.",
      "첫 진입에서 '뭘 하면 되나'가 한 박자 늦게 보이는 구간이 있어요.",
    ],
    suggestions: [
      "버튼 카피를 '~해볼까요?' 같은 대화체로 살짝 풀어봐도 좋겠어요 😌",
      "동네 이웃이 처음 쓸 때 불안하지 않게, 첫 화면에 한 줄 안내를 얹어보세요.",
      "이모지·일러스트 한 점 정도로 정서적 거리감을 더 줄일 수 있을 것 같아요.",
    ],
  },
  baemin: {
    oneliner: "어머 이 폰트… 한나체랑 한판 붙여볼래요? ㅎㅎ",
    strengths: [
      "브랜드 색의 한 포인트 사용이 깔끔해요. 너무 욕심내지 않은 게 미덕.",
      "일러스트가 본문을 방해하지 않고 톤앤매너의 일부로 잘 녹아들었어요.",
    ],
    concerns: [
      "타이포 위계가 살짝 애매해서 H1·H2·본문이 한 호흡으로 읽히지 않아요.",
      "여백 리듬이 섹션마다 달라서, 스크롤하다 보면 브랜드 톤이 들쭉날쭉해지네요.",
    ],
    suggestions: [
      "제목 웨이트를 한 단계 더 굵게 가져가서 본문과의 대비를 분명히 해보세요.",
      "한나체·주아체 같은 디스플레이 폰트를 포인트로 한 곳만 써도 일상감이 살 거예요.",
      "마이크로카피에 위트 한 스푼 — 비어있던 자리가 브랜드로 채워집니다.",
    ],
  },
  kakao: {
    oneliner: "사용자가 이 화면에서 어떤 감정을 느끼면 좋을까요?",
    strengths: [
      "전체 흐름이 부드럽고, 각 섹션 간 연결이 급하지 않아요.",
      "친숙한 아이콘과 친근한 문구가 '다음에 뭘 해야 할지'를 자연스럽게 안내합니다.",
    ],
    concerns: [
      "이 결정 포인트에서 사용자가 느끼는 감정이 '안도'인지 '긴장'인지 의도가 뚜렷하지 않네요.",
      "기능과 기능 사이의 관계가 시각적으로 분리돼 있어, 하나의 여정으로 읽히지 않는 순간이 있어요.",
    ],
    suggestions: [
      "감정의 고저를 먼저 스토리보드로 그려보시면 컴포넌트 선택이 쉬워질 거예요.",
      "기능을 개별로 보는 대신 '사용자가 얻는 결과'를 중심으로 묶어보시죠.",
      "마이크로인터랙션 한두 개로 '내 편' 같은 따뜻함을 더할 수 있을 것 같아요.",
    ],
  },
}

// 역할: 게이트키퍼 mock — 실제 체크 대신 약간 대기 후 valid 리턴
// (게이트키퍼 자체는 deprecated. 하위 호환용으로만 보존.)
export async function mockGatekeeper(): Promise<GatekeeperResult> {
  await sleep(1200 + Math.random() * 800)
  return { valid: true, confidence: "high", category: "ui" }
}

// 역할: 6명 리뷰어를 한 JSON(reviewers.{id})으로 합쳐 조각내 스트리밍 (단일 호출 경로 mock)
export async function* mockMergedStream(): AsyncGenerator<string, void, void> {
  const merged = { reviewers: MOCK_RESPONSES }
  const full = JSON.stringify(merged, null, 2)
  await sleep(500 + Math.random() * 1200)
  const CHUNK_MIN = 40
  const CHUNK_MAX = 120
  let i = 0
  while (i < full.length) {
    const size = Math.floor(CHUNK_MIN + Math.random() * (CHUNK_MAX - CHUNK_MIN))
    yield full.slice(i, i + size)
    i += size
    await sleep(50 + Math.random() * 100)
  }
}

// 역할: 페르소나 응답 mock — 최종 JSON을 조각내 SSE 스트리밍처럼 yield
export async function* mockPersonaStream(
  persona: Persona
): AsyncGenerator<string, void, void> {
  const final = MOCK_RESPONSES[persona.id]
  const full = JSON.stringify(final, null, 2)
  // 초기 지연 편차(각 리뷰어가 동시에 응답하지 않는 체감)
  await sleep(500 + Math.random() * 1500)
  const CHUNK_MIN = 30
  const CHUNK_MAX = 80
  let i = 0
  while (i < full.length) {
    const size = Math.floor(CHUNK_MIN + Math.random() * (CHUNK_MAX - CHUNK_MIN))
    const slice = full.slice(i, i + size)
    i += size
    yield slice
    await sleep(60 + Math.random() * 120)
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
