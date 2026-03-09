import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSupabase } from '@/lib/supabase';
import { signToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: '아이디와 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // 사용자 조회
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, password, role, parent_id')
      .eq('username', username)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: '아이디 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // 비밀번호 확인
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: '아이디 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // 총판/본사 로그인 격리 (superadmin은 어디서든 로그인 가능)
    if (user.role !== 'superadmin') {
      const distributorUserId = request.headers.get('x-distributor-user-id');
      if (distributorUserId) {
        // 총판 페이지: 해당 총판 소속 유저 또는 총판 본인만 로그인 가능
        if (user.parent_id !== distributorUserId && user.id !== distributorUserId) {
          return NextResponse.json(
            { error: '이 사이트에서 가입된 계정이 아닙니다.' },
            { status: 403 }
          );
        }
      } else {
        // 본사 페이지: 총판 소속 유저는 로그인 불가 (총판 관리자는 가능)
        if (user.parent_id && user.role !== 'admin') {
          return NextResponse.json(
            { error: '본사 사이트에서는 로그인할 수 없습니다. 가입하신 총판 사이트에서 로그인해주세요.' },
            { status: 403 }
          );
        }
      }
    }

    // JWT 토큰 생성
    const token = signToken({ userId: user.id, username: user.username });

    const response = NextResponse.json({
      message: '로그인되었습니다.',
      user: { id: user.id, username: user.username, role: user.role },
    });

    // 쿠키에 토큰 저장
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
