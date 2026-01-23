import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-neutral-950/80 backdrop-blur-sm border-b border-neutral-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <img src="/logo.png" alt="초톡" className="h-12" />
          <div className="flex gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm text-neutral-300 hover:text-white transition"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 rounded-lg transition"
            >
              회원가입
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-block px-4 py-2 bg-indigo-600/20 text-indigo-400 rounded-full text-sm font-medium mb-6">
            초톡/도촉 자동화 서비스
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            매번 확인하고 보고하는<br />
            <span className="text-indigo-400">번거로움을 끝내세요</span>
          </h1>
          <p className="text-lg text-neutral-400 mb-10 max-w-xl mx-auto leading-relaxed">
            초톡, 도촉 일일이 확인하고<br />
            아가씨들에게 상황 보고하느라 지치셨나요?<br />
            <span className="text-white font-medium">이제 모든 과정이 자동으로 처리됩니다.</span>
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-lg font-semibold transition"
          >
            지금 시작하기
          </Link>
        </div>

        {/* Pain Points */}
        <div className="max-w-4xl mx-auto mt-24">
          <h2 className="text-2xl font-bold text-center mb-12">
            이런 불편함, 겪어보셨죠?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-red-950/30 rounded-2xl p-6 border border-red-900/50">
              <div className="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-red-300">매번 수동 확인</h3>
              <p className="text-neutral-400 text-sm">
                초톡, 도촉 단톡방을 하나하나 확인하는 반복 작업
              </p>
            </div>

            <div className="bg-red-950/30 rounded-2xl p-6 border border-red-900/50">
              <div className="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-red-300">상황 보고의 어려움</h3>
              <p className="text-neutral-400 text-sm">
                확인한 내용을 아가씨들에게 일일이 전달하는 번거로움
              </p>
            </div>
          </div>
        </div>

        {/* Solution */}
        <div className="max-w-4xl mx-auto mt-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-indigo-400 mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold">
              <span className="text-indigo-400">초톡봇</span>이 해결해드립니다
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-neutral-900 rounded-2xl p-6 border border-neutral-800">
              <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">자동 감지</h3>
              <p className="text-neutral-400 text-sm">
                초톡, 도촉이 올라오면 자동으로 감지합니다
              </p>
            </div>

            <div className="bg-neutral-900 rounded-2xl p-6 border border-neutral-800">
              <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">자동 발송</h3>
              <p className="text-neutral-400 text-sm">
                아가씨들에게 카카오톡 메시지가 자동으로 전달됩니다
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="max-w-2xl mx-auto mt-24 text-center bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-3xl p-10 border border-indigo-800/50">
          <h2 className="text-2xl font-bold mb-4">
            더 이상 번거롭게 확인하지 마세요
          </h2>
          <p className="text-neutral-400 mb-8">
            등록만 해두면 알아서 처리됩니다
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-lg font-semibold transition"
          >
            시작하기
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800 py-8 px-6">
        <div className="max-w-5xl mx-auto text-center text-neutral-500 text-sm">
          <p>초톡봇</p>
          <p className="mt-1">개발사: assistsolution</p>
        </div>
      </footer>
    </div>
  );
}
