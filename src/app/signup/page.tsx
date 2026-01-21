import Link from 'next/link';
import { SignupForm } from '@/components/auth';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Chotalk
            </h1>
            <p className="text-gray-400">새 계정을 만들어보세요</p>
          </div>

          <SignupForm />

          <p className="mt-6 text-center text-sm text-gray-400">
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
