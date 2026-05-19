import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { checkSuperAdmin } from '@/lib/auth';

interface RoomSummary {
  room_name: string;
  shop_name: string | null;
  team_name: string | null;
  sent_count: number;
  unsent_count: number;
  total: number;
  latest_received_at: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await checkSuperAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const supabase = getSupabase();
    const summaryMap = new Map<string, RoomSummary>();

    const pageSize = 1000;
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from('aktalk_atok')
        .select('room_name, shop_name, team_name, is_sent, received_at')
        .order('received_at', { ascending: false })
        .range(from, from + pageSize - 1);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      if (!data || data.length === 0) break;

      for (const row of data) {
        const key = row.room_name;
        let entry = summaryMap.get(key);
        if (!entry) {
          entry = {
            room_name: row.room_name,
            shop_name: row.shop_name ?? null,
            team_name: row.team_name ?? null,
            sent_count: 0,
            unsent_count: 0,
            total: 0,
            latest_received_at: row.received_at ?? null,
          };
          summaryMap.set(key, entry);
        }
        entry.total += 1;
        if (row.is_sent) entry.sent_count += 1;
        else entry.unsent_count += 1;
        if (row.received_at && (!entry.latest_received_at || row.received_at > entry.latest_received_at)) {
          entry.latest_received_at = row.received_at;
        }
      }

      if (data.length < pageSize) break;
      from += pageSize;
    }

    const rooms = Array.from(summaryMap.values()).sort((a, b) => {
      const at = a.latest_received_at ?? '';
      const bt = b.latest_received_at ?? '';
      return bt.localeCompare(at);
    });

    return NextResponse.json({ rooms });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await checkSuperAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const roomName = searchParams.get('room_name')?.trim();
    if (!roomName) {
      return NextResponse.json({ error: 'room_name이 필요합니다.' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('aktalk_atok')
      .delete()
      .eq('room_name', roomName)
      .select('id');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deleted: data?.length ?? 0 });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await checkSuperAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const body = await request.json();
    const roomName = typeof body?.room_name === 'string' ? body.room_name.trim() : '';
    if (!roomName) {
      return NextResponse.json({ error: 'room_name이 필요합니다.' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('aktalk_atok')
      .update({ is_sent: true })
      .eq('room_name', roomName)
      .eq('is_sent', false)
      .select('id');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, updated: data?.length ?? 0 });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
