'use client';

import Link from 'next/link';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { FaArrowLeft } from 'react-icons/fa';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 px-4 md:px-8 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-foreground/70 hover:text-primary transition-colors mb-6"
            >
              <FaArrowLeft />
              <span>메인으로 돌아가기</span>
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">서비스 이용약관</h1>
            <p className="text-foreground/50">최종 업데이트: 2024년 12월</p>
          </div>

          {/* 본문 */}
          <div className="bg-background/40 backdrop-blur-xl border border-primary/20 rounded-3xl p-6 md:p-8 space-y-8">
            <section>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="text-primary">제1조</span> 목적
              </h2>
              <p className="text-foreground/80 leading-relaxed">
                본 약관은 PPPlay(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="text-primary">제2조</span> 정의
              </h2>
              <ul className="text-foreground/80 space-y-3">
                <li className="flex gap-2">
                  <span className="text-primary font-semibold">1.</span>
                  <span>"서비스"란 회사가 제공하는 예측 마켓 플랫폼을 의미합니다.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-semibold">2.</span>
                  <span>"이용자"란 본 약관에 따라 서비스를 이용하는 회원을 의미합니다.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-semibold">3.</span>
                  <span>"마켓"이란 특정 주제에 대해 YES/NO로 예측하는 게시물을 의미합니다.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-semibold">4.</span>
                  <span>"포인트"란 서비스 내에서 사용되는 가상의 점수를 의미합니다.</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="text-primary">제3조</span> 서비스 이용
              </h2>
              <ul className="text-foreground/80 space-y-3">
                <li className="flex gap-2">
                  <span className="text-primary font-semibold">1.</span>
                  <span>본 서비스는 <strong className="text-accent">비사행성 예측 게임</strong>으로, 실제 금전적 이익이나 손실이 발생하지 않습니다.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-semibold">2.</span>
                  <span>이용자는 마켓에 참여하여 포인트를 획득할 수 있습니다.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-semibold">3.</span>
                  <span>포인트는 현금으로 환전되지 않으며, 서비스 내에서만 사용됩니다.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-semibold">4.</span>
                  <span>모든 예측 활동은 순수한 재미와 경쟁을 목적으로 합니다.</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="text-primary">제4조</span> 회원가입 및 탈퇴
              </h2>
              <ul className="text-foreground/80 space-y-3">
                <li className="flex gap-2">
                  <span className="text-primary font-semibold">1.</span>
                  <span>회원가입은 카카오, 구글 등 소셜 로그인을 통해 가능합니다.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-semibold">2.</span>
                  <span>회원은 언제든지 탈퇴를 요청할 수 있습니다.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-semibold">3.</span>
                  <span>탈퇴 시 보유한 포인트 및 기록은 삭제됩니다.</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="text-primary">제5조</span> 이용자의 의무
              </h2>
              <ul className="text-foreground/80 space-y-3">
                <li className="flex gap-2">
                  <span className="text-primary font-semibold">1.</span>
                  <span>이용자는 서비스 이용 시 관련 법령과 본 약관을 준수해야 합니다.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-semibold">2.</span>
                  <span>부정한 방법으로 서비스를 이용하거나 시스템을 조작해서는 안 됩니다.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-semibold">3.</span>
                  <span>다른 이용자에게 피해를 주는 행위를 해서는 안 됩니다.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-semibold">4.</span>
                  <span>욕설, 비방, 허위정보 등 부적절한 콘텐츠를 게시해서는 안 됩니다.</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="text-primary">제6조</span> 서비스 제한 및 이용정지
              </h2>
              <ul className="text-foreground/80 space-y-3">
                <li className="flex gap-2">
                  <span className="text-primary font-semibold">1.</span>
                  <span>회사는 약관 위반 시 서비스 이용을 제한하거나 회원 자격을 정지할 수 있습니다.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-semibold">2.</span>
                  <span>부정행위 적발 시 포인트 회수 및 계정 정지 조치가 취해질 수 있습니다.</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="text-primary">제7조</span> 개인정보 보호
              </h2>
              <p className="text-foreground/80 leading-relaxed">
                회사는 이용자의 개인정보를 관련 법령에 따라 보호하며, 자세한 사항은{' '}
                <Link href="/privacy" className="text-primary hover:underline">개인정보 처리방침</Link>을 참조하시기 바랍니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="text-primary">제8조</span> 면책사항
              </h2>
              <ul className="text-foreground/80 space-y-3">
                <li className="flex gap-2">
                  <span className="text-primary font-semibold">1.</span>
                  <span>회사는 천재지변, 시스템 장애 등 불가항력적 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-semibold">2.</span>
                  <span>이용자가 게시한 콘텐츠로 인해 발생하는 분쟁에 대해 회사는 책임을 지지 않습니다.</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="text-primary">제9조</span> 약관의 변경
              </h2>
              <p className="text-foreground/80 leading-relaxed">
                회사는 필요에 따라 본 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지를 통해 시행 7일 전에 안내됩니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="text-primary">제10조</span> 분쟁 해결
              </h2>
              <ul className="text-foreground/80 space-y-3">
                <li className="flex gap-2">
                  <span className="text-primary font-semibold">1.</span>
                  <span>본 약관과 관련된 분쟁은 대한민국 법령에 따릅니다.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-semibold">2.</span>
                  <span>분쟁 발생 시 회사와 이용자는 원만한 해결을 위해 상호 협의합니다.</span>
                </li>
              </ul>
            </section>
          </div>

          {/* 하단 안내 */}
          <div className="mt-8 text-center">
            <p className="text-foreground/50">
              문의사항이 있으시면{' '}
              <Link href="/contact" className="text-primary hover:underline">고객센터</Link>로 연락해주세요.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
