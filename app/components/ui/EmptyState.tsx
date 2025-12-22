'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  variant?: 'default' | 'compact';
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  variant = 'default',
}: EmptyStateProps) {
  const isCompact = variant === 'compact';

  return (
    <div className={`
      flex flex-col items-center justify-center text-center
      ${isCompact ? 'py-8 sm:py-12' : 'py-16 sm:py-24'}
      opacity-0 animate-fade-in-up
    `}>
      {/* 아이콘 컨테이너 */}
      <div className={`
        relative mb-4 sm:mb-6
        ${isCompact ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-24 h-24 sm:w-32 sm:h-32'}
      `}>
        {/* 배경 글로우 */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-xl animate-pulse-slow" />
        
        {/* 아이콘 원 */}
        <div className={`
          relative w-full h-full
          bg-gradient-to-br from-primary/10 to-secondary/10
          border border-primary/20
          rounded-full
          flex items-center justify-center
          animate-bounce-in
        `}>
          <span className={`${isCompact ? 'text-3xl sm:text-4xl' : 'text-4xl sm:text-6xl'}`}>
            {icon}
          </span>
        </div>
      </div>

      {/* 제목 */}
      <h3 className={`
        font-bold text-foreground/90 mb-2
        ${isCompact ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'}
      `}>
        {title}
      </h3>

      {/* 설명 */}
      {description && (
        <p className={`
          text-foreground/60 max-w-sm mx-auto mb-6
          ${isCompact ? 'text-sm' : 'text-sm sm:text-base'}
        `}>
          {description}
        </p>
      )}

      {/* 액션 버튼 */}
      {(actionLabel && (actionHref || onAction)) && (
        actionHref ? (
          <Link
            href={actionHref}
            className={`
              inline-flex items-center gap-2
              bg-gradient-to-r from-primary to-secondary
              hover:opacity-90 active:scale-95
              text-white font-semibold
              rounded-xl sm:rounded-2xl
              shadow-lg hover:shadow-xl shadow-primary/20
              transition-all btn-press
              ${isCompact ? 'px-4 py-2 text-sm' : 'px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base'}
            `}
          >
            {actionLabel}
          </Link>
        ) : (
          <button
            onClick={onAction}
            className={`
              inline-flex items-center gap-2
              bg-gradient-to-r from-primary to-secondary
              hover:opacity-90 active:scale-95
              text-white font-semibold
              rounded-xl sm:rounded-2xl
              shadow-lg hover:shadow-xl shadow-primary/20
              transition-all btn-press
              ${isCompact ? 'px-4 py-2 text-sm' : 'px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base'}
            `}
          >
            {actionLabel}
          </button>
        )
      )}
    </div>
  );
}

// 미리 정의된 빈 상태들
export function EmptyMarkets({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <EmptyState
      icon="🎯"
      title="마켓이 없습니다"
      description="첫 번째 마켓을 만들어 다른 사람들과 예측을 공유해보세요!"
      actionLabel={isAuthenticated ? "✨ 마켓 만들기" : "🔐 로그인하고 시작하기"}
      actionHref={isAuthenticated ? "/markets/create" : "/auth"}
    />
  );
}

export function EmptyNotifications() {
  return (
    <EmptyState
      icon="🔔"
      title="알림이 없습니다"
      description="마켓에 참여하면 결과 알림을 받을 수 있어요"
      actionLabel="🗳️ 마켓 둘러보기"
      actionHref="/markets"
    />
  );
}

export function EmptyVoteHistory() {
  return (
    <EmptyState
      icon="📊"
      title="아직 투표 내역이 없어요"
      description="다양한 이슈에 대해 예측하고 포인트를 획득해보세요"
      actionLabel="🎯 투표하러 가기"
      actionHref="/markets"
      variant="compact"
    />
  );
}

export function EmptyPointHistory() {
  return (
    <EmptyState
      icon="💰"
      title="포인트 내역이 없어요"
      description="출석체크나 투표 참여로 포인트를 모아보세요"
      variant="compact"
    />
  );
}

export function EmptyRanking() {
  return (
    <EmptyState
      icon="🏆"
      title="아직 랭킹 데이터가 없습니다"
      description="마켓에 참여하고 랭킹에 도전해보세요!"
      actionLabel="🚀 지금 시작하기"
      actionHref="/markets"
    />
  );
}

export function EmptySearchResults({ query }: { query?: string }) {
  return (
    <EmptyState
      icon="🔍"
      title={query ? `"${query}" 검색 결과가 없습니다` : "검색 결과가 없습니다"}
      description="다른 키워드로 검색하거나 필터를 변경해보세요"
      variant="compact"
    />
  );
}

export function EmptyFilterResults() {
  return (
    <EmptyState
      icon="📂"
      title="해당하는 마켓이 없습니다"
      description="다른 카테고리를 선택해보세요"
      actionLabel="🔄 전체 보기"
      actionHref="/markets"
      variant="compact"
    />
  );
}

export function NeedLogin({ message }: { message?: string }) {
  return (
    <EmptyState
      icon="🔐"
      title="로그인이 필요합니다"
      description={message || "이 기능을 사용하려면 로그인해주세요"}
      actionLabel="로그인하기"
      actionHref="/auth"
    />
  );
}

