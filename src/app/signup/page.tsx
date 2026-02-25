import Link from 'next/link';
import { SignupForm } from '@/components/auth';
import BrandedLogo from '@/components/BrandedLogo';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-md">
        <div className="bg-neutral-900 rounded-2xl shadow-2xl p-8 border border-neutral-800">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <BrandedLogo />
            </div>
            <p className="text-neutral-400">새 계정을 만들어보세요</p>
          </div>

          <SignupForm />

          <p className="mt-6 text-center text-sm text-neutral-400">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
