'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
// import { useAuth } from '../hooks/useAuth'; // 🔥 임시: 리다이렉트 방지
import { 
  FaCheckCircle, FaTimesCircle, FaSpinner, FaChartBar, 
  FaUsers, FaCoins, FaExclamationTriangle, FaClipboardCheck 
} from 'react-icons/fa';
import { showSuccess, showError } from '@/utils/toast';

interface Market {
  id: string;
  title: string;
  description?: string;
  category_slug: string;
  creator_id: string;
  total_participants: number;
  total_points_pool: number;
  closes_at: string;
  created_at: string;
  creator?: {
    email: string;
    user_metadata?: any;
  };
}

interface Stats {
  markets: {
    total: number;
    byStatus: {
      pending: number;
      approved: number;
      active: number;
      closed: number;
      cancelled: number;
    };
    byType: {
      sports: number;
      general: number;
    };
  };
  users: {
    total: number;
    recentSignups: number;
  };
  predictions: {
    total: number;
  };
  points: {
    total: number;
    available: number;
    locked: number;
  };
  transactions: {
    total: number;
    earned: number;
    spent: number;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  // const { user, isAuthenticated } = useAuth(); // 🔥 임시: useAuth 비활성화

  const [activeTab, setActiveTab] = useState<'stats' | 'pending' | 'settle'>('stats');
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingMarkets, setPendingMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // 🔥 임시: 관리자 권한 확인 비활성화
  /*
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, router]);
  */

  // 데이터 로드
  useEffect(() => {
    if (activeTab === 'stats') {
      fetchStats();
    } else if (activeTab === 'pending') {
      fetchPendingMarkets();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/stats');
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      } else {
        showError(data.error || '통계를 불러올 수 없습니다.');
        if (response.status === 403) {
          router.push('/');
        }
      }
    } catch (error) {
      console.error('통계 조회 오류:', error);
      showError('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingMarkets = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/markets/pending');
      const data = await response.json();

      if (data.success) {
        setPendingMarkets(data.markets);
      } else {
        showError(data.error || '마켓을 불러올 수 없습니다.');
        if (response.status === 403) {
          router.push('/');
        }
      }
    } catch (error) {
      console.error('마켓 조회 오류:', error);
      showError('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (marketId: string) => {
    if (!confirm('이 마켓을 승인하시겠습니까?')) return;

    setActionLoading(marketId);
    try {
      const response = await fetch('/api/admin/markets/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ market_id: marketId }),
      });

      const data = await response.json();

      if (data.success) {
        showSuccess('마켓이 승인되었습니다! ✅');
        fetchPendingMarkets();
      } else {
        showError(data.error || '승인에 실패했습니다.');
      }
    } catch (error) {
      console.error('승인 오류:', error);
      showError('서버 오류가 발생했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (marketId: string) => {
    const reason = prompt('거부 사유를 입력하세요:');
    if (!reason) return;

    setActionLoading(marketId);
    try {
      const response = await fetch('/api/admin/markets/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ market_id: marketId, reason }),
      });

      const data = await response.json();

      if (data.success) {
        showSuccess('마켓이 거부되었습니다. 포인트가 환불되었습니다.');
        fetchPendingMarkets();
      } else {
        showError(data.error || '거부에 실패했습니다.');
      }
    } catch (error) {
      console.error('거부 오류:', error);
      showError('서버 오류가 발생했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            관리자 대시보드 ⚙️
          </h1>
          <p className="text-gray-600">
            마켓 관리 및 통계 확인
          </p>
        </div>

        {/* 탭 */}
        <div className="flex gap-2 mb-6 border-b overflow-x-auto">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'stats'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <FaChartBar className="inline mr-2" />
            통계
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'pending'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <FaExclamationTriangle className="inline mr-2" />
            승인 대기
            {pendingMarkets.length > 0 && (
              <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                {pendingMarkets.length}
              </span>
            )}
          </button>
          <button
            onClick={() => router.push('/admin/settle')}
            className="px-6 py-3 font-medium transition-colors border-b-2 border-transparent text-gray-600 hover:text-gray-900 whitespace-nowrap"
          >
            <FaClipboardCheck className="inline mr-2" />
            결과 확정
          </button>
        </div>

        {/* 컨텐츠 */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <FaSpinner className="animate-spin text-4xl text-blue-600" />
          </div>
        ) : (
          <>
            {/* 통계 탭 */}
            {activeTab === 'stats' && stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* 마켓 통계 */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">마켓</h3>
                    <FaClipboardCheck className="text-3xl text-blue-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {stats.markets.total}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>승인 대기:</span>
                      <span className="font-medium text-orange-600">
                        {stats.markets.byStatus.pending}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>활성:</span>
                      <span className="font-medium text-green-600">
                        {stats.markets.byStatus.approved + stats.markets.byStatus.active}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>종료:</span>
                      <span className="font-medium">{stats.markets.byStatus.closed}</span>
                    </div>
                  </div>
                </div>

                {/* 사용자 통계 */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">사용자</h3>
                    <FaUsers className="text-3xl text-green-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {stats.users.total.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>최근 7일 가입:</span>
                      <span className="font-medium text-green-600">
                        +{stats.users.recentSignups}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 예측 통계 */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">예측</h3>
                    <FaCheckCircle className="text-3xl text-purple-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {stats.predictions.total.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    총 예측 참여 횟수
                  </div>
                </div>

                {/* 포인트 통계 */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">포인트</h3>
                    <FaCoins className="text-3xl text-yellow-500" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {stats.points.total.toLocaleString()}P
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>사용 가능:</span>
                      <span className="font-medium text-green-600">
                        {stats.points.available.toLocaleString()}P
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>잠김:</span>
                      <span className="font-medium text-orange-600">
                        {stats.points.locked.toLocaleString()}P
                      </span>
                    </div>
                  </div>
                </div>

                {/* 트랜잭션 통계 (최근 7일) */}
                <div className="bg-white rounded-xl shadow-md p-6 md:col-span-2">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    최근 7일 트랜잭션
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">총 거래</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.transactions.total.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">획득</div>
                      <div className="text-2xl font-bold text-green-600">
                        +{stats.transactions.earned.toLocaleString()}P
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">사용</div>
                      <div className="text-2xl font-bold text-red-600">
                        -{stats.transactions.spent.toLocaleString()}P
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 승인 대기 탭 */}
            {activeTab === 'pending' && (
              <div>
                {pendingMarkets.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">✅</div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2">
                      승인 대기 중인 마켓이 없습니다
                    </h3>
                    <p className="text-gray-500">
                      모든 마켓이 처리되었습니다
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingMarkets.map((market) => (
                      <div key={market.id} className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                                {market.category_slug}
                              </span>
                              <span className="text-sm text-gray-500">
                                {new Date(market.created_at).toLocaleDateString('ko-KR')}
                              </span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                              {market.title}
                            </h3>
                            {market.description && (
                              <p className="text-gray-600 mb-3">{market.description}</p>
                            )}
                            <div className="text-sm text-gray-500">
                              생성자: {market.creator?.email || '알 수 없음'} •
                              마감: {new Date(market.closes_at).toLocaleDateString('ko-KR')}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(market.id)}
                            disabled={actionLoading === market.id}
                            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 flex items-center justify-center gap-2"
                          >
                            {actionLoading === market.id ? (
                              <FaSpinner className="animate-spin" />
                            ) : (
                              <FaCheckCircle />
                            )}
                            <span>승인</span>
                          </button>
                          <button
                            onClick={() => handleReject(market.id)}
                            disabled={actionLoading === market.id}
                            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:bg-gray-400 flex items-center justify-center gap-2"
                          >
                            {actionLoading === market.id ? (
                              <FaSpinner className="animate-spin" />
                            ) : (
                              <FaTimesCircle />
                            )}
                            <span>거부</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

