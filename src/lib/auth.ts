import { NextRequest } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';

export type UserRole = 'user' | 'admin' | 'superadmin';

export interface AuthUser {
  id: string;
  role: UserRole;
  parent_id: string | null;
}

/**
 * 토큰 검증 후 유저 정보 반환
 */
export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const supabase = getSupabase();
  const { data: user } = await supabase
    .from('users')
    .select('id, role, parent_id')
    .eq('id', payload.userId)
    .single();

  if (!user) return null;
  return user as AuthUser;
}

/**
 * superadmin 전용 체크
 * 사용: 회원관리, 카카오ID, 가게관리, 연장요청, 추가구매, 방상태, 총판관리
 */
export async function checkSuperAdmin(request: NextRequest): Promise<AuthUser | null> {
  const user = await getAuthUser(request);
  if (!user || user.role !== 'superadmin') return null;
  return user;
}

/**
 * admin(총판) 또는 superadmin 체크
 * 사용: 인원관리 (admin은 자기 유저 슬롯만)
 */
export async function checkAdminOrSuperAdmin(request: NextRequest): Promise<AuthUser | null> {
  const user = await getAuthUser(request);
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) return null;
  return user;
}
