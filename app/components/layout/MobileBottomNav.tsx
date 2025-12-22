'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaHome, FaChartBar, FaTrophy, FaUser, FaStore } from 'react-icons/fa';
import { useAuth } from '@/app/hooks/useAuth';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // 스크롤 방향에 따라 네비게이션 숨기기/보이기
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // 스크롤 다운 시 숨기기, 업 시 보이기
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const navItems = [
    { href: '/', icon: FaHome, label: '홈' },
    { href: '/markets', icon: FaChartBar, label: '마켓' },
    { href: '/ranking', icon: FaTrophy, label: '랭킹' },
    { href: '/leaderboard', icon: FaStore, label: '상점' },
    { href: isAuthenticated ? '/profile' : '/auth', icon: FaUser, label: isAuthenticated ? '마이' : '로그인' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav 
      className={`
        md:hidden fixed bottom-0 left-0 right-0 z-50
        bg-background/95 backdrop-blur-xl border-t border-primary/20
        transition-transform duration-300 ease-out
        ${isVisible ? 'translate-y-0' : 'translate-y-full'}
        safe-area-bottom
      `}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center justify-center
                flex-1 h-full py-2
                transition-all duration-200
                ${active 
                  ? 'text-primary' 
                  : 'text-foreground/50 active:text-primary'
                }
              `}
            >
              <div className={`
                relative p-2 rounded-xl transition-all duration-200
                ${active ? 'bg-primary/10' : 'active:bg-primary/5'}
              `}>
                <Icon className={`text-xl ${active ? 'scale-110' : ''} transition-transform`} />
                {active && (
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                )}
              </div>
              <span className={`text-[10px] mt-0.5 font-medium ${active ? 'text-primary' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

