'use client';

import Link from 'next/link';
import { LoginForm } from '@/components/auth';
import BrandedLogo from '@/components/BrandedLogo';
import { useTheme } from '@/lib/theme-context';

export default function LoginPage() {
  const { distributor } = useTheme();
  const siteName = distributor?.site_name || '스타트봇';

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-md">
        <div className="bg-neutral-900 rounded-2xl shadow-2xl p-8 border border-neutral-800">
          <div className="text-center mb-8">
            {(distributor?.logo_url || !distributor) ? (
              <div className="flex justify-center mb-4">
                <BrandedLogo />
              </div>
            ) : (
              <h1 className="text-2xl font-bold text-white mb-4">{siteName}</h1>
            )}
            <p className="text-neutral-400">계정에 로그인하세요</p>
          </div>

          <LoginForm />

          <p className="mt-6 text-center text-sm text-neutral-400">
            계정이 없으신가요?{' '}
            <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium transition">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
