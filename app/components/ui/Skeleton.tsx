'use client';

// 기본 스켈레톤 컴포넌트
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div 
      className={`animate-pulse bg-gradient-to-r from-foreground/5 via-foreground/10 to-foreground/5 bg-[length:200%_100%] rounded-lg ${className}`}
      style={{
        animation: 'shimmer 1.5s ease-in-out infinite',
      }}
    />
  );
}

// 마켓 카드 스켈레톤
export function MarketCardSkeleton() {
  return (
    <div className="bg-background/40 backdrop-blur-xl border border-primary/20 rounded-3xl p-6 space-y-4">
      {/* 카테고리 & 시간 */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-5 w-24" />
      </div>
      
      {/* 제목 */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-3/4" />
      </div>
      
      {/* 비율 바 */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-3 w-full rounded-full" />
      </div>
      
      {/* 참여자 & 버튼 */}
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-5 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-20 rounded-xl" />
          <Skeleton className="h-10 w-20 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// 마켓 카드 그리드 스켈레톤
export function MarketGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <MarketCardSkeleton key={i} />
      ))}
    </div>
  );
}

// 마켓 상세 스켈레톤
export function MarketDetailSkeleton() {
  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="bg-background/40 backdrop-blur-xl border border-primary/20 rounded-3xl p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
          <Skeleton className="h-6 w-32" />
        </div>
        
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-3/4" />
        </div>
        
        <Skeleton className="h-20 w-full" />
        
        <div className="flex gap-8">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-40" />
        </div>
      </div>
      
      {/* 투표 버튼 */}
      <div className="grid grid-cols-2 gap-6">
        <Skeleton className="h-48 rounded-3xl" />
        <Skeleton className="h-48 rounded-3xl" />
      </div>
      
      {/* 제출 버튼 */}
      <div className="bg-background/40 backdrop-blur-xl border border-primary/20 rounded-3xl p-8">
        <div className="text-center space-y-4">
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-6 w-80 mx-auto" />
        </div>
        <Skeleton className="h-16 w-full rounded-2xl mt-6" />
      </div>
    </div>
  );
}

// 프로필 페이지 스켈레톤
export function ProfileSkeleton() {
  return (
    <div className="space-y-8">
      {/* 포인트 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-3xl p-8 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-14 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
        
        <div className="bg-gradient-to-br from-secondary/20 to-secondary/5 border border-secondary/30 rounded-3xl p-8 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-14 w-24" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
      
      {/* 통계 */}
      <div className="bg-background/40 border border-primary/20 rounded-3xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-7 w-28" />
        </div>
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center space-y-2">
              <Skeleton className="h-10 w-16 mx-auto" />
              <Skeleton className="h-4 w-20 mx-auto" />
            </div>
          ))}
        </div>
      </div>
      
      {/* 리스트 */}
      <div className="bg-background/40 border border-primary/20 rounded-3xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-7 w-7 rounded-full" />
          <Skeleton className="h-7 w-32" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-background/60 rounded-xl">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 랭킹 리스트 스켈레톤
export function RankingListSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-background/40 border border-primary/10 rounded-2xl">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-7 w-20" />
        </div>
      ))}
    </div>
  );
}

// 알림 리스트 스켈레톤
export function NotificationListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 bg-background/40 border border-primary/10 rounded-2xl">
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

// 테이블 스켈레톤
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {/* 헤더 */}
      <div className="flex gap-4 p-4 bg-background/60 rounded-xl">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-5 flex-1" />
        ))}
      </div>
      
      {/* 행 */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 bg-background/40 rounded-xl">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// 통계 카드 스켈레톤
export function StatCardSkeleton() {
  return (
    <div className="bg-background/40 border border-primary/20 rounded-2xl p-6 space-y-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-6 rounded" />
        <Skeleton className="h-5 w-20" />
      </div>
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

// 통계 그리드 스켈레톤
export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

