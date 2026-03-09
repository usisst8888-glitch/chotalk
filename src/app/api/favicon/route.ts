import { NextRequest, NextResponse } from 'next/server';

// 총판별 동적 파비콘 생성 (첫 글자 SVG)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name') || '스';
  const firstChar = name.charAt(0);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#4f46e5"/>
  <text x="32" y="44" font-family="sans-serif" font-size="36" font-weight="bold" fill="white" text-anchor="middle">${firstChar}</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
