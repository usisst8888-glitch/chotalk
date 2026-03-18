import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';
import { parseGongjiMessage } from '../../aktalk/gongji-parser';

// GET: 전체 라인업 조회
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user || user.role !== 'superadmin') {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 });
  }

  const supabase = getSupabase();
  const { searchParams } = new URL(request.url);
  const shopName = searchParams.get('shop_name');

  let query = supabase
    .from('aktalk_gongji')
    .select('*')
    .order('part', { ascending: true })
    .order('floor', { ascending: false });

  if (shopName) {
    query = query.eq('shop_name', shopName);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 가게 목록도 함께 반환
  const { data: shops } = await supabase
    .from('aktalk_gongji')
    .select('shop_name')
    .order('shop_name');

  const uniqueShops = [...new Set((shops || []).map(s => s.shop_name))];

  return NextResponse.json({ assignments: data || [], shops: uniqueShops });
}

// PUT: 개별 항목 수정
export async function PUT(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user || user.role !== 'superadmin') {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 });
  }

  const body = await request.json();
  const { id, floor, name, phone, part } = body;

  if (!id) {
    return NextResponse.json({ error: 'id 필수' }, { status: 400 });
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from('aktalk_gongji')
    .update({ floor, name, phone, part })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// POST: 텍스트 일괄 입력 (공지방 형식 파싱)
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user || user.role !== 'superadmin') {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 });
  }

  const body = await request.json();
  const { shopName, text } = body;

  if (!shopName || !text) {
    return NextResponse.json({ error: 'shopName, text 필수' }, { status: 400 });
  }

  const assignments = parseGongjiMessage(text);

  if (assignments.length === 0) {
    return NextResponse.json({ error: '파싱 결과 없음. 형식을 확인하세요.' }, { status: 400 });
  }

  const supabase = getSupabase();

  // part별로만 삭제 (1부면 1부만, 2부면 2부만)
  const partsInMessage = [...new Set(assignments.map(a => a.part))];
  for (const part of partsInMessage) {
    await supabase
      .from('aktalk_gongji')
      .delete()
      .eq('shop_name', shopName)
      .eq('part', part);
  }

  // INSERT
  const insertRows = assignments.map(a => ({
    shop_name: shopName,
    floor: a.floor,
    name: a.name,
    phone: a.phone,
    part: a.part,
  }));

  const { error } = await supabase
    .from('aktalk_gongji')
    .insert(insertRows);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, count: assignments.length, assignments });
}

// DELETE: 개별 항목 삭제
export async function DELETE(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user || user.role !== 'superadmin') {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id 필수' }, { status: 400 });
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from('aktalk_gongji')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
