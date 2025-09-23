'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaBars, FaTimes, FaUser, FaCoins } from 'react-icons/fa';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // 임시 사용자 데이터 (추후 인증 시스템 연동)
  const isLoggedIn = false;
  const userCoins = 1250;

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-background/90 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 로고 */}
          <Link href="/" className="flex items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              PPPlay
            </h1>
          </Link>

          {/* 데스크탑 네비게이션 */}
              <nav className="hidden md:flex items-center space-x-8">
                <Link href="/" className="text-foreground/80 hover:text-primary font-medium transition-colors">
                  홈
                </Link>
                <Link href="/games" className="text-foreground/80 hover:text-primary font-medium transition-colors">
                  경기예측
                </Link>
                <Link href="/leaderboard" className="text-foreground/80 hover:text-primary font-medium transition-colors">
                  상점
                </Link>
              </nav>

          {/* 사용자 영역 */}
          <div className="flex items-center space-x-3">
            {isLoggedIn ? (
              <>
                {/* 코인 표시 */}
                <div className="hidden sm:flex items-center bg-background/40 border border-primary/20 rounded-full px-3 py-1">
                  <FaCoins className="text-accent mr-1" />
                  <span className="text-sm font-semibold text-foreground">{userCoins.toLocaleString()}</span>
                </div>
                
                {/* 프로필 메뉴 */}
                <div className="relative">
                  <button className="flex items-center space-x-2 bg-background/40 rounded-full px-3 py-2 hover:bg-background/60 transition-colors border border-primary/20">
                    <FaUser className="text-foreground/70" />
                    <span className="hidden sm:block text-sm font-medium text-foreground">사용자</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <button className="border border-primary/50 text-primary px-4 py-2 rounded-2xl font-medium hover:bg-primary/10 transition-colors">
                  로그인
                </button>
                <button className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-2xl font-medium transition-colors">
                  회원가입
                </button>
              </div>
            )}

            {/* 모바일 메뉴 버튼 */}
            <button
              onClick={toggleMenu}
              className="md:hidden p-2 rounded-lg hover:bg-background/40 transition-colors"
            >
              {isMenuOpen ? (
                <FaTimes className="h-5 w-5 text-foreground/70" />
              ) : (
                <FaBars className="h-5 w-5 text-foreground/70" />
              )}
            </button>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        {isMenuOpen && (
              <div className="md:hidden border-t border-white/10 py-4">
                <nav className="flex flex-col space-y-4">
                  <Link 
                    href="/" 
                    className="text-foreground/80 hover:text-primary font-medium transition-colors px-4 py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    홈
                  </Link>
                  <Link 
                    href="/games" 
                    className="text-foreground/80 hover:text-primary font-medium transition-colors px-4 py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    경기예측
                  </Link>
                  <Link 
                    href="/leaderboard" 
                    className="text-foreground/80 hover:text-primary font-medium transition-colors px-4 py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    상점
                  </Link>
              
              {isLoggedIn && (
                <div className="flex items-center justify-between px-4 py-2 bg-background/40 border border-primary/20 rounded-lg mx-4">
                  <span className="text-sm text-foreground/70">보유 코인</span>
                  <div className="flex items-center">
                    <FaCoins className="text-accent mr-1" />
                    <span className="text-sm font-semibold text-foreground">{userCoins.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
