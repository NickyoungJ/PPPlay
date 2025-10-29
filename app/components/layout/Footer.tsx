import Link from 'next/link';
import { FaGithub, FaTwitter, FaInstagram } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="bg-background/70 backdrop-blur-md border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 브랜드 정보 */}
          <div className="col-span-1 md:col-span-2">
            <div className="mb-4">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                PPPlay
              </h3>
              <p className="text-sm text-foreground/70">한국형 폴리마켓 예측 플랫폼</p>
            </div>
            <p className="text-foreground/70 mb-6 max-w-md">
              정치, 경제, 연예, 스포츠 등 다양한 이슈를 예측하고
              정확한 예측으로 포인트를 획득하세요.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-foreground/70 hover:text-primary transition-colors">
                <FaGithub className="h-5 w-5" />
              </a>
              <a href="#" className="text-foreground/70 hover:text-primary transition-colors">
                <FaTwitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-foreground/70 hover:text-primary transition-colors">
                <FaInstagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* 서비스 링크 */}
              <div>
                <h4 className="text-lg font-semibold mb-4 text-foreground">서비스</h4>
                <ul className="space-y-2">
                  <li>
                    <Link href="/markets" className="text-foreground/70 hover:text-primary transition-colors">
                      예측 마켓
                    </Link>
                  </li>
                  <li>
                    <Link href="/leaderboard" className="text-foreground/70 hover:text-primary transition-colors">
                      상점
                    </Link>
                  </li>
                </ul>
              </div>

          {/* 고객지원 */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-foreground">고객지원</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="text-foreground/70 hover:text-primary transition-colors">
                  도움말
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-foreground/70 hover:text-primary transition-colors">
                  문의하기
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-foreground/70 hover:text-primary transition-colors">
                  이용약관
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-foreground/70 hover:text-primary transition-colors">
                  개인정보처리방침
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* 하단 저작권 */}
        <div className="border-t border-white/10 mt-8 pt-8 text-center">
          <p className="text-foreground/70 text-sm">
            &copy; 2025 PPPlay. All rights reserved.
          </p>
          <p className="text-foreground/50 text-xs mt-2">
            본 서비스는 비사행성 게임으로 운영되며, 사행성을 조장하지 않습니다.
          </p>
        </div>
      </div>
    </footer>
  );
}
