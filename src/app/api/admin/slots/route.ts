import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { checkAdminOrSuperAdmin } from '@/lib/auth';

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
    const authUser = await checkAdminOrSuperAdmin(request);
    if (!authUser) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const supabase = getSupabase();

    let query = supabase
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
          username,
          nickname,
          parent_id
        )
      `)
      .order('expires_at', { ascending: true });

    // admin(총판): 자기 자신 + 자기 유저 슬롯만 필터
    if (authUser.role === 'admin') {
      const { data: assignedUsers } = await supabase
        .from('users')
        .select('id')
        .eq('parent_id', authUser.id);

      const assignedUserIds = (assignedUsers || []).map(u => u.id);
      // 총판 자기 자신도 포함
      assignedUserIds.push(authUser.id);
      query = query.in('user_id', assignedUserIds);
    }

    const { data: slots, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // superadmin: 총판 이름 매핑용
    let distributorMap: Record<string, string> = {};
    if (authUser.role === 'superadmin') {
      const { data: admins } = await supabase
        .from('users')
        .select('id, username, nickname')
        .eq('role', 'admin');
      if (admins) {
        for (const a of admins) {
          distributorMap[a.id] = a.nickname || a.username;
        }
      }
    }

    // users 객체를 평탄화
    const formattedSlots = slots?.map(slot => {
      const userInfo = slot.users as unknown as { username: string; nickname: string | null; parent_id: string | null } | null;
      const parentId = userInfo?.parent_id || null;
      return {
        ...slot,
        username: userInfo?.nickname || userInfo?.username || '알 수 없음',
        distributor_name: parentId ? (distributorMap[parentId] || '총판') : '본사',
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
    const authUser = await checkAdminOrSuperAdmin(request);
    if (!authUser) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const { userId, girlName, shopName } = await request.json();

    if (!userId || !girlName) {
      return NextResponse.json({ error: '유저와 아가씨 닉네임을 입력해주세요.' }, { status: 400 });
    }

    const supabase = getSupabase();

    // admin(총판): 자기 유저에게만 추가 가능
    if (authUser.role === 'admin') {
      const { data: targetUser } = await supabase
        .from('users')
        .select('parent_id')
        .eq('id', userId)
        .single();

      if (!targetUser || targetUser.parent_id !== authUser.id) {
        return NextResponse.json({ error: '해당 회원에 대한 권한이 없습니다.' }, { status: 403 });
      }
    }

    // 같은 가게+아가씨 이름 중복 체크
    let dupQuery = supabase
      .from('slots')
      .select('id', { count: 'exact', head: true })
      .eq('girl_name', girlName);
    if (shopName) {
      dupQuery = dupQuery.eq('shop_name', shopName);
    } else {
      dupQuery = dupQuery.is('shop_name', null);
    }
    const { count: dupCount } = await dupQuery;
    if ((dupCount || 0) > 0) {
      return NextResponse.json({ error: '같은 가게에 동일한 아가씨 이름이 이미 등록되어 있습니다.' }, { status: 400 });
    }

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

    // 3일 만료
    const expiresAt = getKoreanTimeDate();
    expiresAt.setDate(expiresAt.getDate() + 3);

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
        const { count: conflictCount } = await supabase
          .from('slots')
          .select('*', { count: 'exact', head: true })
          .eq('kakao_id', k.kakao_id)
          .eq('target_room', girlName);
        return { ...k, usageCount: count || 0, hasConflict: (conflictCount || 0) > 0 };
      })
    );

    const available = kakaoIdUsage
      .filter(k => !k.hasConflict)
      .sort((a, b) => a.usageCount - b.usageCount);

    const availableKakaoId = available.length > 0 ? available[0] : null;

    const { data: newSlot, error } = await supabase
      .from('slots')
      .insert({
        user_id: userId,
        girl_name: girlName,
        shop_name: shopName || null,
        target_room: girlName,
        kakao_id: availableKakaoId?.kakao_id || null,
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
