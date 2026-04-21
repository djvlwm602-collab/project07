/**
 * Role: 이미지 업로드 + 맥락 입력 UI (Apple 스타일, 중앙 정렬)
 * Key Features: drag-and-drop, file validation, image resize preview, context textarea (max 200), Apple Blue primary CTA
 * Dependencies: lib/image (resizeImage, validateImageFile, ImageValidationError)
 * Notes: 클라이언트 컴포넌트. 라이트 그레이 배경 위에서 화이트 카드처럼 보이도록 구성.
 */
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

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const submit = () => {
    if (!dataUrl) return
    onSubmit({ dataUrl, context: context.trim() })
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-16 md:py-20">
      <div className="text-center mb-10">
        <h1 className="text-[28px] md:text-[32px] font-semibold leading-apple-section tracking-[-0.003em] text-apple-text mb-2">
          디자인을 올려주세요
        </h1>
        <p className="text-[14px] text-apple-text/55">
          PNG · JPG · WebP · 최대 5MB
        </p>
      </div>

      <label
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`block rounded-apple-lg border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-apple-blue bg-white"
            : "border-apple-text/15 bg-white hover:border-apple-text/25"
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
            <img src={previewUrl} alt="" className="max-h-64 mx-auto mb-4 rounded-apple" />
            <p className="text-[13px] text-apple-text/55">다른 파일 선택</p>
          </div>
        ) : (
          <div className="py-10">
            <p className="text-[15px] text-apple-text/80 mb-1">
              파일을 끌어다 놓거나 클릭하세요
            </p>
            <p className="text-[12px] text-apple-text/45">
              PNG · JPG · WebP · 최대 5MB
            </p>
          </div>
        )}
      </label>

      {error && (
        <p className="text-[13px] mt-3 text-center" style={{ color: "#fb1d1d" }}>
          {error}
        </p>
      )}

      <label className="block mt-6">
        <span className="text-[13px] text-apple-text/80 mb-2 block">맥락 (선택)</span>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value.slice(0, 200))}
          placeholder="예: 무신사 신규 가입 플로우의 약관 동의 화면"
          rows={2}
          className="w-full rounded-apple border border-apple-text/15 px-3 py-2.5 text-[15px] bg-white focus:outline-none focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/20 transition"
          disabled={disabled}
        />
        <p className="text-[11px] text-apple-text/40 mt-1 text-right">
          {context.length}/200
        </p>
      </label>

      <button
        onClick={submit}
        disabled={!dataUrl || disabled}
        className="w-full mt-6 py-3 bg-apple-blue text-white text-[17px] font-normal rounded-apple disabled:bg-apple-text/15 disabled:cursor-not-allowed hover:brightness-110 transition"
      >
        크리틱 받기
      </button>
    </div>
  )
}
