import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { ROOM_TYPE_TABLE, VALID_ROOM_TYPES } from '../config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { room, sender, message, receivedAt } = body;

    // 필수 필드 검증
    if (!room || !sender || !message) {
      return NextResponse.json({
        error: '필수 필드가 누락되었습니다.',
        required: ['room', 'sender', 'message'],
      }, { status: 400 });
    }

    // 방이름 파싱: {가게명}-{팀명}-아톡 또는 {가게명}-공지방 등
    const roomType = VALID_ROOM_TYPES.find(type => room.endsWith(`-${type}`));
    if (!roomType) {
      return NextResponse.json({
        error: `유효하지 않은 방 종류입니다. (${VALID_ROOM_TYPES.join(', ')})`,
      }, { status: 400 });
    }

    const tableName = ROOM_TYPE_TABLE[roomType];
    const prefix = room.slice(0, room.lastIndexOf(`-${roomType}`));
    let shopName: string;
    let teamName: string | null = null;

    if (roomType === '아톡') {
      // 아톡: {가게명}-{팀명}-아톡
      const lastDash = prefix.lastIndexOf('-');
      if (lastDash > 0) {
        shopName = prefix.slice(0, lastDash);
        teamName = prefix.slice(lastDash + 1);
      } else {
        shopName = prefix;
      }
    } else {
      shopName = prefix;
    }

    if (!shopName) {
      return NextResponse.json({ error: '가게명을 파싱할 수 없습니다.' }, { status: 400 });
    }

    const supabase = getSupabase();

    // 아톡: 3자리 방번호+텍스트 패턴만 저장 (예: "301 홍길동 1.5시간")
    if (roomType === '아톡') {
      if (!/^\d{3}\s*.+/.test(message.trim())) {
        return NextResponse.json({ success: true, stored: false, reason: '방번호+텍스트 패턴 불일치' });
      }
    }

    // 테이블별 INSERT 데이터 구성
    const insertData: Record<string, unknown> = {
      shop_name: shopName,
      room_name: room,
      sender,
      message,
      received_at: receivedAt || new Date().toISOString(),
    };

    // 아톡만 team_name 포함
    if (roomType === '아톡') {
      insertData.team_name = teamName;
    }

    const { data, error } = await supabase
      .from(tableName)
      .insert(insertData)
      .select('id')
      .single();

    if (error) {
      console.error(`${tableName} insert error:`, error);
      return NextResponse.json({ error: 'DB 저장 실패', detail: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      id: data.id,
    });

  } catch (error) {
    console.error('aktalk message error:', error);
    return NextResponse.json({
      error: '서버 오류',
      detail: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
