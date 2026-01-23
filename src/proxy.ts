import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // 로그인/회원가입 페이지는 토큰이 있으면 대시보드로 리다이렉트
  if (pathname === '/login' || pathname === '/signup') {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // 메인 페이지는 토큰이 있으면 대시보드로 리다이렉트, 없으면 랜딩페이지 표시
  if (pathname === '/') {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // 대시보드는 토큰이 없으면 로그인으로 리다이렉트
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/signup', '/dashboard/:path*'],
};
