import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSupabase } from '@/lib/supabase';
import { signToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const { password, username } = await request.json();

    if (!password || !username) {
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요.' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // 아이디 중복 확인
    const { data: existingUsername } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (existingUsername) {
      return NextResponse.json(
        { error: '이미 사용 중인 아이디입니다.' },
        { status: 400 }
      );
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        password: hashedPassword,
        username,
      })
      .select('id, username')
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: '회원가입에 실패했습니다: ' + error.message },
        { status: 500 }
      );
    }

    // JWT 토큰 생성
    const token = signToken({ userId: newUser.id, username: newUser.username });

    const response = NextResponse.json({
      message: '회원가입이 완료되었습니다.',
      user: { id: newUser.id, username: newUser.username },
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
  } catch (err) {
    console.error('Signup error:', err);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
