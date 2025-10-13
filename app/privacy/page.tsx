import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link href="/" className="text-pink-400 hover:text-pink-300 mb-4 inline-block">
              ← 메인으로 돌아가기
            </Link>
            <h1 className="text-3xl font-bold text-white mb-2">개인정보 처리방침</h1>
            <p className="text-gray-400">최종 업데이트: 2024년 10월</p>
          </div>

          <div className="prose prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">1. 개인정보 수집 및 이용 목적</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                스포츠 승부예측 플랫폼은 다음의 목적을 위해 개인정보를 수집 및 이용합니다:
              </p>
              <ul className="text-gray-300 space-y-2">
                <li>• 서비스 제공 및 회원 관리</li>
                <li>• 예측 기록 및 랭킹 관리</li>
                <li>• 고객 지원 및 문의 응답</li>
                <li>• 서비스 개선 및 개발</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">2. 수집하는 개인정보 항목</h2>
              <div className="mb-4">
                <h3 className="text-lg font-medium text-white mb-2">필수 수집 항목</h3>
                <ul className="text-gray-300 space-y-2">
                  <li>• 이메일 주소</li>
                  <li>• 닉네임</li>
                  <li>• 프로필 사진 (선택사항)</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-2">자동 수집 항목</h3>
                <ul className="text-gray-300 space-y-2">
                  <li>• 서비스 이용 기록</li>
                  <li>• 접속 로그</li>
                  <li>• 기기 정보</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">3. 개인정보 보유 및 이용 기간</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                회사는 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.
              </p>
              <ul className="text-gray-300 space-y-2">
                <li>• 회원 탈퇴 시: 즉시 삭제</li>
                <li>• 서비스 이용 기록: 1년 보관 후 삭제</li>
                <li>• 법령에 의한 보관: 관련 법령에서 정한 기간</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">4. 개인정보 제3자 제공</h2>
              <p className="text-gray-300 leading-relaxed">
                회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 
                다만, 법령의 규정에 의거하거나 수사기관의 요구가 있는 경우에는 관련 법령에 따라 제공할 수 있습니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">5. 개인정보 처리 위탁</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                회사는 서비스 제공을 위해 다음과 같이 개인정보 처리를 위탁하고 있습니다:
              </p>
              <ul className="text-gray-300 space-y-2">
                <li>• Supabase: 데이터베이스 및 인증 서비스</li>
                <li>• Vercel: 웹 호스팅 서비스</li>
                <li>• Google: 소셜 로그인 서비스</li>
                <li>• Kakao: 소셜 로그인 서비스</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">6. 이용자의 권리</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                이용자는 언제든지 다음의 권리를 행사할 수 있습니다:
              </p>
              <ul className="text-gray-300 space-y-2">
                <li>• 개인정보 열람 요구</li>
                <li>• 오류 등이 있을 경우 정정 요구</li>
                <li>• 삭제 요구</li>
                <li>• 처리 정지 요구</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">7. 개인정보 보호 조치</h2>
              <p className="text-gray-300 leading-relaxed">
                회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:
              </p>
              <ul className="text-gray-300 space-y-2 mt-4">
                <li>• 개인정보 암호화</li>
                <li>• 접근 권한 관리</li>
                <li>• 보안 프로그램 설치 및 갱신</li>
                <li>• 개인정보 처리 시스템 접근 기록 보관</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">8. 쿠키 사용</h2>
              <p className="text-gray-300 leading-relaxed">
                서비스는 이용자에게 최적화된 서비스를 제공하기 위해 쿠키를 사용할 수 있습니다. 
                이용자는 브라우저 설정을 통해 쿠키 사용을 거부할 수 있습니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">9. 개인정보 보호책임자</h2>
              <div className="text-gray-300">
                <p className="mb-2">개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제를 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
                <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                  <p>이메일: privacy@sportsprediction.com</p>
                  <p>연락처: 문의사항은 이메일로 연락해주세요.</p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">10. 개인정보 처리방침 변경</h2>
              <p className="text-gray-300 leading-relaxed">
                본 개인정보 처리방침은 법령·정책 또는 보안기술의 변경에 따라 내용의 추가·삭제 및 수정이 있을 시에는 
                변경사항의 시행 7일 전부터 서비스 내 공지사항을 통하여 고지할 것입니다.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-700">
            <p className="text-gray-400 text-center">
              개인정보 처리방침에 대한 문의사항이 있으시면 개인정보 보호책임자에게 연락해주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
