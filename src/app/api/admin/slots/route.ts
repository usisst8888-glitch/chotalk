import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';

// 관리자 권한 확인 헬퍼
async function checkAdmin(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const supabase = getSupabase();
  const { data: user } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', payload.userId)
    .single();

  if (!user || user.role !== 'admin') return null;
  return user;
}

function getKoreanTimeDate(): Date {
  const now = new Date();
  return new Date(now.getTime() + (9 * 60 * 60 * 1000));
}

function toKoreanTimeString(date: Date): string {
  return date.toISOString().slice(0, -1);
}

// 전체 슬롯 조회 (만료일 오름차순)
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const supabase = getSupabase();

    // 슬롯과 함께 유저 정보도 가져옴
    const { data: slots, error } = await supabase
      .from('slots')
      .select(`
        id,
        girl_name,
        shop_name,
        target_room,
        kakao_id,
        is_active,
        expires_at,
        created_at,
        user_id,
        users:user_id (
          username
        )
      `)
      .order('expires_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // users 객체를 평탄화
    const formattedSlots = slots?.map(slot => {
      const userInfo = slot.users as unknown as { username: string } | null;
      return {
        ...slot,
        username: userInfo?.username || '알 수 없음',
        users: undefined
      };
    });

    return NextResponse.json({ slots: formattedSlots });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 관리자용 슬롯 추가 (유저 선택 가능)
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const { userId, girlName, shopName } = await request.json();

    if (!userId || !girlName) {
      return NextResponse.json({ error: '유저와 아가씨 닉네임을 입력해주세요.' }, { status: 400 });
    }

    const supabase = getSupabase();

    // 새 가게인 경우 이벤트 시간 테이블에 추가
    if (shopName) {
      const { data: existingShop } = await supabase
        .from('event_times')
        .select('id')
        .eq('shop_name', shopName)
        .single();

      if (!existingShop) {
        await supabase.from('event_times').insert({ shop_name: shopName });
      }
    }

    // 7일 만료
    const expiresAt = getKoreanTimeDate();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 카카오 초대 ID 자동 배정 (사용량 가장 적은 것)
    const { data: kakaoIds } = await supabase
      .from('kakao_invite_ids')
      .select('id, kakao_id')
      .eq('is_active', true);

    if (!kakaoIds || kakaoIds.length === 0) {
      return NextResponse.json({ error: '사용 가능한 카카오 초대 ID가 없습니다.' }, { status: 400 });
    }

    const kakaoIdUsage = await Promise.all(
      kakaoIds.map(async (k) => {
        const { count } = await supabase
          .from('slots')
          .select('*', { count: 'exact', head: true })
          .eq('kakao_id', k.kakao_id);
        return { ...k, usageCount: count || 0 };
      })
    );

    const availableKakaoId = kakaoIdUsage
      .filter((k) => k.usageCount < 50)
      .sort((a, b) => a.usageCount - b.usageCount)[0];

    if (!availableKakaoId) {
      return NextResponse.json({ error: '모든 카카오 초대 ID가 최대 사용량에 도달했습니다.' }, { status: 400 });
    }

    const { data: newSlot, error } = await supabase
      .from('slots')
      .insert({
        user_id: userId,
        girl_name: girlName,
        shop_name: shopName || null,
        target_room: girlName,
        kakao_id: availableKakaoId.kakao_id,
        expires_at: toKoreanTimeString(expiresAt),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: '슬롯 생성 실패' }, { status: 500 });
    }

    return NextResponse.json({ message: '슬롯이 생성되었습니다.', slot: newSlot });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
