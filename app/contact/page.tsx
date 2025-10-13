import Link from 'next/link';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link href="/" className="text-pink-400 hover:text-pink-300 mb-4 inline-block">
              ← 메인으로 돌아가기
            </Link>
            <h1 className="text-3xl font-bold text-white mb-2">문의하기</h1>
            <p className="text-gray-400">궁금한 점이 있으시면 언제든 연락해주세요</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* 연락처 정보 */}
            <div className="space-y-6">
              <section className="bg-slate-800/50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  📞 연락처 정보
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                      📧
                    </div>
                    <div>
                      <p className="font-medium text-white">이메일</p>
                      <p className="text-gray-300">support@ppplay.com</p>
                      <p className="text-sm text-gray-400">일반 문의 및 기술 지원</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                      ⏰
                    </div>
                    <div>
                      <p className="font-medium text-white">운영시간</p>
                      <p className="text-gray-300">평일 09:00 - 18:00</p>
                      <p className="text-sm text-gray-400">주말 및 공휴일 휴무</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                      💬
                    </div>
                    <div>
                      <p className="font-medium text-white">카카오톡 채널</p>
                      <p className="text-gray-300">@PPPlay</p>
                      <p className="text-sm text-gray-400">준비 중 (곧 출시 예정)</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                      🐛
                    </div>
                    <div>
                      <p className="font-medium text-white">버그 신고</p>
                      <p className="text-gray-300">bug-report@ppplay.com</p>
                      <p className="text-sm text-gray-400">서비스 오류 및 개선 제안</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="bg-slate-800/50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">🏢 회사 정보</h2>
                <div className="space-y-3 text-gray-300">
                  <p><span className="font-medium text-white">회사명:</span> PPPlay Inc.</p>
                  <p><span className="font-medium text-white">대표자:</span> 김승부</p>
                  <p><span className="font-medium text-white">사업자등록번호:</span> 123-45-67890</p>
                  <p><span className="font-medium text-white">주소:</span> 서울특별시 강남구 테헤란로 123</p>
                </div>
              </section>
            </div>

            {/* 문의 양식 */}
            <div>
              <section className="bg-slate-800/50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">✉️ 문의 양식</h2>
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      이름 *
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="이름을 입력해주세요"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      이메일 *
                    </label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="이메일을 입력해주세요"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      문의 유형
                    </label>
                    <select className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent">
                      <option value="">선택해주세요</option>
                      <option value="general">일반 문의</option>
                      <option value="bug">버그 신고</option>
                      <option value="feature">기능 제안</option>
                      <option value="account">계정 문제</option>
                      <option value="other">기타</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      제목 *
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="문의 제목을 입력해주세요"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      내용 *
                    </label>
                    <textarea
                      rows={6}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                      placeholder="문의 내용을 자세히 작성해주세요"
                      required
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-medium py-3 px-4 rounded-lg hover:from-pink-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all"
                  >
                    문의하기
                  </button>
                </form>

                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-sm text-blue-300">
                    <strong>알림:</strong> 현재 문의 양식은 준비 중입니다. 
                    급한 문의는 이메일(support@ppplay.com)로 직접 연락해주세요.
                  </p>
                </div>
              </section>
            </div>
          </div>

          {/* FAQ 섹션 */}
          <section className="mt-12 bg-slate-800/50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6">❓ 자주 묻는 질문</h2>
            <div className="space-y-4">
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700/70 transition-colors">
                  <span className="font-medium text-white">서비스 이용에 비용이 드나요?</span>
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-2 p-4 text-gray-300 bg-slate-700/30 rounded-lg">
                  PPPlay는 기본적으로 무료 서비스입니다. 게임 내 포인트를 사용하여 예측을 진행하며, 실제 돈은 사용하지 않습니다.
                </div>
              </details>

              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700/70 transition-colors">
                  <span className="font-medium text-white">계정을 삭제하고 싶어요.</span>
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-2 p-4 text-gray-300 bg-slate-700/30 rounded-lg">
                  계정 삭제를 원하시면 support@ppplay.com으로 이메일을 보내주세요. 본인 확인 후 처리해드립니다.
                </div>
              </details>

              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700/70 transition-colors">
                  <span className="font-medium text-white">예측 결과는 언제 확인할 수 있나요?</span>
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-2 p-4 text-gray-300 bg-slate-700/30 rounded-lg">
                  경기 종료 후 결과가 확정되면 자동으로 예측 결과가 업데이트됩니다. 보통 경기 종료 후 1-2시간 내에 확인 가능합니다.
                </div>
              </details>

              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700/70 transition-colors">
                  <span className="font-medium text-white">모바일에서도 이용할 수 있나요?</span>
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-2 p-4 text-gray-300 bg-slate-700/30 rounded-lg">
                  네! PPPlay는 모바일 최적화된 웹 서비스로, 스마트폰과 태블릿에서도 편리하게 이용하실 수 있습니다.
                </div>
              </details>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
