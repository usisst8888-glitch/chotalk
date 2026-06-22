import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * 초톡 담당자 매핑 저장 API
 * - StarTalk 안드로이드가 초톡 메시지를 라인 파싱해서 보낸다.
 * - shop_name(방 이름) 단위로 매번 전체 덮어쓰기 (현재 스냅샷).
 * - payload: { shopName, managers: [{ roomNumber, managerName }], receivedAt? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopName, room, managers } = body as {
      shopName?: string;
      room?: string;
      managers?: Array<{ roomNumber?: string; managerName?: string }>;
    };

    const shop = (shopName ?? room ?? '').trim();
    if (!shop) {
      return NextResponse.json({ error: 'shopName(또는 room)이 필요합니다.' }, { status: 400 });
    }
    if (!Array.isArray(managers)) {
      return NextResponse.json({ error: 'managers 배열이 필요합니다.' }, { status: 400 });
    }

    const cleaned = managers
      .map((m) => ({
        roomNumber: (m.roomNumber ?? '').trim(),
        managerName: (m.managerName ?? '').trim(),
      }))
      .filter((m) => m.roomNumber && m.managerName);

    const supabase = getSupabase();

    // 1) 해당 가게 기존 데이터 전체 삭제
    const { error: deleteError } = await supabase
      .from('aktalk_chotok_managers')
      .delete()
      .eq('shop_name', shop);

    if (deleteError) {
      console.error('aktalk_chotok_managers delete error:', deleteError);
      return NextResponse.json({ error: 'DB 삭제 실패', detail: deleteError.message }, { status: 500 });
    }

    if (cleaned.length === 0) {
      return NextResponse.json({ success: true, stored: true, count: 0, action: 'cleared' });
    }

    // 2) 새 스냅샷 일괄 insert
    const nowKst = new Date(Date.now() + 9 * 60 * 60 * 1000)
      .toISOString()
      .replace('T', ' ')
      .replace('Z', '');

    const rows = cleaned.map((m) => ({
      shop_name: shop,
      room_number: m.roomNumber,
      manager_name: m.managerName,
      updated_at: nowKst,
    }));

    const { error: insertError } = await supabase
      .from('aktalk_chotok_managers')
      .insert(rows);

    if (insertError) {
      console.error('aktalk_chotok_managers insert error:', insertError);
      return NextResponse.json({ error: 'DB 저장 실패', detail: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      stored: true,
      count: rows.length,
      action: 'replaced',
    });
  } catch (error) {
    console.error('aktalk chotok managers error:', error);
    return NextResponse.json({
      error: '서버 오류',
      detail: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
