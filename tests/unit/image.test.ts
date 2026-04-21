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
