'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import CategoryFilter from '../components/market/CategoryFilter';
import GeneralMarketCard from '../components/market/GeneralMarketCard';
import { useAuth } from '../hooks/useAuth';
import { FaPlus } from 'react-icons/fa';
import { MarketGridSkeleton } from '../components/ui/Skeleton';
import { EmptyMarkets, EmptyFilterResults } from '../components/ui/EmptyState';

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

export default function MarketsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPredictionModal, setShowPredictionModal] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<{ id: string; option: 'yes' | 'no' } | null>(null);

  // 마켓 데이터 가져오기
  const fetchMarkets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        category: selectedCategory,
        limit: '20',
        offset: '0',
      });

      const response = await fetch(`/api/markets?${params}`);
      const data = await response.json();

      if (data.success) {
        setMarkets(data.markets);
      } else {
        console.error('마켓 조회 실패:', data.error);
      }
    } catch (error) {
      console.error('마켓 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkets();
  }, [selectedCategory]);

  // 예측 참여 핸들러
  const handlePredict = async (marketId: string, option: 'yes' | 'no') => {
    if (!isAuthenticated) {
      alert('로그인이 필요합니다.');
      router.push('/auth');
      return;
    }

    setSelectedMarket({ id: marketId, option });
    setShowPredictionModal(true);
  };

  // 예측 제출
  const submitPrediction = async (points: number) => {
    if (!selectedMarket) return;

    try {
      const response = await fetch('/api/predictions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market_id: selectedMarket.id,
          predicted_option: selectedMarket.option,
          points_spent: points,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('예측에 참여했습니다!');
        setShowPredictionModal(false);
        setSelectedMarket(null);
        fetchMarkets(); // 마켓 목록 새로고침
      } else {
        alert(data.error || '예측 참여에 실패했습니다.');
      }
    } catch (error) {
      console.error('예측 제출 오류:', error);
      alert('서버 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 px-3 sm:px-4 md:px-8 py-6 sm:py-12">
        <div className="max-w-7xl mx-auto">
          {/* 페이지 헤더 - 모바일 최적화 */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 sm:mb-12 gap-4 sm:gap-6">
            <div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-1 sm:mb-3">
                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  예측 마켓
                </span>
              </h1>
              <p className="text-foreground/70 text-sm sm:text-lg">
                다양한 이슈에 대해 예측하고 포인트를 획득하세요
              </p>
            </div>

            {isAuthenticated && (
              <button
                onClick={() => router.push('/markets/create')}
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 active:scale-95 text-white px-4 sm:px-8 py-2.5 sm:py-4 rounded-xl sm:rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 sm:gap-3 whitespace-nowrap text-sm sm:text-base btn-press"
              >
                <FaPlus className="text-base sm:text-xl" />
                <span>마켓 만들기</span>
              </button>
            )}
          </div>

          {/* 카테고리 필터 - 모바일 스크롤 */}
          <div className="mb-4 sm:mb-8 -mx-3 sm:mx-0 px-3 sm:px-0 overflow-x-auto scrollbar-hide">
            <CategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          </div>

          {/* 마켓 리스트 */}
          {loading ? (
            <MarketGridSkeleton count={6} />
          ) : markets.length === 0 ? (
            selectedCategory === 'all' ? (
              <EmptyMarkets isAuthenticated={isAuthenticated} />
            ) : (
              <EmptyFilterResults />
            )
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {markets.map((market, index) => (
                <div
                  key={market.id}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <GeneralMarketCard
                    market={market}
                    onPredict={handlePredict}
                  />
                </div>
              ))}
            </div>
          )}

          {/* 예측 참여 모달 */}
          {showPredictionModal && selectedMarket && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-background/95 backdrop-blur-xl border border-primary/20 rounded-3xl p-8 max-w-md w-full shadow-2xl">
                <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  예측 참여
                </h3>
                <p className="text-foreground/70 mb-8">
                  얼마의 포인트를 사용하시겠습니까?
                </p>

                <div className="grid grid-cols-2 gap-3 mb-8">
                  {[10, 50, 100, 500].map((points) => (
                    <button
                      key={points}
                      onClick={() => submitPrediction(points)}
                      className="bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary px-6 py-4 rounded-xl transition-all font-bold text-lg hover:scale-105 hover:shadow-lg hover:shadow-primary/20"
                    >
                      {points}P
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setShowPredictionModal(false);
                    setSelectedMarket(null);
                  }}
                  className="w-full px-6 py-4 bg-muted/50 hover:bg-muted text-foreground/80 hover:text-foreground rounded-xl transition-all font-medium"
                >
                  취소
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
