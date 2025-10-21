'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaClock, FaUsers, FaCoins } from 'react-icons/fa';

interface Market {
  id: string;
  title: string;
  description?: string;
  category_slug: string;
  option_yes: string;
  option_no: string;
  total_participants: number;
  total_points_pool: number;
  yes_count: number;
  no_count: number;
  yes_percentage: number;
  no_percentage: number;
  closes_at: string;
  created_at: string;
}

interface GeneralMarketCardProps {
  market: Market;
  onPredict?: (marketId: string, option: 'yes' | 'no') => void;
  showActions?: boolean;
}

export default function GeneralMarketCard({
  market,
  onPredict,
  showActions = true,
}: GeneralMarketCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 카테고리 아이콘 매핑
  const getCategoryIcon = (slug: string) => {
    const icons: { [key: string]: string } = {
      politics: '🏛️',
      economy: '💰',
      entertainment: '🎬',
      society: '🌐',
      tech: '💻',
    };
    return icons[slug] || '📊';
  };

  // 카테고리 색상 매핑
  const getCategoryColor = (slug: string) => {
    const colors: { [key: string]: string } = {
      politics: 'from-blue-500 to-indigo-600',
      economy: 'from-green-500 to-emerald-600',
      entertainment: 'from-pink-500 to-rose-600',
      society: 'from-purple-500 to-violet-600',
      tech: 'from-cyan-500 to-blue-600',
    };
    return colors[slug] || 'from-gray-500 to-gray-600';
  };

  // 마감 시간 포맷
  const getTimeRemaining = () => {
    const now = new Date();
    const closes = new Date(market.closes_at);
    const diff = closes.getTime() - now.getTime();

    if (diff <= 0) return '마감됨';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}일 ${hours}시간`;
    if (hours > 0) return `${hours}시간 ${minutes}분`;
    return `${minutes}분`;
  };

  return (
    <div className="group bg-background/40 backdrop-blur-xl border border-primary/20 rounded-3xl p-6 hover:border-primary/40 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/10">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getCategoryIcon(market.category_slug)}</span>
          <span className={`px-4 py-1 bg-gradient-to-r ${getCategoryColor(market.category_slug)} text-white text-sm rounded-full font-semibold`}>
            {market.category_slug === 'politics' && '정치'}
            {market.category_slug === 'economy' && '경제'}
            {market.category_slug === 'entertainment' && '연예'}
            {market.category_slug === 'society' && '사회'}
            {market.category_slug === 'tech' && 'IT/기술'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-accent font-semibold">
          <FaClock className="text-sm" />
          <span className="text-sm">{getTimeRemaining()}</span>
        </div>
      </div>

      {/* 제목 */}
      <Link href={`/markets/${market.id}`}>
        <h3 className="text-xl font-bold text-foreground mb-3 hover:text-primary transition-colors cursor-pointer line-clamp-2 leading-tight">
          {market.title}
        </h3>
      </Link>

      {/* 설명 */}
      {market.description && (
        <p className="text-foreground/60 text-sm mb-5 line-clamp-2">
          {market.description}
        </p>
      )}

      {/* Yes/No 투표 섹션 */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {/* Yes 옵션 */}
        <button
          className={`
            relative overflow-hidden rounded-2xl border-2 p-4
            ${showActions ? 'cursor-pointer hover:border-primary hover:shadow-lg hover:shadow-primary/20 hover:scale-105' : ''}
            transition-all duration-200 border-primary/30 bg-gradient-to-br from-primary/10 to-transparent
          `}
          onClick={() => showActions && onPredict && onPredict(market.id, 'yes')}
        >
          <div className="relative z-10">
            <div className="text-xs text-foreground/60 mb-1 font-semibold">YES</div>
            <div className="text-2xl font-bold text-primary mb-2">
              {market.yes_percentage.toFixed(1)}%
            </div>
            <div className="text-xs text-foreground/80 font-medium line-clamp-2">
              {market.option_yes}
            </div>
          </div>
          
          {/* 배경 진행 바 */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/5 transition-all duration-500"
            style={{ width: `${market.yes_percentage}%` }}
          />
        </button>

        {/* No 옵션 */}
        <button
          className={`
            relative overflow-hidden rounded-2xl border-2 p-4
            ${showActions ? 'cursor-pointer hover:border-secondary hover:shadow-lg hover:shadow-secondary/20 hover:scale-105' : ''}
            transition-all duration-200 border-secondary/30 bg-gradient-to-br from-secondary/10 to-transparent
          `}
          onClick={() => showActions && onPredict && onPredict(market.id, 'no')}
        >
          <div className="relative z-10">
            <div className="text-xs text-foreground/60 mb-1 font-semibold">NO</div>
            <div className="text-2xl font-bold text-secondary mb-2">
              {market.no_percentage.toFixed(1)}%
            </div>
            <div className="text-xs text-foreground/80 font-medium line-clamp-2">
              {market.option_no}
            </div>
          </div>
          
          {/* 배경 진행 바 */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-secondary/20 to-secondary/5 transition-all duration-500"
            style={{ width: `${market.no_percentage}%` }}
          />
        </button>
      </div>

      {/* 통계 */}
      <div className="flex items-center justify-between text-sm text-foreground/60 pt-4 border-t border-primary/10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <FaUsers className="text-primary" />
            <span className="font-medium">{market.total_participants.toLocaleString()}명</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FaCoins className="text-accent" />
            <span className="font-medium">{market.total_points_pool.toLocaleString()}P</span>
          </div>
        </div>
      </div>
    </div>
  );
}
