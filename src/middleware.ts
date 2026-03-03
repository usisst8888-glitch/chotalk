import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || '';

  // 카카오톡 크롤러 차단 → 빈 페이지 리턴 (미리보기 안 나옴)
  if (userAgent.includes('kakaotalk-scrap') || userAgent.includes('Yeti/')) {
    return new NextResponse('<html><head></head><body></body></html>', {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico|robots.txt).*)',
};
