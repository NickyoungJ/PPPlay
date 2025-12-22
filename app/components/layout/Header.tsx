'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaBars, FaTimes, FaUser, FaCoins, FaSignOutAlt, FaCog, FaCalendarCheck } from 'react-icons/fa';
import { useAuth } from '@/app/hooks/useAuth';
import AttendanceModal from '../attendance/AttendanceModal';
import NotificationDropdown from '../notifications/NotificationDropdown';

// 관리자 이메일 목록 (환경변수 또는 기본값)
const ADMIN_EMAILS = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [
  'admin@ppplay.com',
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userCoins, setUserCoins] = useState(0);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const { user, loading, signOut, isAuthenticated } = useAuth();
  
  // 관리자 여부 확인
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);
  
  // 실시간 포인트 가져오기
  useEffect(() => {
    const fetchUserPoints = async () => {
      if (isAuthenticated) {
        try {
          const response = await fetch('/api/profile');
          const data = await response.json();
          
          if (data.success) {
            setUserCoins(data.profile.points.total);
          }
        } catch (error) {
          console.error('포인트 조회 오류:', error);
        }
      }
    };

    fetchUserPoints();
    
    // 30초마다 포인트 갱신
    const interval = setInterval(fetchUserPoints, 30000);
    
    // 포인트 업데이트 이벤트 리스너 (투표 후 즉시 갱신)
    const handlePointsUpdate = () => {
      fetchUserPoints();
    };
    
    window.addEventListener('pointsUpdated', handlePointsUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('pointsUpdated', handlePointsUpdate);
    };
  }, [isAuthenticated]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-background/90 backdrop-blur-md border-b border-white/10 sticky top-0 z-50 safe-area-top">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* 로고 */}
          <Link href="/" className="flex items-center">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
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
                <Link href="/ranking" className="text-foreground/80 hover:text-primary font-medium transition-colors">
                  랭킹
                </Link>
                <Link href="/leaderboard" className="text-foreground/80 hover:text-primary font-medium transition-colors">
                  상점
                </Link>
                {/* 관리자 메뉴 (관리자만 표시) */}
                {isAdmin && (
                  <Link 
                    href="/admin" 
                    className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 rounded-full font-medium hover:opacity-90 transition-all text-sm"
                  >
                    <FaCog className="text-xs" />
                    관리자
                  </Link>
                )}
              </nav>

          {/* 사용자 영역 */}
          <div className="flex items-center space-x-1.5 sm:space-x-3">
            {loading ? (
              <div className="animate-pulse bg-background/40 rounded-full h-8 sm:h-10 w-16 sm:w-20"></div>
            ) : isAuthenticated ? (
              <>
                {/* 출석 체크 버튼 - 모바일에서 아이콘만 */}
                <button
                  onClick={() => setShowAttendanceModal(true)}
                  className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white p-2 sm:px-3 sm:py-1.5 rounded-full font-medium hover:opacity-90 transition-all text-sm btn-press hover-glow"
                >
                  <FaCalendarCheck className="text-sm sm:text-base" />
                  <span className="hidden sm:inline">출석</span>
                </button>
                
                {/* 알림 아이콘 */}
                <NotificationDropdown />
                
                {/* 코인 표시 - 모바일에서 더 컴팩트하게 */}
                <div className="flex items-center bg-background/40 border border-primary/20 rounded-full px-2 sm:px-3 py-1">
                  <FaCoins className="text-accent mr-1 text-xs sm:text-sm" />
                  <span className="text-xs sm:text-sm font-semibold text-foreground">{userCoins.toLocaleString()}</span>
                </div>
                
                {/* 프로필 메뉴 - 모바일에서 아이콘만 */}
                <div className="relative">
                  <button 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-1 sm:space-x-2 bg-background/40 rounded-full p-1.5 sm:px-3 sm:py-2 hover:bg-background/60 transition-colors border border-primary/20"
                  >
                    {user?.user_metadata?.avatar_url ? (
                      <img 
                        src={user.user_metadata.avatar_url} 
                        alt="프로필" 
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <FaUser className="text-foreground/70 text-sm sm:text-base" />
                    )}
                    <span className="hidden md:block text-sm font-medium text-foreground">
                      {user?.user_metadata?.full_name || user?.email?.split('@')[0] || '사용자'}
                    </span>
                    {/* 관리자 뱃지 */}
                    {isAdmin && (
                      <span className="hidden md:inline-block px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded-full font-bold">
                        Admin
                      </span>
                    )}
                  </button>
                  
                  {/* 사용자 드롭다운 메뉴 */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-background/95 backdrop-blur-sm border border-primary/20 rounded-lg shadow-lg py-1 z-50">
                      <div className="px-4 py-2 border-b border-primary/10">
                        <p className="text-sm font-medium text-foreground">
                          {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                        </p>
                        <p className="text-xs text-foreground/60">{user?.email}</p>
                        {isAdmin && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full font-bold">
                            관리자
                          </span>
                        )}
                      </div>
                      <Link
                        href="/profile"
                        className="flex items-center px-4 py-2 text-sm text-foreground/80 hover:text-primary hover:bg-primary/10 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <FaUser className="mr-2" />
                        프로필
                      </Link>
                      {/* 관리자 메뉴 (드롭다운) */}
                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="flex items-center px-4 py-2 text-sm text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <FaCog className="mr-2" />
                          관리자 대시보드
                        </Link>
                      )}
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
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Link 
                  href="/auth"
                  className="hidden sm:block border border-primary/50 text-primary px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl font-medium hover:bg-primary/10 transition-colors text-sm sm:text-base"
                >
                  로그인
                </Link>
                <Link 
                  href="/auth"
                  className="bg-primary hover:bg-primary/90 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl font-medium transition-colors text-sm sm:text-base"
                >
                  <span className="sm:hidden">로그인</span>
                  <span className="hidden sm:inline">회원가입</span>
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
                    href="/ranking" 
                    className="text-foreground/80 hover:text-primary font-medium transition-colors px-4 py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    랭킹
                  </Link>
                  <Link 
                    href="/leaderboard" 
                    className="text-foreground/80 hover:text-primary font-medium transition-colors px-4 py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    상점
                  </Link>
                  {/* 관리자 메뉴 (모바일) */}
                  {isAdmin && (
                    <Link 
                      href="/admin" 
                      className="flex items-center gap-2 mx-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-all"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FaCog className="text-sm" />
                      관리자 대시보드
                    </Link>
                  )}
              
              {/* 모바일 인증 영역 */}
              {isAuthenticated ? (
                <>
                  {/* 출석 체크 버튼 (모바일) */}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setShowAttendanceModal(true);
                    }}
                    className="flex items-center justify-center gap-2 mx-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-3 rounded-xl font-medium hover:opacity-90 transition-all"
                  >
                    <FaCalendarCheck />
                    <span>출석 체크</span>
                  </button>
                  
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
                          {isAdmin && (
                            <span className="ml-2 px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded-full font-bold">
                              Admin
                            </span>
                          )}
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
      
      {/* 출석 체크 모달 */}
      <AttendanceModal
        isOpen={showAttendanceModal}
        onClose={() => setShowAttendanceModal(false)}
      />
    </header>
  );
}
