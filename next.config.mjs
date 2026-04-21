/** @type {import('next').NextConfig} */
// iCloud Desktop 동기화가 .next 디렉토리 파일들과 race condition을 일으켜 CSS/JS 404 및 build hang 발생.
// Vercel 서버에서는 VERCEL env가 설정되므로 기본 .next 사용. 로컬에서만 iCloud 바깥(/tmp)로 빼서 충돌 회피.
const nextConfig = {
  distDir: process.env.VERCEL ? ".next" : "/tmp/critic6-next",
};

export default nextConfig;
