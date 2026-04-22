/**
 * Role: 클라이언트 사이드 SHA-256 해시 (base64url) — 캐시 키 산출용
 * Key Features: sha256Base64Url(text) — Web Crypto SubtleCrypto 기반
 * Dependencies: 브라우저 crypto.subtle (HTTPS 또는 localhost 필요)
 * Notes: 서버 환경에서는 쓰지 않음(Web Crypto SubtleCrypto는 Node 18+에서도 조건부). client-only.
 */

// Web Crypto가 없는 환경(Node 테스트 등)에서는 FNV-1a 64-bit fallback — 해시 충돌 가능성은 있으나
// 캐시 키 용도라 치명적이지 않고, 실제 런타임은 브라우저라 이 fallback은 안전망용.
async function sha256Hex(text: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const bytes = new TextEncoder().encode(text)
    const hashBuffer = await crypto.subtle.digest("SHA-256", bytes)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  }
  // fallback — SubtleCrypto 불가 환경에선 간단한 FNV-1a로 대체 키 산출
  return fnv1a64(text)
}

function fnv1a64(str: string): string {
  // 64-bit FNV-1a를 32-bit 2개 레인으로 나눠 계산 후 연결 (JS 안전 정수 한계 회피)
  let h1 = 0x811c9dc5
  let h2 = 0xcbf29ce4
  for (let i = 0; i < str.length; i++) {
    h1 ^= str.charCodeAt(i)
    h1 = Math.imul(h1, 0x01000193)
    h2 ^= str.charCodeAt(i)
    h2 = Math.imul(h2, 0x00193000) // 다른 prime 조합으로 충돌 감소
  }
  const toHex = (n: number) => (n >>> 0).toString(16).padStart(8, "0")
  return toHex(h1) + toHex(h2)
}

function hexToBase64Url(hex: string): string {
  // hex → bytes → base64 → base64url (- / 제거)
  const bytes: number[] = []
  for (let i = 0; i < hex.length; i += 2) bytes.push(parseInt(hex.substr(i, 2), 16))
  const bin = String.fromCharCode(...bytes)
  const b64 = typeof btoa !== "undefined" ? btoa(bin) : Buffer.from(bin, "binary").toString("base64")
  return b64.replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_")
}

// 역할: 입력 문자열의 SHA-256 해시를 base64url로 반환
export async function sha256Base64Url(text: string): Promise<string> {
  const hex = await sha256Hex(text)
  return hexToBase64Url(hex)
}
