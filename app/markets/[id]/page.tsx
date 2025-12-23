'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { useAuth } from '../../hooks/useAuth';
import { FaArrowLeft, FaClock, FaUsers, FaCoins, FaSpinner, FaCheckCircle, FaShare, FaComments, FaHistory } from 'react-icons/fa';
import { supabaseClient } from '@/utils/supabase/client';
import { showVoteSuccess, showError, showWarning } from '@/utils/toast';
import { MarketDetailSkeleton } from '../../components/ui/Skeleton';
import ShareModal from '../../components/market/ShareModal';
import CommentSection from '../../components/market/CommentSection';
import ActivitySection from '../../components/market/ActivitySection';

interface MarketDetail {
  id: string;
  title: string;
  description?: string;
  category_slug: string;
  option_yes: string;
  option_no: string;
  total_participants: number;
  yes_count: number;
  no_count: number;
  yes_percentage: number;
  no_percentage: number;
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
  const [submitting, setSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'comments' | 'activity'>('comments');

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

  // 투표 제출 (간소화)
  const handleSubmitVote = async () => {
    // 🔥 임시: 로그인 체크 비활성화 (테스트용)
    /*
    if (!isAuthenticated) {
      alert('로그인이 필요합니다.');
      router.push('/auth');
      return;
    }
    */

    if (!selectedOption) {
      showWarning('Yes 또는 No를 선택해주세요.');
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
        }),
      });

      const data = await response.json();

      if (data.success) {
        showVoteSuccess(selectedOption === 'yes' ? 'YES' : 'NO');
        setHasVoted(true);
        fetchMarketDetail(); // 마켓 정보 새로고침
        
        // 헤더의 포인트를 즉시 갱신
        window.dispatchEvent(new Event('pointsUpdated'));
      } else {
        showError(data.error || '투표 참여에 실패했습니다.');
      }
    } catch (error) {
      console.error('투표 제출 오류:', error);
      showError('서버 오류가 발생했습니다.');
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

  // Yes/No 비율 (DB에서 계산됨)
  const yesPercentage = market?.yes_percentage || 0;
  const noPercentage = market?.no_percentage || 0;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 px-4 md:px-8 py-12">
          <div className="max-w-5xl mx-auto">
            <MarketDetailSkeleton />
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

            {/* 통계 & 공유 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 sm:gap-8 text-foreground/70">
                <div className="flex items-center gap-2">
                  <FaUsers className="text-primary" />
                  <span className="font-semibold">{market.total_participants.toLocaleString()}명 투표</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaCoins className="text-accent" />
                  <span className="font-semibold">참여 +5P / 적중 +20P</span>
                </div>
              </div>

              {/* 공유 버튼 */}
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-all btn-press"
              >
                <FaShare />
                <span className="hidden sm:inline font-medium">공유</span>
              </button>
            </div>
          </div>

          {/* 결과 확정 표시 */}
          {market.result && (
            <div className="bg-gradient-to-br from-accent/20 to-accent/5 border-2 border-accent/40 rounded-3xl p-8 mb-8">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">🏆</div>
                <h2 className="text-3xl font-bold text-foreground/90 mb-2">
                  확정 결과
                </h2>
                <p className="text-accent font-bold text-2xl">
                  {market.result === 'yes' ? 'YES' : 'NO'} 승리!
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className={`text-center p-4 rounded-xl ${market.result === 'yes' ? 'bg-primary/20 border-2 border-primary' : 'opacity-50'}`}>
                  <div className="text-sm text-foreground/70 mb-1">YES</div>
                  <div className="text-2xl font-bold text-primary">{yesPercentage.toFixed(1)}%</div>
                  {market.result === 'yes' && (
                    <div className="text-xs text-primary font-bold mt-2">✅ 당첨!</div>
                  )}
                </div>
                <div className={`text-center p-4 rounded-xl ${market.result === 'no' ? 'bg-secondary/20 border-2 border-secondary' : 'opacity-50'}`}>
                  <div className="text-sm text-foreground/70 mb-1">NO</div>
                  <div className="text-2xl font-bold text-secondary">{noPercentage.toFixed(1)}%</div>
                  {market.result === 'no' && (
                    <div className="text-xs text-secondary font-bold mt-2">✅ 당첨!</div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-accent/20 text-center">
                <p className="text-foreground/70">
                  당첨자: <span className="font-bold text-accent">{market.result === 'yes' ? market.yes_count : market.no_count}명</span>
                </p>
                <p className="text-foreground/70">
                  총 지급 포인트: <span className="font-bold text-accent">{(market.result === 'yes' ? market.yes_count : market.no_count) * 20}P</span>
                </p>
              </div>
            </div>
          )}

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
                  {market.yes_count.toLocaleString()}명 투표
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
                  {market.no_count.toLocaleString()}명 투표
                </div>
              </div>

              {/* 배경 진행 바 */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-secondary/30 to-transparent transition-all duration-500"
                style={{ width: `${noPercentage}%` }}
              />
            </button>
          </div>

          {/* 투표 제출 버튼 */}
          {/* 🔥 임시: isAuthenticated 체크 비활성화 */}
          {!market.is_closed && !hasVoted && (
            <div className="bg-background/40 backdrop-blur-xl border border-primary/20 rounded-3xl p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-3 text-foreground/90">
                  {selectedOption ? '투표를 확정하시겠습니까?' : 'YES 또는 NO를 선택하세요'}
                </h3>
                <div className="flex items-center justify-center gap-3 text-accent font-semibold">
                  <span className="text-lg">💰 참여 보상: +5P (즉시)</span>
                  <span className="text-foreground/40">|</span>
                  <span className="text-lg">🎯 적중 보상: +20P (결과 확정 후)</span>
                </div>
              </div>

              <button
                onClick={handleSubmitVote}
                disabled={!selectedOption || submitting}
                className="w-full px-8 py-6 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white rounded-2xl transition-all font-bold text-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-2xl shadow-primary/30"
              >
                {submitting ? (
                  <>
                    <FaSpinner className="animate-spin text-2xl" />
                    <span>처리 중...</span>
                  </>
                ) : (
                  <span>
                    {selectedOption === 'yes' && '✅ YES로 투표하기'}
                    {selectedOption === 'no' && '✅ NO로 투표하기'}
                    {!selectedOption && '위에서 YES 또는 NO를 선택하세요'}
                  </span>
                )}
              </button>

              <p className="text-center text-foreground/50 text-sm mt-4">
                ⚠️ 1인 1표 제한 | 하루 최대 10회 투표 가능
              </p>
            </div>
          )}

          {/* 투표 완료 */}
          {!market.is_closed && hasVoted && (
            <div className="bg-primary/10 backdrop-blur-xl border border-primary/30 rounded-3xl p-8 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-2xl font-bold mb-2 text-foreground/90">
                투표 완료!
              </h3>
              <p className="text-foreground/60 mb-4">
                +5P가 적립되었습니다. 결과 확정 후 적중 시 +20P가 추가 지급됩니다.
              </p>
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

          {/* 댓글 & 액티비티 탭 */}
          <div className="mt-8 bg-background/40 backdrop-blur-xl border border-primary/20 rounded-3xl overflow-hidden">
            {/* 탭 헤더 */}
            <div className="flex border-b border-primary/20">
              <button
                onClick={() => setActiveTab('comments')}
                className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 font-semibold transition-all ${
                  activeTab === 'comments'
                    ? 'bg-primary/10 text-primary border-b-2 border-primary'
                    : 'text-foreground/60 hover:bg-primary/5 hover:text-foreground/80'
                }`}
              >
                <FaComments />
                <span>댓글</span>
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 font-semibold transition-all ${
                  activeTab === 'activity'
                    ? 'bg-primary/10 text-primary border-b-2 border-primary'
                    : 'text-foreground/60 hover:bg-primary/5 hover:text-foreground/80'
                }`}
              >
                <FaHistory />
                <span>투표 기록</span>
              </button>
            </div>

            {/* 탭 컨텐츠 */}
            <div className="p-6">
              {activeTab === 'comments' ? (
                <CommentSection marketId={marketId} />
              ) : (
                <ActivitySection marketId={marketId} />
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* 공유 모달 */}
      {market && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          market={market}
        />
      )}
    </div>
  );
}
