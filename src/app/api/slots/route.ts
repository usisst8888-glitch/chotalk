import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

// 한국 시간 (KST) 헬퍼 함수
function getKoreanTimeDate(): Date {
  const now = new Date();
  return new Date(now.getTime() + (9 * 60 * 60 * 1000));
}

function toKoreanTimeString(date: Date): string {
  // 이미 한국 시간으로 변환된 Date를 ISO 문자열로 변환 (Z 제거)
  return date.toISOString().slice(0, -1);
}

// 슬롯 목록 조회
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    const supabase = getSupabase();

    // 사용자 정보와 슬롯 개수 조회
    const { data: user } = await supabase
      .from('users')
      .select('slot_count')
      .eq('id', payload.userId)
      .single();

    // 슬롯 목록 조회
    const { data: slots, error } = await supabase
      .from('slots')
      .select('*')
      .eq('user_id', payload.userId)
      .order('expires_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: '슬롯 조회 실패' }, { status: 500 });
    }

    return NextResponse.json({
      slots: slots || [],
      slotCount: user?.slot_count || 0,
      usedSlots: slots?.length || 0,
    });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 슬롯 추가
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    const { girlName, shopName, targetRoom } = await request.json();

    if (!girlName || !targetRoom) {
      return NextResponse.json({ error: '모든 필드를 입력해주세요.' }, { status: 400 });
    }

    const supabase = getSupabase();

    // 사용자의 슬롯 개수 확인
    const { data: user } = await supabase
      .from('users')
      .select('slot_count')
      .eq('id', payload.userId)
      .single();

    // 현재 사용 중인 슬롯 개수 확인
    const { count } = await supabase
      .from('slots')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', payload.userId);

    if ((count || 0) >= (user?.slot_count || 0)) {
      return NextResponse.json({ error: '슬롯이 부족합니다. 슬롯을 추가로 구매해주세요.' }, { status: 400 });
    }

    // 새 가게인 경우 이벤트 시간 테이블에 추가
    if (shopName) {
      const { data: existingShop } = await supabase
        .from('event_times')
        .select('id')
        .eq('shop_name', shopName)
        .single();

      if (!existingShop) {
        await supabase
          .from('event_times')
          .insert({
            shop_name: shopName,
          });
      }
    }

    // 14일(2주) 후 만료 (한국 시간 기준) - 무료 슬롯
    const expiresAt = getKoreanTimeDate();
    expiresAt.setDate(expiresAt.getDate() + 14);

    // 활성화된 카카오 초대 ID 목록 가져오기
    const { data: kakaoIds, error: kakaoIdError } = await supabase
      .from('kakao_invite_ids')
      .select('id, kakao_id')
      .eq('is_active', true);

    if (kakaoIdError || !kakaoIds || kakaoIds.length === 0) {
      return NextResponse.json({ error: '사용 가능한 카카오 초대 ID가 없습니다. 관리자에게 문의해주세요.' }, { status: 400 });
    }

    // 각 카카오 ID별 slots 사용 개수 카운트
    const kakaoIdUsage = await Promise.all(
      kakaoIds.map(async (k) => {
        const { count } = await supabase
          .from('slots')
          .select('*', { count: 'exact', head: true })
          .eq('kakao_id', k.kakao_id);
        return { ...k, usageCount: count || 0 };
      })
    );

    // 50개 미만이면서 사용 횟수가 가장 적은 ID 선택
    const availableKakaoId = kakaoIdUsage
      .filter((k) => k.usageCount < 50)
      .sort((a, b) => a.usageCount - b.usageCount)[0];

    if (!availableKakaoId) {
      return NextResponse.json({ error: '모든 카카오 초대 ID가 최대 사용량(50개)에 도달했습니다. 관리자에게 문의해주세요.' }, { status: 400 });
    }

    // 슬롯 생성
    const { data: newSlot, error } = await supabase
      .from('slots')
      .insert({
        user_id: payload.userId,
        girl_name: girlName,
        shop_name: shopName || null,
        target_room: targetRoom,
        kakao_id: availableKakaoId.kakao_id,
        expires_at: toKoreanTimeString(expiresAt),
      })
      .select()
      .single();

    if (error) {
      console.error('Slot creation error:', error);
      return NextResponse.json({ error: '슬롯 생성 실패' }, { status: 500 });
    }

    return NextResponse.json({ message: '슬롯이 생성되었습니다.', slot: newSlot });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
