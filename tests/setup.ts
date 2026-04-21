// tests/setup.ts
import "@testing-library/jest-dom/vitest"
import { afterEach } from "vitest"
import { cleanup } from "@testing-library/react"

// jsdom 29 + Node 25 조합에서 window.localStorage / sessionStorage가
// 메서드 없는 빈 객체로 노출되는 호환성 이슈가 있어, 단순 in-memory Storage로 교체.
class MemoryStorage implements Storage {
  private store = new Map<string, string>()
  get length(): number {
    return this.store.size
  }
  clear(): void {
    this.store.clear()
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null
  }
  removeItem(key: string): void {
    this.store.delete(key)
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value))
  }
}

function installStorage(name: "localStorage" | "sessionStorage") {
  const storage = new MemoryStorage()
  Object.defineProperty(window, name, { value: storage, writable: true, configurable: true })
  Object.defineProperty(globalThis, name, { value: storage, writable: true, configurable: true })
}

installStorage("localStorage")
installStorage("sessionStorage")

afterEach(() => {
  cleanup()
})
