import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * 초톡 메시지 저장 API
 * - 가게명 방에서 오는 출근표 메시지를 통째로 저장
 * - 같은 가게의 기존 메시지와 다르면 업데이트 + data_changed = true
 * - 같으면 저장 안함
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { room, sender, message, receivedAt } = body;

    if (!room || !message) {
      return NextResponse.json({
        error: '필수 필드가 누락되었습니다.',
        required: ['room', 'message'],
      }, { status: 400 });
    }

    // 초톡 메시지 패턴 확인: ➖➖ 구분선이 2줄 이상
    const dashLineCount = (message.match(/➖➖/g) || []).length;
    if (dashLineCount < 2) {
      return NextResponse.json({
        success: true,
        stored: false,
        reason: '초톡 패턴 불일치 (구분선 2개 미만)',
      });
    }

    const shopName = room.trim();
    const supabase = getSupabase();

    // 기존 데이터 조회
    const { data: existing, error: selectError } = await supabase
      .from('aktalk_chotok')
      .select('id, message')
      .eq('shop_name', shopName)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (selectError) {
      console.error('aktalk_chotok select error:', selectError);
      return NextResponse.json({ error: 'DB 조회 실패', detail: selectError.message }, { status: 500 });
    }

    // 기존 메시지와 동일하면 저장 안함
    if (existing && existing.message === message) {
      return NextResponse.json({
        success: true,
        stored: false,
        reason: '기존 메시지와 동일',
      });
    }

    if (existing) {
      // 다르면 업데이트 + data_changed = true
      const { error: updateError } = await supabase
        .from('aktalk_chotok')
        .update({
          message,
          sender: sender || null,
          data_changed: true,
          updated_at: new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').replace('Z', ''),
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('aktalk_chotok update error:', updateError);
        return NextResponse.json({ error: 'DB 업데이트 실패', detail: updateError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        stored: true,
        action: 'updated',
        data_changed: true,
      });
    } else {
      // 신규 INSERT
      const { data, error: insertError } = await supabase
        .from('aktalk_chotok')
        .insert({
          shop_name: shopName,
          room_name: room,
          sender: sender || null,
          message,
          data_changed: true,
          received_at: receivedAt || new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').replace('Z', ''),
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('aktalk_chotok insert error:', insertError);
        return NextResponse.json({ error: 'DB 저장 실패', detail: insertError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        stored: true,
        action: 'inserted',
        id: data.id,
        data_changed: true,
      });
    }

  } catch (error) {
    console.error('aktalk chotok message error:', error);
    return NextResponse.json({
      error: '서버 오류',
      detail: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
