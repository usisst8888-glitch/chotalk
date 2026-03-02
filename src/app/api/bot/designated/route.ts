import { NextRequest, NextResponse } from 'next/server';
import { getShop } from '../shops';
import { getKoreanTime } from '../_core/shared';

// ============================================================
// ㅈ.ㅁ(지명) 섹션 처리 엔드포인트
// 게시판 메시지의 ➖➖ㅈ.ㅁ➖➖ 구분선 아래 아가씨 목록을 파싱하여 DB 저장
// ============================================================

// POST 핸들러 (직접 호출용)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { room, sender, message, receivedAt } = body;

    if (!room || !sender || !message) {
      return NextResponse.json({
        error: '필수 필드가 누락되었습니다.',
        required: ['room', 'sender', 'message']
      }, { status: 400 });
    }

    const shop = getShop(room);
    const messageReceivedAt = receivedAt || getKoreanTime();
    const result = await shop.processDesignatedSection(room, sender, message, messageReceivedAt);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('ㅈ.ㅁ endpoint error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
