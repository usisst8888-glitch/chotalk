import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { parseWaiterMessage, parseTransferMessage } from '../../waiter-parser';

const kstNow = () =>
  new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('Z', '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { room, sender, message } = body;

    if (!room || !sender || !message) {
      return NextResponse.json({
        error: '필수 필드가 누락되었습니다.',
        required: ['room', 'sender', 'message'],
      }, { status: 400 });
    }

    const shopName = room;
    const supabase = getSupabase();

    // 1. 일반 웨이터 배정 파싱 및 저장
    const assignments = parseWaiterMessage(message);
    for (const a of assignments) {
      const { error } = await supabase
        .from('waiter_assignments')
        .upsert(
          {
            shop_name: shopName,
            room_number: a.roomNumber,
            waiter_name: a.waiterName,
            updated_at: kstNow(),
          },
          { onConflict: 'shop_name,room_number' }
        );
      if (error) {
        console.error('waiter_assignments upsert error:', error);
      }
    }

    // 2. ㅌㄹㅅ(이동) 파싱 및 처리
    const transfers = parseTransferMessage(message);
    for (const t of transfers) {
      if (t.waiterName) {
        // 웨이터 이름 있음: toRoom에 upsert (있으면 업데이트, 없으면 신규 등록)
        const { error } = await supabase
          .from('waiter_assignments')
          .upsert(
            {
              shop_name: shopName,
              room_number: t.toRoom,
              waiter_name: t.waiterName,
              updated_at: kstNow(),
            },
            { onConflict: 'shop_name,room_number' }
          );
        if (error) {
          console.error('transfer upsert error:', error);
        }
      } else {
        // 웨이터 이름 없음: fromRoom의 웨이터를 조회해서 toRoom에 upsert
        const { data: fromData } = await supabase
          .from('waiter_assignments')
          .select('waiter_name')
          .eq('shop_name', shopName)
          .eq('room_number', t.fromRoom)
          .single();

        if (fromData?.waiter_name) {
          const { error } = await supabase
            .from('waiter_assignments')
            .upsert(
              {
                shop_name: shopName,
                room_number: t.toRoom,
                waiter_name: fromData.waiter_name,
                updated_at: kstNow(),
              },
              { onConflict: 'shop_name,room_number' }
            );
          if (error) {
            console.error('transfer upsert error:', error);
          }
        }
      }
    }

    const totalCount = assignments.length + transfers.length;

    if (totalCount === 0) {
      return NextResponse.json({ success: true, stored: false, reason: '파싱 결과 없음' });
    }

    console.log(`웨이터 배정 ${assignments.length}건, ㅌㄹㅅ ${transfers.length}건 처리:`, shopName);

    return NextResponse.json({
      success: true,
      stored: true,
      assignments: { count: assignments.length, data: assignments },
      transfers: { count: transfers.length, data: transfers },
    });

  } catch (error) {
    console.error('waiter message error:', error);
    return NextResponse.json({
      error: '서버 오류',
      detail: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
