'use client';

import Link from 'next/link';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { FaArrowLeft, FaShieldAlt } from 'react-icons/fa';

export default function PrivacyPage() {
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
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">개인정보 처리방침</h1>
            <p className="text-foreground/50">최종 업데이트: 2024년 12월</p>
          </div>

          {/* 본문 */}
          <div className="bg-background/40 backdrop-blur-xl border border-primary/20 rounded-3xl p-6 md:p-8 space-y-8">
            
            {/* 개요 */}
            <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4 flex items-start gap-3">
              <FaShieldAlt className="text-primary text-xl mt-1 flex-shrink-0" />
              <p className="text-foreground/80">
                PPPlay(이하 "회사")는 이용자의 개인정보를 소중히 여기며, 「개인정보 보호법」 등 관련 법령을 준수합니다.
              </p>
            </div>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="text-primary">1.</span> 개인정보 수집 및 이용 목적
              </h2>
              <p className="text-foreground/80 leading-relaxed mb-4">
                회사는 다음의 목적을 위해 개인정보를 수집 및 이용합니다:
              </p>
              <ul className="text-foreground/80 space-y-2 ml-4">
                <li>• 회원 가입 및 관리</li>
                <li>• 서비스 제공 및 운영</li>
                <li>• 예측 기록 및 랭킹 관리</li>
                <li>• 고객 지원 및 문의 응답</li>
                <li>• 서비스 개선 및 신규 기능 개발</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="text-primary">2.</span> 수집하는 개인정보 항목
              </h2>
              
              <div className="space-y-4">
                <div className="bg-background/60 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-foreground mb-3">📋 필수 수집 항목</h3>
                  <ul className="text-foreground/80 space-y-2 ml-4">
                    <li>• 소셜 로그인 ID (카카오/구글)</li>
                    <li>• 이메일 주소</li>
                    <li>• 닉네임</li>
                  </ul>
                </div>
                
                <div className="bg-background/60 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-foreground mb-3">🔄 자동 수집 항목</h3>
                  <ul className="text-foreground/80 space-y-2 ml-4">
                    <li>• 서비스 이용 기록 (투표 내역, 포인트 변동)</li>
                    <li>• 접속 로그 (IP 주소, 접속 시간)</li>
                    <li>• 기기 정보 (브라우저 종류, OS)</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="text-primary">3.</span> 개인정보 보유 및 이용 기간
              </h2>
              <p className="text-foreground/80 leading-relaxed mb-4">
                회사는 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.
              </p>
              <div className="bg-background/60 rounded-xl p-4">
                <ul className="text-foreground/80 space-y-2">
                  <li className="flex justify-between items-center py-2 border-b border-primary/10">
                    <span>회원 탈퇴 시</span>
                    <span className="text-primary font-semibold">즉시 삭제</span>
                  </li>
                  <li className="flex justify-between items-center py-2 border-b border-primary/10">
                    <span>서비스 이용 기록</span>
                    <span className="text-primary font-semibold">1년 보관 후 삭제</span>
                  </li>
                  <li className="flex justify-between items-center py-2">
                    <span>법령에 의한 보관</span>
                    <span className="text-primary font-semibold">관련 법령 기간</span>
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="text-primary">4.</span> 개인정보 제3자 제공
              </h2>
              <p className="text-foreground/80 leading-relaxed">
                회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 
                다만, 다음의 경우에는 예외로 합니다:
              </p>
              <ul className="text-foreground/80 space-y-2 ml-4 mt-3">
                <li>• 이용자가 사전에 동의한 경우</li>
                <li>• 법령의 규정에 의거하거나 수사기관의 요청이 있는 경우</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="text-primary">5.</span> 개인정보 처리 위탁
              </h2>
              <p className="text-foreground/80 leading-relaxed mb-4">
                회사는 서비스 제공을 위해 다음과 같이 개인정보 처리를 위탁하고 있습니다:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-background/60 rounded-xl p-4 text-center">
                  <div className="text-2xl mb-2">🗄️</div>
                  <div className="font-semibold text-foreground">Supabase</div>
                  <div className="text-sm text-foreground/60">데이터베이스 및 인증</div>
                </div>
                <div className="bg-background/60 rounded-xl p-4 text-center">
                  <div className="text-2xl mb-2">🌐</div>
                  <div className="font-semibold text-foreground">Vercel</div>
                  <div className="text-sm text-foreground/60">웹 호스팅</div>
                </div>
                <div className="bg-background/60 rounded-xl p-4 text-center">
                  <div className="text-2xl mb-2">🔵</div>
                  <div className="font-semibold text-foreground">Google</div>
                  <div className="text-sm text-foreground/60">소셜 로그인</div>
                </div>
                <div className="bg-background/60 rounded-xl p-4 text-center">
                  <div className="text-2xl mb-2">💬</div>
                  <div className="font-semibold text-foreground">Kakao</div>
                  <div className="text-sm text-foreground/60">소셜 로그인</div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="text-primary">6.</span> 이용자의 권리
              </h2>
              <p className="text-foreground/80 leading-relaxed mb-4">
                이용자는 언제든지 다음의 권리를 행사할 수 있습니다:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-primary/10 rounded-xl p-3 text-center">
                  <div className="text-lg mb-1">👁️</div>
                  <div className="text-sm font-medium text-foreground">열람 요구</div>
                </div>
                <div className="bg-primary/10 rounded-xl p-3 text-center">
                  <div className="text-lg mb-1">✏️</div>
                  <div className="text-sm font-medium text-foreground">정정 요구</div>
                </div>
                <div className="bg-primary/10 rounded-xl p-3 text-center">
                  <div className="text-lg mb-1">🗑️</div>
                  <div className="text-sm font-medium text-foreground">삭제 요구</div>
                </div>
                <div className="bg-primary/10 rounded-xl p-3 text-center">
                  <div className="text-lg mb-1">⏸️</div>
                  <div className="text-sm font-medium text-foreground">처리정지 요구</div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="text-primary">7.</span> 개인정보 보호 조치
              </h2>
              <p className="text-foreground/80 leading-relaxed mb-4">
                회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:
              </p>
              <ul className="text-foreground/80 space-y-2 ml-4">
                <li>• 🔐 개인정보 암호화 전송 (SSL/TLS)</li>
                <li>• 🔑 접근 권한 관리 및 제한</li>
                <li>• 🛡️ 보안 프로그램 설치 및 갱신</li>
                <li>• 📝 개인정보 처리 시스템 접근 기록 보관</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="text-primary">8.</span> 쿠키(Cookie) 사용
              </h2>
              <p className="text-foreground/80 leading-relaxed">
                서비스는 이용자에게 최적화된 서비스를 제공하기 위해 쿠키를 사용합니다. 
                이용자는 브라우저 설정을 통해 쿠키 사용을 거부할 수 있으나, 
                이 경우 일부 서비스 이용에 제한이 있을 수 있습니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="text-primary">9.</span> 개인정보 보호책임자
              </h2>
              <p className="text-foreground/80 leading-relaxed mb-4">
                개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 
                정보주체의 불만처리 및 피해구제를 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
              </p>
              <div className="bg-background/60 rounded-xl p-4">
                <div className="space-y-2">
                  <p className="flex items-center gap-2">
                    <span className="text-foreground/60">📧 이메일:</span>
                    <span className="text-primary font-medium">support@ppplay.kr</span>
                  </p>
                  <p className="text-foreground/60 text-sm">
                    ※ 문의사항은 이메일로 연락해주세요.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="text-primary">10.</span> 개인정보 처리방침 변경
              </h2>
              <p className="text-foreground/80 leading-relaxed">
                본 개인정보 처리방침은 법령·정책 또는 보안기술의 변경에 따라 내용의 추가·삭제 및 수정이 있을 시에는 
                변경사항의 시행 7일 전부터 서비스 내 공지사항을 통하여 고지할 것입니다.
              </p>
            </section>
          </div>

          {/* 하단 안내 */}
          <div className="mt-8 text-center">
            <p className="text-foreground/50">
              개인정보 처리방침에 대한 문의는{' '}
              <a href="mailto:support@ppplay.kr" className="text-primary hover:underline">support@ppplay.kr</a>로 연락해주세요.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
