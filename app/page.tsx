'use client';

import { useEffect, useState } from 'react';
import { supabaseClient } from '../utils/supabase/client';
import { useAuth } from './hooks/useAuth';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import GeneralMarketCard from './components/market/GeneralMarketCard';
import Link from 'next/link';
import { FaArrowRight, FaChartLine, FaTrophy, FaUsers, FaCoins } from 'react-icons/fa';

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

interface Stats {
  totalUsers: number;
  totalMarkets: number;
  totalPredictions: number;
  totalPoints: number;
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [trendingMarkets, setTrendingMarkets] = useState<Market[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 인기 마켓 가져오기
      const marketsResponse = await fetch('/api/markets?category=all&limit=6&offset=0');
      if (marketsResponse.ok) {
        const marketsData = await marketsResponse.json();
        setTrendingMarkets(marketsData.markets || []);
      }

      // 통계 가져오기 (임시 데이터)
      setStats({
        totalUsers: 15234,
        totalMarkets: 1247,
        totalPredictions: 45678,
        totalPoints: 8934567,
      });
    } catch (error) {
      console.error('데이터 로딩 중 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-foreground/70 font-medium">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-grow">
        {/* 히어로 섹션 */}
        <section className="relative px-4 md:px-8 py-16 md:py-24 overflow-hidden">
          {/* 배경 그라데이션 */}
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-purple-900/20"></div>
          
          {/* 배경 장식 */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>
          
          <div className="relative max-w-6xl mx-auto text-center">
            {/* 상단 배지 */}
            <div className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full text-primary font-semibold text-sm backdrop-blur-md">
                <span>🔥</span>
                <span>한국형 예측 마켓 플랫폼</span>
              </span>
            </div>

            {/* 메인 헤딩 */}
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              <span className="text-foreground">미래를 예측하고</span>
              <br />
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                포인트를 획득하세요
              </span>
            </h1>
            
            {/* 서브 헤딩 */}
            <p className="text-lg md:text-xl text-foreground/70 leading-relaxed max-w-2xl mx-auto mb-10">
              정치, 경제, 연예, 스포츠 등 다양한 이슈에 대해 예측하고
              <br className="hidden md:block" />
              커뮤니티와 함께 인사이트를 공유하세요
            </p>

            {/* CTA 버튼 */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              {isAuthenticated ? (
                <Link 
                  href="/markets"
                  className="group bg-gradient-to-r from-primary to-secondary hover:shadow-xl text-white px-8 py-4 rounded-2xl font-bold transition-all flex items-center gap-2 hover:scale-105"
                >
                  <span className="text-white">마켓 둘러보기</span>
                  <FaArrowRight className="text-white group-hover:translate-x-1 transition-transform text-sm" />
                </Link>
              ) : (
                <Link 
                  href="/auth"
                  className="group bg-gradient-to-r from-primary to-secondary hover:shadow-xl text-white px-8 py-4 rounded-2xl font-bold transition-all flex items-center gap-2 hover:scale-105"
                >
                  <span className="text-white">무료로 시작하기</span>
                  <FaArrowRight className="text-white group-hover:translate-x-1 transition-transform text-sm" />
                </Link>
              )}
              <Link 
                href="/markets"
                className="group border-2 border-primary/40 bg-primary/5 hover:bg-primary/10 text-foreground px-8 py-4 rounded-2xl font-semibold hover:border-primary/60 transition-all backdrop-blur-md flex items-center gap-2"
              >
                <span>마켓 탐색</span>
                <FaArrowRight className="text-primary group-hover:translate-x-1 transition-transform text-sm" />
              </Link>
            </div>

            {/* 실시간 통계 */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                <div className="bg-background/60 backdrop-blur-xl border border-primary/20 rounded-2xl p-6 hover:border-primary/40 transition-all">
                  <div className="flex items-center justify-center mb-3">
                    <FaUsers className="text-2xl text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {stats.totalUsers.toLocaleString()}
                  </div>
                  <div className="text-foreground/60 text-sm">활동 유저</div>
                </div>
                <div className="bg-background/60 backdrop-blur-xl border border-secondary/20 rounded-2xl p-6 hover:border-secondary/40 transition-all">
                  <div className="flex items-center justify-center mb-3">
                    <FaChartLine className="text-2xl text-secondary" />
                  </div>
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {stats.totalMarkets.toLocaleString()}
                  </div>
                  <div className="text-foreground/60 text-sm">진행 중 마켓</div>
                </div>
                <div className="bg-background/60 backdrop-blur-xl border border-accent/20 rounded-2xl p-6 hover:border-accent/40 transition-all">
                  <div className="flex items-center justify-center mb-3">
                    <FaTrophy className="text-2xl text-accent" />
                  </div>
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {stats.totalPredictions.toLocaleString()}
                  </div>
                  <div className="text-foreground/60 text-sm">총 예측 수</div>
                </div>
                <div className="bg-background/60 backdrop-blur-xl border border-primary/20 rounded-2xl p-6 hover:border-primary/40 transition-all">
                  <div className="flex items-center justify-center mb-3">
                    <FaCoins className="text-2xl text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {(stats.totalPoints / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-foreground/60 text-sm">포인트 거래량</div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 인기 마켓 섹션 */}
        {trendingMarkets.length > 0 && (
          <section className="px-4 md:px-8 py-16 bg-gradient-to-b from-background/50 to-background">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-end justify-between mb-10">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🔥</span>
                    <h2 className="text-3xl md:text-4xl font-bold">
                      <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                        인기 마켓
                      </span>
                    </h2>
                  </div>
                  <p className="text-foreground/70">
                    지금 가장 핫한 예측 마켓을 확인하세요
                  </p>
                </div>
                <Link 
                  href="/markets"
                  className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 hover:border-primary/50 rounded-xl text-primary transition-all font-semibold text-sm group"
                >
                  <span>전체 보기</span>
                  <FaArrowRight className="text-xs group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {trendingMarkets.map((market) => (
                  <GeneralMarketCard
                    key={market.id}
                    market={market}
                    showActions={false}
                  />
                ))}
              </div>

              <div className="text-center md:hidden">
                <Link 
                  href="/markets"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 hover:bg-primary/20 border border-primary/30 hover:border-primary/50 rounded-xl text-primary transition-all font-semibold"
                >
                  <span>전체 마켓 보기</span>
                  <FaArrowRight className="text-sm" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* 카테고리 섹션 */}
        <section className="px-4 md:px-8 py-16">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">
                <span className="text-foreground">다양한 카테고리의 </span>
                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  예측 마켓
                </span>
              </h2>
              <p className="text-foreground/70">
                관심 있는 분야를 선택하고 예측에 참여하세요
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { slug: 'politics', name: '정치', icon: '🏛️', color: 'from-blue-500 to-indigo-600' },
                { slug: 'economy', name: '경제', icon: '💰', color: 'from-green-500 to-emerald-600' },
                { slug: 'entertainment', name: '연예', icon: '🎬', color: 'from-pink-500 to-rose-600' },
                { slug: 'sports', name: '스포츠', icon: '⚽', color: 'from-red-500 to-orange-600' },
                { slug: 'society', name: '사회', icon: '🌐', color: 'from-purple-500 to-violet-600' },
                { slug: 'tech', name: 'IT/기술', icon: '💻', color: 'from-cyan-500 to-blue-600' },
              ].map((category) => (
                <Link
                  key={category.slug}
                  href={`/markets?category=${category.slug}`}
                  className="group bg-background/60 backdrop-blur-xl border border-primary/20 hover:border-primary/40 rounded-2xl p-6 transition-all hover:scale-105"
                >
                  <div className="text-center">
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                      {category.icon}
                    </div>
                    <div className={`font-bold bg-gradient-to-r ${category.color} bg-clip-text text-transparent`}>
                      {category.name}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>


        {/* CTA 섹션 */}
        {!isAuthenticated && (
          <section className="px-4 md:px-8 py-16">
            <div className="max-w-4xl mx-auto text-center">
              <div className="relative bg-gradient-to-r from-primary via-secondary to-accent rounded-3xl p-12 md:p-16 shadow-2xl overflow-hidden">
                {/* 배경 장식 */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                
                <div className="relative z-10">
                  <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                    지금 시작하세요
                  </h2>
                  <p className="text-white/95 text-lg mb-8 leading-relaxed">
                    무료로 가입하고 <span className="font-bold text-white">1000 포인트</span>를 받아
                    <br className="hidden md:block" />
                    첫 예측을 시작해보세요
                  </p>
                  <Link 
                    href="/auth"
                    className="inline-flex items-center gap-2 bg-white text-primary hover:bg-white/95 px-8 py-4 rounded-2xl font-bold transition-all hover:scale-105 group"
                  >
                    <span className="text-primary">무료로 시작하기</span>
                    <FaArrowRight className="text-primary text-sm group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
