/**
 * Role: 이미지 파일 검증 및 리사이즈 유틸리티
 * Key Features: validateImageFile (포맷/크기 검증), resizeImage (canvas 기반 축소 + base64 변환)
 * Dependencies: 브라우저 createImageBitmap / canvas API (resizeImage는 브라우저 환경 전용)
 * Notes: jsdom에서는 canvas/createImageBitmap이 부분만 지원됨 — resize는 E2E에서 검증
 */

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
export const MIN_DIMENSION = 200
// 1024px 상한 — Gemini 입력 토큰 절반 수준으로 감소 + 스트리밍 지연 단축
export const MAX_DIMENSION = 1024
export const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"] as const

export class ImageValidationError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message)
    this.name = "ImageValidationError"
  }
}

// 업로드된 파일이 허용 포맷/크기인지 검증 (실패 시 ImageValidationError throw)
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
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new ImageValidationError(
      "이미지 파일이 손상됐어요. 다른 파일로 시도해 주세요.",
      "CORRUPT"
    )
  }
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
