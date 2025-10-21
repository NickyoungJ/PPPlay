'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { useAuth } from '../../hooks/useAuth';
import { FaArrowLeft, FaClock, FaUsers, FaCoins, FaSpinner, FaCheckCircle } from 'react-icons/fa';
import { supabaseClient } from '@/utils/supabase/client';

interface MarketDetail {
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
  yes_points: number;
  no_points: number;
  closes_at: string;
  is_closed: boolean;
  result?: string;
  created_at: string;
}

export default function MarketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated } = useAuth();
  const marketId = params?.id as string;

  const [market, setMarket] = useState<MarketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<'yes' | 'no' | null>(null);
  const [pointsToSpend, setPointsToSpend] = useState(10);
  const [submitting, setSubmitting] = useState(false);

  // 마켓 상세 정보 가져오기
  const fetchMarketDetail = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('markets')
        .select('*')
        .eq('id', marketId)
        .single();

      if (error) {
        console.error('마켓 조회 오류:', error);
        return;
      }

      setMarket(data);
    } catch (error) {
      console.error('마켓 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (marketId) {
      fetchMarketDetail();
    }
  }, [marketId]);

  // 예측 제출
  const handleSubmitPrediction = async () => {
    if (!isAuthenticated) {
      alert('로그인이 필요합니다.');
      router.push('/auth');
      return;
    }

    if (!selectedOption) {
      alert('Yes 또는 No를 선택해주세요.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/predictions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market_id: marketId,
          predicted_option: selectedOption,
          points_spent: pointsToSpend,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('예측에 참여했습니다!');
        fetchMarketDetail(); // 마켓 정보 새로고침
        setSelectedOption(null);
      } else {
        alert(data.error || '예측 참여에 실패했습니다.');
      }
    } catch (error) {
      console.error('예측 제출 오류:', error);
      alert('서버 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 카테고리 정보
  const getCategoryInfo = (slug: string) => {
    const categories: { [key: string]: { name: string; icon: string; color: string } } = {
      politics: { name: '정치', icon: '🏛️', color: 'from-blue-500 to-indigo-600' },
      economy: { name: '경제', icon: '💰', color: 'from-green-500 to-emerald-600' },
      entertainment: { name: '연예', icon: '🎬', color: 'from-pink-500 to-rose-600' },
      society: { name: '사회', icon: '🌐', color: 'from-purple-500 to-violet-600' },
      tech: { name: 'IT/기술', icon: '💻', color: 'from-cyan-500 to-blue-600' },
    };
    return categories[slug] || { name: slug, icon: '📊', color: 'from-gray-500 to-gray-600' };
  };

  // 마감 시간 포맷
  const getTimeRemaining = () => {
    if (!market) return '';
    
    const now = new Date();
    const closes = new Date(market.closes_at);
    const diff = closes.getTime() - now.getTime();

    if (diff <= 0) return '마감됨';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}일 ${hours}시간 남음`;
    if (hours > 0) return `${hours}시간 ${minutes}분 남음`;
    return `${minutes}분 남음`;
  };

  // Yes/No 비율 계산
  const yesPercentage = market && market.total_participants > 0
    ? (market.yes_count / market.total_participants) * 100
    : 50;
  const noPercentage = 100 - yesPercentage;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FaSpinner className="animate-spin text-5xl text-primary mx-auto mb-4" />
            <p className="text-foreground/70">마켓을 불러오는 중...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!market) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">😢</div>
            <h2 className="text-2xl font-bold text-foreground/90 mb-4">
              마켓을 찾을 수 없습니다
            </h2>
            <button
              onClick={() => router.push('/markets')}
              className="mt-4 px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl hover:opacity-90 transition-all font-semibold"
            >
              마켓 목록으로
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const categoryInfo = getCategoryInfo(market.category_slug);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 px-4 md:px-8 py-12">
        <div className="max-w-5xl mx-auto">
          {/* 뒤로 가기 */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-foreground/70 hover:text-primary transition-colors mb-8 font-medium"
          >
            <FaArrowLeft />
            <span>돌아가기</span>
          </button>

          {/* 마켓 헤더 */}
          <div className="bg-background/40 backdrop-blur-xl border border-primary/20 rounded-3xl p-8 mb-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{categoryInfo.icon}</span>
                <span className={`px-5 py-2 bg-gradient-to-r ${categoryInfo.color} text-white text-sm rounded-full font-semibold`}>
                  {categoryInfo.name}
                </span>
              </div>
              <div className="flex items-center gap-2 text-accent font-bold">
                <FaClock />
                <span>{getTimeRemaining()}</span>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
              {market.title}
            </h1>

            {market.description && (
              <p className="text-foreground/70 text-lg mb-6 leading-relaxed">
                {market.description}
              </p>
            )}

            {/* 통계 */}
            <div className="flex items-center gap-8 text-foreground/70">
              <div className="flex items-center gap-2">
                <FaUsers className="text-primary" />
                <span className="font-semibold">{market.total_participants.toLocaleString()}명 참여</span>
              </div>
              <div className="flex items-center gap-2">
                <FaCoins className="text-accent" />
                <span className="font-semibold">{market.total_points_pool.toLocaleString()}P</span>
              </div>
            </div>
          </div>

          {/* Yes/No 투표 섹션 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Yes */}
            <button
              onClick={() => !market.is_closed && setSelectedOption('yes')}
              disabled={market.is_closed}
              className={`
                relative overflow-hidden rounded-3xl p-8 border-4 transition-all duration-300
                ${selectedOption === 'yes' ? 'border-primary shadow-2xl shadow-primary/30 scale-[1.02]' : 'border-primary/30'}
                ${market.is_closed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary hover:scale-[1.02]'}
                bg-gradient-to-br from-primary/10 to-transparent
              `}
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-foreground/70">YES</span>
                  {selectedOption === 'yes' && (
                    <FaCheckCircle className="text-primary text-3xl" />
                  )}
                </div>
                <div className="text-5xl font-bold text-primary mb-4">
                  {yesPercentage.toFixed(1)}%
                </div>
                <div className="text-foreground font-semibold text-lg mb-4">
                  {market.option_yes}
                </div>
                <div className="text-sm text-foreground/60">
                  {market.yes_count}명 • {market.yes_points.toLocaleString()}P
                </div>
              </div>

              {/* 배경 진행 바 */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-primary/30 to-transparent transition-all duration-500"
                style={{ width: `${yesPercentage}%` }}
              />
            </button>

            {/* No */}
            <button
              onClick={() => !market.is_closed && setSelectedOption('no')}
              disabled={market.is_closed}
              className={`
                relative overflow-hidden rounded-3xl p-8 border-4 transition-all duration-300
                ${selectedOption === 'no' ? 'border-secondary shadow-2xl shadow-secondary/30 scale-[1.02]' : 'border-secondary/30'}
                ${market.is_closed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-secondary hover:scale-[1.02]'}
                bg-gradient-to-br from-secondary/10 to-transparent
              `}
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-foreground/70">NO</span>
                  {selectedOption === 'no' && (
                    <FaCheckCircle className="text-secondary text-3xl" />
                  )}
                </div>
                <div className="text-5xl font-bold text-secondary mb-4">
                  {noPercentage.toFixed(1)}%
                </div>
                <div className="text-foreground font-semibold text-lg mb-4">
                  {market.option_no}
                </div>
                <div className="text-sm text-foreground/60">
                  {market.no_count}명 • {market.no_points.toLocaleString()}P
                </div>
              </div>

              {/* 배경 진행 바 */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-secondary/30 to-transparent transition-all duration-500"
                style={{ width: `${noPercentage}%` }}
              />
            </button>
          </div>

          {/* 포인트 선택 & 제출 */}
          {!market.is_closed && isAuthenticated && (
            <div className="bg-background/40 backdrop-blur-xl border border-primary/20 rounded-3xl p-8">
              <h3 className="text-xl font-bold mb-6 text-foreground/90">얼마를 베팅하시겠습니까?</h3>
              
              <div className="grid grid-cols-4 gap-3 mb-6">
                {[10, 50, 100, 500].map((points) => (
                  <button
                    key={points}
                    onClick={() => setPointsToSpend(points)}
                    className={`
                      px-6 py-4 rounded-2xl font-bold text-lg transition-all
                      ${pointsToSpend === points 
                        ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg scale-105' 
                        : 'bg-primary/10 border border-primary/30 text-foreground/80 hover:text-primary hover:border-primary/50'
                      }
                    `}
                  >
                    {points}P
                  </button>
                ))}
              </div>

              <button
                onClick={handleSubmitPrediction}
                disabled={!selectedOption || submitting}
                className="w-full px-8 py-5 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white rounded-2xl transition-all font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-primary/20"
              >
                {submitting ? (
                  <>
                    <FaSpinner className="animate-spin text-xl" />
                    <span>처리 중...</span>
                  </>
                ) : (
                  <span>
                    {selectedOption === 'yes' && `Yes에 ${pointsToSpend}P 베팅`}
                    {selectedOption === 'no' && `No에 ${pointsToSpend}P 베팅`}
                    {!selectedOption && 'Yes 또는 No를 선택하세요'}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* 마감된 마켓 */}
          {market.is_closed && market.result && (
            <div className="bg-muted/50 backdrop-blur-xl border border-primary/20 rounded-3xl p-8 text-center">
              <div className="text-5xl mb-4">
                {market.result === 'yes' ? '🎉' : '😔'}
              </div>
              <h3 className="text-2xl font-bold mb-2 text-foreground/90">
                결과: {market.result === 'yes' ? 'Yes' : 'No'}
              </h3>
              <p className="text-foreground/60">
                이 마켓은 마감되었습니다.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
