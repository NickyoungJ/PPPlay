import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link href="/" className="text-pink-400 hover:text-pink-300 mb-4 inline-block">
              ← 메인으로 돌아가기
            </Link>
            <h1 className="text-3xl font-bold text-white mb-2">서비스 이용약관</h1>
            <p className="text-gray-400">최종 업데이트: 2024년 10월</p>
          </div>

          <div className="prose prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">제1조 (목적)</h2>
              <p className="text-gray-300 leading-relaxed">
                본 약관은 스포츠 승부예측 플랫폼(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">제2조 (정의)</h2>
              <ul className="text-gray-300 space-y-2">
                <li>1. "서비스"란 회사가 제공하는 스포츠 경기 결과 예측 플랫폼을 의미합니다.</li>
                <li>2. "이용자"란 본 약관에 따라 서비스를 이용하는 회원을 의미합니다.</li>
                <li>3. "예측"이란 스포츠 경기의 결과를 예상하여 선택하는 행위를 의미합니다.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">제3조 (서비스 이용)</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                1. 본 서비스는 비사행성 예측 게임으로, 실제 금전적 이익이나 손실이 발생하지 않습니다.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                2. 이용자는 스포츠 경기 결과를 예측하여 포인트를 획득할 수 있습니다.
              </p>
              <p className="text-gray-300 leading-relaxed">
                3. 모든 예측 활동은 순수한 재미와 경쟁을 목적으로 합니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">제4조 (이용자의 의무)</h2>
              <ul className="text-gray-300 space-y-2">
                <li>1. 이용자는 서비스 이용 시 관련 법령과 본 약관을 준수해야 합니다.</li>
                <li>2. 부정한 방법으로 서비스를 이용하거나 시스템을 조작해서는 안 됩니다.</li>
                <li>3. 다른 이용자에게 피해를 주는 행위를 해서는 안 됩니다.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">제5조 (개인정보 보호)</h2>
              <p className="text-gray-300 leading-relaxed">
                회사는 이용자의 개인정보를 관련 법령에 따라 보호하며, 자세한 사항은 개인정보 처리방침을 참조하시기 바랍니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">제6조 (면책사항)</h2>
              <p className="text-gray-300 leading-relaxed">
                회사는 천재지변, 시스템 장애 등 불가항력적 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">제7조 (약관의 변경)</h2>
              <p className="text-gray-300 leading-relaxed">
                회사는 필요에 따라 본 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지를 통해 안내됩니다.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-700">
            <p className="text-gray-400 text-center">
              문의사항이 있으시면 고객센터로 연락해주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
