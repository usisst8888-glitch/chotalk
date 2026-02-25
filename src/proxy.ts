import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 메인 도메인 (총판이 아닌 기본 도메인)
const MAIN_DOMAINS = ['localhost', '127.0.0.1', 'chotalk.com', 'www.chotalk.com'];

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host')?.split(':')[0] || '';

  // 총판 도메인 감지 및 헤더 설정
  let distributorHeaders: Headers | null = null;
  if (!MAIN_DOMAINS.some(d => host === d || host.endsWith('.vercel.app'))) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: distributor } = await supabase
          .from('distributors')
          .select('id, user_id')
          .eq('domain', host)
          .eq('is_active', true)
          .single();

        if (distributor) {
          distributorHeaders = new Headers(request.headers);
          distributorHeaders.set('x-distributor-id', distributor.id);
          distributorHeaders.set('x-distributor-user-id', distributor.user_id);
        }
      }
    } catch {
      // DB 조회 실패 시 그냥 패스
    }
  }

  const nextWithHeaders = () => {
    if (distributorHeaders) {
      return NextResponse.next({ request: { headers: distributorHeaders } });
    }
    return NextResponse.next();
  };

  // 로그인/회원가입 페이지는 토큰이 있으면 대시보드로 리다이렉트
  if (pathname === '/login' || pathname === '/signup') {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return nextWithHeaders();
  }

  // 메인 페이지는 토큰이 있으면 대시보드로 리다이렉트, 없으면 랜딩페이지 표시
  if (pathname === '/') {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return nextWithHeaders();
  }

  // 대시보드는 토큰이 없으면 로그인으로 리다이렉트
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return nextWithHeaders();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
