import Link from 'next/link';

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link href="/" className="text-pink-400 hover:text-pink-300 mb-4 inline-block">
              ← 메인으로 돌아가기
            </Link>
            <h1 className="text-3xl font-bold text-white mb-2">도움말</h1>
            <p className="text-gray-400">PPPlay 사용법을 안내해드립니다</p>
          </div>

          <div className="space-y-8">
            <section className="bg-slate-800/50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">🎯 서비스 소개</h2>
              <p className="text-gray-300 leading-relaxed">
                PPPlay는 스포츠 경기 결과를 예측하고 다른 사용자들과 경쟁하는 비사행성 예측 게임 플랫폼입니다.
                실제 돈이 아닌 게임 내 포인트를 사용하여 안전하고 재미있게 즐길 수 있습니다.
              </p>
            </section>

            <section className="bg-slate-800/50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">🚀 시작하기</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">1. 회원가입</h3>
                  <p className="text-gray-300">Google 또는 카카오 계정으로 간편하게 가입할 수 있습니다.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">2. 경기 선택</h3>
                  <p className="text-gray-300">야구, 배구, 축구 등 다양한 스포츠 경기를 선택할 수 있습니다.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">3. 예측하기</h3>
                  <p className="text-gray-300">경기 결과를 예측하고 포인트를 획득하세요!</p>
                </div>
              </div>
            </section>

            <section className="bg-slate-800/50 rounded-lg p-6">
              <h2 className="text-xl font-semibent text-white mb-4">⚽ 예측 방법</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">경기 선택</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li>• 팀 로고나 이름을 클릭하여 승리할 팀을 선택합니다</li>
                    <li>• 여러 경기를 동시에 선택할 수 있습니다</li>
                    <li>• 선택된 팀은 하이라이트로 표시됩니다</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">예측 제출</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li>• 화면 하단의 "예측하기" 버튼을 클릭합니다</li>
                    <li>• 선택한 예측을 확인하고 최종 제출합니다</li>
                    <li>• 경기 시작 전까지 예측을 수정할 수 있습니다</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="bg-slate-800/50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">🏆 포인트 시스템</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">포인트 획득</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li>• 예측이 맞으면 포인트를 획득합니다</li>
                    <li>• 연속으로 맞추면 보너스 포인트가 추가됩니다</li>
                    <li>• 랭킹 상위권에 들면 추가 보상을 받습니다</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">포인트 사용</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li>• 프라이빗 리그 개설에 사용할 수 있습니다</li>
                    <li>• 특별 아이템 구매에 사용할 수 있습니다</li>
                    <li>• 실제 현금으로 환전은 불가능합니다</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="bg-slate-800/50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">❓ 자주 묻는 질문</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Q. 실제 돈을 걸 수 있나요?</h3>
                  <p className="text-gray-300">A. 아니요. PPPlay는 비사행성 게임으로 실제 돈이 아닌 게임 내 포인트만 사용합니다.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Q. 예측을 수정할 수 있나요?</h3>
                  <p className="text-gray-300">A. 경기 시작 전까지는 언제든지 예측을 수정할 수 있습니다.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Q. 어떤 스포츠를 지원하나요?</h3>
                  <p className="text-gray-300">A. 현재 야구(KBO), 배구(V-League), 축구(EPL)를 지원하며, 지속적으로 확장 예정입니다.</p>
                </div>
              </div>
            </section>

            <section className="bg-slate-800/50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">📞 문의하기</h2>
              <p className="text-gray-300 mb-4">
                추가 문의사항이 있으시면 아래 방법으로 연락해주세요:
              </p>
              <div className="space-y-2 text-gray-300">
                <p>📧 이메일: support@ppplay.com</p>
                <p>⏰ 운영시간: 평일 09:00 - 18:00</p>
                <p>📱 카카오톡: @PPPlay (준비 중)</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
