import Link from 'next/link';
import { LoginForm } from '@/components/auth';
import BrandedLogo from '@/components/BrandedLogo';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-md">
        <div className="bg-neutral-900 rounded-2xl shadow-2xl p-8 border border-neutral-800">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <BrandedLogo />
            </div>
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
