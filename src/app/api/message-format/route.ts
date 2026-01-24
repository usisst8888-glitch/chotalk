import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';
import { formatMessageBody, formatMessageFooter, calculateTotalTickets } from '@/lib/ticket';

// ============================================================
// 메시지 포맷 생성 (header/body/footer 구조)
// sessions 테이블에서 데이터 조회
// ============================================================

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

    const { slotId, templateData } = await request.json();

    const supabase = getSupabase();

    // 1. 사용자 템플릿 가져오기 (header)
    let headerTemplate = '';
    if (templateData?.template) {
      headerTemplate = templateData.template;
    } else {
      const { data: userTemplate } = await supabase
        .from('user_templates')
        .select('template')
        .eq('user_id', payload.userId)
        .single();

      if (userTemplate) {
        headerTemplate = userTemplate.template;
      }
    }

    // 2. 완료된 세션 가져오기 (sessions 테이블)
    let query = supabase
      .from('sessions')
      .select('*')
      .eq('user_id', payload.userId)
      .eq('is_completed', true)
      .order('start_time', { ascending: true });

    if (slotId) {
      query = query.eq('slot_id', slotId);
    }

    const { data: sessions } = await query;
    const completedSessions = sessions || [];

    // 3. Body 계산 (티켓 합계)
    const ticketSessions = completedSessions.map(s => ({
      halfTickets: Number(s.half_tickets) || 0,
      fullTickets: Number(s.full_tickets) || 0,
    }));
    const totalTickets = calculateTotalTickets(ticketSessions);
    const body = formatMessageBody(totalTickets);

    // 4. Footer 생성 (각 방별 상세 정보)
    const footerSessions = completedSessions.map(s => {
      const startTime = new Date(s.start_time).toLocaleTimeString('ko-KR', {
        hour: '2-digit', minute: '2-digit', hour12: false
      });
      const endTime = s.end_time
        ? new Date(s.end_time).toLocaleTimeString('ko-KR', {
            hour: '2-digit', minute: '2-digit', hour12: false
          })
        : '';

      return {
        roomNumber: s.room_number || '?',
        startTime,
        endTime,
        halfTickets: Number(s.half_tickets) || 0,
        fullTickets: Number(s.full_tickets) || 0,
        hasFare: s.has_fare,
        fareAmount: s.fare_amount,
      };
    });
    const footer = formatMessageFooter(footerSessions);

    // 5. 최종 메시지 구성
    return NextResponse.json({
      header: headerTemplate,
      body: body,
      footer: footer,
      fullMessage: [headerTemplate, body, footer].filter(Boolean).join('\n\n'),
      metadata: {
        totalTickets,
        sessionCount: completedSessions.length,
        sessions: footerSessions,
      },
    });
  } catch (error) {
    console.error('Message format error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// ============================================================
// 실시간 미리보기 (저장 없이)
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionsParam = searchParams.get('sessions');

    if (!sessionsParam) {
      return NextResponse.json({ error: '세션 데이터가 필요합니다.' }, { status: 400 });
    }

    const sessions = JSON.parse(sessionsParam);

    // Body 계산
    const ticketSessions = sessions.map((s: { halfTickets?: number; fullTickets?: number }) => ({
      halfTickets: Number(s.halfTickets) || 0,
      fullTickets: Number(s.fullTickets) || 0,
    }));
    const totalTickets = calculateTotalTickets(ticketSessions);
    const body = formatMessageBody(totalTickets);

    // Footer 생성
    const footerSessions = sessions.map((s: {
      roomNumber: string;
      startTime: string;
      endTime: string;
      halfTickets?: number;
      fullTickets?: number;
      hasFare?: boolean;
      fareAmount?: number;
    }) => ({
      roomNumber: s.roomNumber,
      startTime: s.startTime,
      endTime: s.endTime,
      halfTickets: Number(s.halfTickets) || 0,
      fullTickets: Number(s.fullTickets) || 0,
      hasFare: s.hasFare || false,
      fareAmount: s.fareAmount || 0,
    }));
    const footer = formatMessageFooter(footerSessions);

    return NextResponse.json({
      body,
      footer,
      totalTickets,
      sessionCount: sessions.length,
    });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
