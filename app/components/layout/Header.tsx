'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaBars, FaTimes, FaUser, FaCoins, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '@/app/hooks/useAuth';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, loading, signOut, isAuthenticated } = useAuth();
  
  // 임시 코인 데이터 (추후 실제 데이터로 교체)
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
                <Link href="/markets" className="text-foreground/80 hover:text-primary font-medium transition-colors">
                  마켓
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
            {loading ? (
              <div className="animate-pulse bg-background/40 rounded-full h-10 w-20"></div>
            ) : isAuthenticated ? (
              <>
                {/* 코인 표시 */}
                <div className="hidden sm:flex items-center bg-background/40 border border-primary/20 rounded-full px-3 py-1">
                  <FaCoins className="text-accent mr-1" />
                  <span className="text-sm font-semibold text-foreground">{userCoins.toLocaleString()}</span>
                </div>
                
                {/* 프로필 메뉴 */}
                <div className="relative">
                  <button 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 bg-background/40 rounded-full px-3 py-2 hover:bg-background/60 transition-colors border border-primary/20"
                  >
                    {user?.user_metadata?.avatar_url ? (
                      <img 
                        src={user.user_metadata.avatar_url} 
                        alt="프로필" 
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <FaUser className="text-foreground/70" />
                    )}
                    <span className="hidden sm:block text-sm font-medium text-foreground">
                      {user?.user_metadata?.full_name || user?.email?.split('@')[0] || '사용자'}
                    </span>
                  </button>
                  
                  {/* 사용자 드롭다운 메뉴 */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-background/95 backdrop-blur-sm border border-primary/20 rounded-lg shadow-lg py-1 z-50">
                      <div className="px-4 py-2 border-b border-primary/10">
                        <p className="text-sm font-medium text-foreground">
                          {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                        </p>
                        <p className="text-xs text-foreground/60">{user?.email}</p>
                      </div>
                      <Link
                        href="/profile"
                        className="flex items-center px-4 py-2 text-sm text-foreground/80 hover:text-primary hover:bg-primary/10 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <FaUser className="mr-2" />
                        프로필
                      </Link>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          signOut();
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-foreground/80 hover:text-primary hover:bg-primary/10 transition-colors"
                      >
                        <FaSignOutAlt className="mr-2" />
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link 
                  href="/auth"
                  className="border border-primary/50 text-primary px-4 py-2 rounded-2xl font-medium hover:bg-primary/10 transition-colors"
                >
                  로그인
                </Link>
                <Link 
                  href="/auth"
                  className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-2xl font-medium transition-colors"
                >
                  회원가입
                </Link>
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
                    href="/markets" 
                    className="text-foreground/80 hover:text-primary font-medium transition-colors px-4 py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    마켓
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
              
              {/* 모바일 인증 영역 */}
              {isAuthenticated ? (
                <>
                  <div className="flex items-center justify-between px-4 py-2 bg-background/40 border border-primary/20 rounded-lg mx-4">
                    <span className="text-sm text-foreground/70">보유 코인</span>
                    <div className="flex items-center">
                      <FaCoins className="text-accent mr-1" />
                      <span className="text-sm font-semibold text-foreground">{userCoins.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  {/* 사용자 정보 */}
                  <div className="px-4 py-2 border-t border-primary/10 mx-4">
                    <div className="flex items-center space-x-3 mb-3">
                      {user?.user_metadata?.avatar_url ? (
                        <img 
                          src={user.user_metadata.avatar_url} 
                          alt="프로필" 
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <FaUser className="text-foreground/70" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                        </p>
                        <p className="text-xs text-foreground/60">{user?.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        signOut();
                      }}
                      className="flex items-center w-full px-3 py-2 text-sm text-foreground/80 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    >
                      <FaSignOutAlt className="mr-2" />
                      로그아웃
                    </button>
                  </div>
                </>
              ) : (
                <div className="px-4 py-2 space-y-2">
                  <Link
                    href="/auth"
                    className="block w-full text-center border border-primary/50 text-primary px-4 py-2 rounded-2xl font-medium hover:bg-primary/10 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    로그인
                  </Link>
                  <Link
                    href="/auth"
                    className="block w-full text-center bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-2xl font-medium transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    회원가입
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
