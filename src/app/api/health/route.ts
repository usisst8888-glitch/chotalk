import { NextResponse } from 'next/server';

// Health check API - Vercel warm 상태 유지용
export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
}
