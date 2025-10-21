'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { useAuth } from '../../hooks/useAuth';
import { FaArrowLeft, FaSpinner, FaCheckCircle, FaClock } from 'react-icons/fa';
import { supabaseClient } from '@/utils/supabase/client';

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
  const { isAuthenticated } = useAuth();

  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [settlingId, setSettlingId] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<{ [key: string]: 'yes' | 'no' | 'cancelled' }>({});

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
    } else {
      fetchClosedMarkets();
    }
  }, [isAuthenticated, router]);

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
        alert('마켓을 불러올 수 없습니다.');
        return;
      }

      setMarkets(data || []);
    } catch (error) {
      console.error('마켓 조회 오류:', error);
      alert('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSettle = async (marketId: string) => {
    const result = selectedResult[marketId];
    if (!result) {
      alert('결과를 선택해주세요.');
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
        alert('마켓 결과가 확정되고 정산이 완료되었습니다!');
        fetchClosedMarkets();
      } else {
        alert(data.error || '결과 확정에 실패했습니다.');
      }
    } catch (error) {
      console.error('결과 확정 오류:', error);
      alert('서버 오류가 발생했습니다.');
    } finally {
      setSettlingId(null);
    }
  };

  const handleResultSelect = (marketId: string, result: 'yes' | 'no' | 'cancelled') => {
    setSelectedResult({ ...selectedResult, [marketId]: result });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {/* 뒤로 가기 */}
        <button
          onClick={() => router.push('/admin')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <FaArrowLeft />
          <span>관리자 대시보드로</span>
        </button>

        {/* 페이지 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            마켓 결과 확정 ⚖️
          </h1>
          <p className="text-gray-600">
            마감된 마켓의 결과를 확정하고 정산하세요
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <FaSpinner className="animate-spin text-4xl text-blue-600" />
          </div>
        ) : markets.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              결과 확정이 필요한 마켓이 없습니다
            </h3>
            <p className="text-gray-500">
              모든 마켓이 처리되었습니다
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {markets.map((market) => {
              const yesPercentage = market.total_participants > 0
                ? (market.yes_count / market.total_participants) * 100
                : 50;
              const noPercentage = 100 - yesPercentage;

              return (
                <div key={market.id} className="bg-white rounded-xl shadow-md p-6">
                  {/* 마켓 정보 */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                        {market.category_slug}
                      </span>
                      <span className="flex items-center gap-1 text-red-600 text-sm">
                        <FaClock />
                        마감됨: {new Date(market.closes_at).toLocaleDateString('ko-KR')}
                      </span>
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {market.title}
                    </h3>

                    {market.description && (
                      <p className="text-gray-600 mb-4">{market.description}</p>
                    )}

                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <span>참여자: {market.total_participants}명</span>
                      <span>총 포인트: {market.total_points_pool.toLocaleString()}P</span>
                    </div>
                  </div>

                  {/* 현재 비율 */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Yes</div>
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {yesPercentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-700 font-medium mb-2">
                        {market.option_yes}
                      </div>
                      <div className="text-xs text-gray-500">
                        {market.yes_count}명 참여
                      </div>
                    </div>

                    <div className="bg-red-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">No</div>
                      <div className="text-2xl font-bold text-red-600 mb-1">
                        {noPercentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-700 font-medium mb-2">
                        {market.option_no}
                      </div>
                      <div className="text-xs text-gray-500">
                        {market.no_count}명 참여
                      </div>
                    </div>
                  </div>

                  {/* 결과 선택 */}
                  <div className="border-t pt-6">
                    <h4 className="font-bold text-gray-900 mb-4">결과 선택:</h4>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <button
                        onClick={() => handleResultSelect(market.id, 'yes')}
                        className={`px-6 py-4 rounded-lg border-2 transition-all font-medium ${
                          selectedResult[market.id] === 'yes'
                            ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-lg scale-105'
                            : 'border-gray-200 text-gray-700 hover:border-blue-300'
                        }`}
                      >
                        <FaCheckCircle className="inline mr-2" />
                        Yes 승리
                      </button>
                      <button
                        onClick={() => handleResultSelect(market.id, 'no')}
                        className={`px-6 py-4 rounded-lg border-2 transition-all font-medium ${
                          selectedResult[market.id] === 'no'
                            ? 'border-red-600 bg-red-50 text-red-700 shadow-lg scale-105'
                            : 'border-gray-200 text-gray-700 hover:border-red-300'
                        }`}
                      >
                        <FaCheckCircle className="inline mr-2" />
                        No 승리
                      </button>
                      <button
                        onClick={() => handleResultSelect(market.id, 'cancelled')}
                        className={`px-6 py-4 rounded-lg border-2 transition-all font-medium ${
                          selectedResult[market.id] === 'cancelled'
                            ? 'border-gray-600 bg-gray-50 text-gray-700 shadow-lg scale-105'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        취소
                      </button>
                    </div>

                    <button
                      onClick={() => handleSettle(market.id)}
                      disabled={!selectedResult[market.id] || settlingId === market.id}
                      className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {settlingId === market.id ? (
                        <>
                          <FaSpinner className="animate-spin" />
                          <span>처리 중...</span>
                        </>
                      ) : (
                        <span>결과 확정 및 정산</span>
                      )}
                    </button>
                  </div>

                  {/* 경고 */}
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚠️ 결과 확정 후에는 되돌릴 수 없습니다. 신중하게 선택해주세요.
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

