'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
// import { useAuth } from '../../hooks/useAuth'; // 🔥 임시: 리다이렉트 방지를 위해 주석 처리
import { FaArrowLeft, FaSpinner, FaCheckCircle, FaClock } from 'react-icons/fa';
import { supabaseClient } from '@/utils/supabase/client';
import { showSuccess, showError, showWarning } from '@/utils/toast';

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
  closes_at: string;
  is_closed: boolean;
  result?: string;
  status: string;
}

export default function SettleMarketsPage() {
  const router = useRouter();
  // const { isAuthenticated } = useAuth(); // 🔥 임시: useAuth 주석 처리

  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [settlingId, setSettlingId] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<{ [key: string]: 'yes' | 'no' | 'cancelled' }>({});

  useEffect(() => {
    // 🔥 임시: 관리자 인증 비활성화 (테스트용)
    fetchClosedMarkets();
  }, []);

  const fetchClosedMarkets = async () => {
    setLoading(true);
    try {
      // 마감되었지만 결과가 확정되지 않은 마켓 조회
      const { data, error } = await supabaseClient
        .from('markets')
        .select('*')
        .lte('closes_at', new Date().toISOString())
        .is('result', null)
        .in('status', ['approved', 'active'])
        .order('closes_at', { ascending: true });

      if (error) {
        console.error('마켓 조회 오류:', error);
        showError('마켓을 불러올 수 없습니다.');
        return;
      }

      setMarkets(data || []);
    } catch (error) {
      console.error('마켓 조회 오류:', error);
      showError('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSettle = async (marketId: string) => {
    const result = selectedResult[marketId];
    if (!result) {
      showWarning('결과를 선택해주세요.');
      return;
    }

    const description = prompt('결과 설명을 입력하세요 (선택):');
    
    if (!confirm(`이 마켓의 결과를 "${result === 'yes' ? 'Yes' : result === 'no' ? 'No' : '취소'}"로 확정하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    setSettlingId(marketId);
    try {
      const response = await fetch('/api/admin/markets/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market_id: marketId,
          result,
          description,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showSuccess('마켓 결과가 확정되고 정산이 완료되었습니다! 🎉');
        fetchClosedMarkets();
      } else {
        console.error('❌ 정산 실패:', data);
        showError(`결과 확정에 실패했습니다: ${data.error}`);
      }
    } catch (error) {
      console.error('결과 확정 오류:', error);
      showError('서버 오류가 발생했습니다.');
    } finally {
      setSettlingId(null);
    }
  };

  const handleResultSelect = (marketId: string, result: 'yes' | 'no' | 'cancelled') => {
    setSelectedResult({ ...selectedResult, [marketId]: result });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 px-4 md:px-8 py-12">
        <div className="max-w-5xl mx-auto">
          {/* 뒤로 가기 */}
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center gap-2 text-foreground/70 hover:text-primary transition-colors mb-8 font-medium"
          >
            <FaArrowLeft />
            <span>관리자 대시보드로</span>
          </button>

          {/* 페이지 헤더 */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                마켓 결과 확정 ⚖️
              </span>
            </h1>
            <p className="text-foreground/70 text-lg">
              마감된 마켓의 결과를 확정하고 자동으로 정산하세요
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <FaSpinner className="animate-spin text-5xl text-primary mx-auto mb-4" />
                <p className="text-foreground/70">마켓을 불러오는 중...</p>
              </div>
            </div>
          ) : markets.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-6xl">✅</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground/90 mb-3">
                결과 확정이 필요한 마켓이 없습니다
              </h3>
              <p className="text-foreground/60 mb-6">
                모든 마켓이 처리되었습니다
              </p>
              <button
                onClick={() => router.push('/markets')}
                className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:opacity-90 transition-all font-semibold"
              >
                마켓 둘러보기
              </button>
            </div>
          ) : (
          <div className="space-y-6">
            {markets.map((market) => {
              const yesPercentage = market.total_participants > 0
                ? (market.yes_count / market.total_participants) * 100
                : 50;
              const noPercentage = 100 - yesPercentage;

              return (
                <div key={market.id} className="bg-background/40 backdrop-blur-xl border border-primary/20 rounded-3xl p-8 hover:border-primary/40 transition-all">
                  {/* 마켓 정보 */}
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-4 py-1.5 bg-gradient-to-r from-primary/20 to-secondary/20 text-foreground/90 text-sm rounded-full font-semibold">
                        {market.category_slug}
                      </span>
                      <span className="flex items-center gap-2 text-accent text-sm font-semibold">
                        <FaClock />
                        마감: {new Date(market.closes_at).toLocaleDateString('ko-KR')}
                      </span>
                    </div>

                    <h3 className="text-2xl md:text-3xl font-bold text-foreground/90 mb-3 leading-tight">
                      {market.title}
                    </h3>

                    {market.description && (
                      <p className="text-foreground/60 mb-4 leading-relaxed">{market.description}</p>
                    )}

                    <div className="flex items-center gap-6 text-sm text-foreground/70">
                      <span className="font-semibold">👥 {market.total_participants}명 투표</span>
                      <span>•</span>
                      <span className="font-semibold">예상 지급: {(market.yes_count > market.no_count ? market.yes_count : market.no_count) * 20}P</span>
                    </div>
                  </div>

                  {/* 현재 비율 */}
                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 rounded-2xl p-6">
                      <div className="text-xs text-foreground/60 mb-1 font-semibold">YES</div>
                      <div className="text-4xl font-bold text-primary mb-2">
                        {yesPercentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-foreground/80 font-semibold mb-3">
                        {market.option_yes}
                      </div>
                      <div className="text-xs text-foreground/60">
                        {market.yes_count}명 투표 • 예상 지급: {market.yes_count * 20}P
                      </div>
                    </div>

                    <div className="relative overflow-hidden bg-gradient-to-br from-secondary/10 to-secondary/5 border-2 border-secondary/30 rounded-2xl p-6">
                      <div className="text-xs text-foreground/60 mb-1 font-semibold">NO</div>
                      <div className="text-4xl font-bold text-secondary mb-2">
                        {noPercentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-foreground/80 font-semibold mb-3">
                        {market.option_no}
                      </div>
                      <div className="text-xs text-foreground/60">
                        {market.no_count}명 투표 • 예상 지급: {market.no_count * 20}P
                      </div>
                    </div>
                  </div>

                  {/* 결과 선택 */}
                  <div className="border-t border-primary/10 pt-8">
                    <h4 className="text-xl font-bold text-foreground/90 mb-6 flex items-center gap-2">
                      <span>⚖️</span>
                      <span>결과 선택</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <button
                        onClick={() => handleResultSelect(market.id, 'yes')}
                        className={`px-8 py-6 rounded-2xl border-3 transition-all font-bold text-lg ${
                          selectedResult[market.id] === 'yes'
                            ? 'border-primary bg-primary/20 text-primary shadow-2xl shadow-primary/30 scale-[1.02]'
                            : 'border-primary/30 text-foreground/70 hover:border-primary hover:bg-primary/10 hover:scale-[1.02]'
                        }`}
                      >
                        <FaCheckCircle className="inline mr-2 text-2xl" />
                        YES 승리
                      </button>
                      <button
                        onClick={() => handleResultSelect(market.id, 'no')}
                        className={`px-8 py-6 rounded-2xl border-3 transition-all font-bold text-lg ${
                          selectedResult[market.id] === 'no'
                            ? 'border-secondary bg-secondary/20 text-secondary shadow-2xl shadow-secondary/30 scale-[1.02]'
                            : 'border-secondary/30 text-foreground/70 hover:border-secondary hover:bg-secondary/10 hover:scale-[1.02]'
                        }`}
                      >
                        <FaCheckCircle className="inline mr-2 text-2xl" />
                        NO 승리
                      </button>
                    </div>

                    <button
                      onClick={() => handleSettle(market.id)}
                      disabled={!selectedResult[market.id] || settlingId === market.id}
                      className="w-full px-8 py-5 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl hover:opacity-90 transition-all font-bold text-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-2xl shadow-primary/30"
                    >
                      {settlingId === market.id ? (
                        <>
                          <FaSpinner className="animate-spin text-2xl" />
                          <span>정산 처리 중...</span>
                        </>
                      ) : (
                        <>
                          <FaCheckCircle className="text-2xl" />
                          <span>결과 확정 및 자동 정산</span>
                        </>
                      )}
                    </button>

                    {/* 경고 */}
                    <div className="mt-6 p-5 bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl">
                      <p className="text-sm text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-2">
                        <span className="text-xl">⚠️</span>
                        <span>결과 확정 후에는 되돌릴 수 없습니다. 신중하게 선택해주세요.</span>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

