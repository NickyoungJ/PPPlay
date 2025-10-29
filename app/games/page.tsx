'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 이 페이지는 더 이상 사용되지 않습니다.
// /markets로 자동 리다이렉트합니다.
export default function GamesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/markets');
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
        <p className="text-foreground/70 font-medium">마켓 페이지로 이동 중...</p>
      </div>
    </div>
  );
}
