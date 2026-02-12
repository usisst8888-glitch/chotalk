import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { extractRoomNumber, parseTransfer } from '@/lib/message-parser';
import { getOrCreateRoom, getKoreanTime } from '@/app/api/bot/handlers/shared';

// ============================================================
// 방(Room) 관리 API - status_board와 완전히 독립
// source_room(카카오톡 방 이름) = shop_name
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { room, message, receivedAt } = body;

    if (!room || !message) {
      return NextResponse.json({
        error: '필수 필드가 누락되었습니다.',
        required: ['room', 'message']
      }, { status: 400 });
    }

    const supabase = getSupabase();
    const messageReceivedAt = receivedAt || getKoreanTime();

    // room(source_room) = shop_name
    const shopName = room;

    const lines = message.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);

    // 1. 모든 방번호 추출 → rooms 테이블에 생성
    const createdRooms: string[] = [];
    const allRoomNumbers = new Set<string>();

    for (const line of lines) {
      const roomNum = extractRoomNumber(line);
      if (roomNum) {
        allRoomNumbers.add(roomNum);
      }
    }

    for (const roomNum of allRoomNumbers) {
      const result = await getOrCreateRoom(supabase, roomNum, shopName, messageReceivedAt);
      if (result.isNewRoom) {
        createdRooms.push(roomNum);
      }
    }

    // 2. ㅌㄹㅅ(방이동) 감지 → rooms 테이블에 새 방 생성
    const transfers: { fromRoom: string; toRoom: string }[] = [];
    for (const line of lines) {
      const transfer = parseTransfer(line);
      if (transfer) {
        await getOrCreateRoom(supabase, transfer.toRoom, shopName, messageReceivedAt);
        transfers.push(transfer);
      }
    }

    console.log('Room API - shopName:', shopName, 'rooms:', [...allRoomNumbers], 'created:', createdRooms, 'transfers:', transfers);

    return NextResponse.json({
      success: true,
      shopName,
      rooms: [...allRoomNumbers],
      createdRooms,
      transfers,
    });

  } catch (error) {
    console.error('Room API error:', error);
    return NextResponse.json({
      error: '서버 오류',
      detail: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
