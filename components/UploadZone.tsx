/**
 * Role: 이미지 업로드 + 맥락 입력 UI. 드래그앤드롭/파일선택/검증/리사이즈/제출 처리
 * Key Features: drag-and-drop, file validation, image resize preview, context textarea (max 200), submit
 * Dependencies: lib/image (resizeImage, validateImageFile, ImageValidationError)
 * Notes: 클라이언트 컴포넌트 — state와 drag 이벤트 핸들러 사용. T19 크리틱 페이지에서 사용됨
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
