'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/utils/supabase/client'

interface UserPoints {
  rp_points: number
  pp_points: number
  wp_points: number
  total_predictions: number
  correct_predictions: number
  win_rate: string
  level: number
  tier: string
  referral_code: string
  consecutive_login_days: number
}

interface Prediction {
  id: string
  market_title: string
  market_category: string
  predicted_option: string
  option_label: string
  point_type: string
  points_spent: number
  shares: number
  potential_payout: number
  potential_profit: number
  is_settled: boolean
  is_correct: boolean | null
  reward_amount: number | null
  actual_profit: number | null
  created_at: string
  market_closes_at: string
  is_active: boolean
  market_result: string | null
}

interface Transaction {
  id: string
  type_icon: string
  type_label: string
  point_type: string
  amount: number
  balance_after: number
  description: string
  created_at: string
  status: string
}

export default function ProfilePage() {
  const router = useRouter()
  const supabase = supabaseClient
  const [user, setUser] = useState<any>(null)
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null)
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'predictions' | 'transactions'>('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }
    setUser(user)
    await fetchProfileData()
  }

  const fetchProfileData = async () => {
    try {
      setLoading(true)

      // 포인트 정보
      const pointsRes = await fetch('/api/profile/points')
      const pointsData = await pointsRes.json()
      if (pointsData.success) {
        setUserPoints(pointsData.data)
      }

      // 예측 내역 (최근 10개)
      const predictionsRes = await fetch('/api/profile/predictions?limit=10')
      const predictionsData = await predictionsRes.json()
      if (predictionsData.success) {
        setPredictions(predictionsData.data)
      }

      // 거래 내역 (최근 20개)
      const transactionsRes = await fetch('/api/profile/transactions?limit=20')
      const transactionsData = await transactionsRes.json()
      if (transactionsData.success) {
        setTransactions(transactionsData.data)
      }
    } catch (error) {
      console.error('프로필 데이터 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      bronze: 'text-orange-400',
      silver: 'text-gray-300',
      gold: 'text-yellow-400',
      platinum: 'text-cyan-400',
      diamond: 'text-blue-400',
    }
    return colors[tier] || 'text-gray-400'
  }

  const getTierEmoji = (tier: string) => {
    const emojis: Record<string, string> = {
      bronze: '🥉',
      silver: '🥈',
      gold: '🥇',
      platinum: '💎',
      diamond: '💠',
    }
    return emojis[tier] || '🏅'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">마이페이지</h1>
          <p className="text-gray-300">{user?.email}</p>
        </div>

        {/* 포인트 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* RP 카드 */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300 text-sm">Reward Points</span>
              <span className="text-2xl">💰</span>
            </div>
            <div className="text-4xl font-bold text-yellow-400 mb-1">
              {userPoints?.rp_points.toLocaleString() || 0}
            </div>
            <div className="text-xs text-gray-400">RP</div>
          </div>

          {/* PP 카드 */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300 text-sm">Premium Points</span>
              <span className="text-2xl">💎</span>
            </div>
            <div className="text-4xl font-bold text-purple-400 mb-1">
              {userPoints?.pp_points.toLocaleString() || 0}
            </div>
            <div className="text-xs text-gray-400">PP</div>
          </div>

          {/* WP 카드 */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300 text-sm">Winning Points</span>
              <span className="text-2xl">🏆</span>
            </div>
            <div className="text-4xl font-bold text-green-400 mb-1">
              {userPoints?.wp_points.toLocaleString() || 0}
            </div>
            <div className="text-xs text-gray-400">WP</div>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
            <div className="text-gray-300 text-sm mb-1">총 예측</div>
            <div className="text-2xl font-bold text-white">{userPoints?.total_predictions || 0}회</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
            <div className="text-gray-300 text-sm mb-1">승률</div>
            <div className="text-2xl font-bold text-green-400">{userPoints?.win_rate || 0}%</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
            <div className="text-gray-300 text-sm mb-1">레벨</div>
            <div className="text-2xl font-bold text-blue-400">Lv.{userPoints?.level || 1}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
            <div className="text-gray-300 text-sm mb-1">티어</div>
            <div className={`text-2xl font-bold ${getTierColor(userPoints?.tier || 'bronze')}`}>
              {getTierEmoji(userPoints?.tier || 'bronze')} {userPoints?.tier?.toUpperCase() || 'BRONZE'}
            </div>
          </div>
        </div>

        {/* 추천인 코드 */}
        <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-300 text-sm mb-1">내 추천인 코드</div>
              <div className="text-3xl font-bold text-white">{userPoints?.referral_code}</div>
            </div>
            <div className="text-right">
              <div className="text-gray-300 text-sm mb-1">연속 출석</div>
              <div className="text-3xl font-bold text-orange-400">🔥 {userPoints?.consecutive_login_days || 0}일</div>
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex space-x-4 mb-6 border-b border-white/20">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === 'overview'
                ? 'text-white border-b-2 border-pink-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            개요
          </button>
          <button
            onClick={() => setActiveTab('predictions')}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === 'predictions'
                ? 'text-white border-b-2 border-pink-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            예측 내역
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === 'transactions'
                ? 'text-white border-b-2 border-pink-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            포인트 내역
          </button>
        </div>

        {/* 탭 콘텐츠 */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">최근 활동</h2>
              <p className="text-gray-300">최근 예측 내역과 포인트 거래 내역을 확인하세요.</p>
            </div>
          </div>
        )}

        {activeTab === 'predictions' && (
          <div className="space-y-4">
            {predictions.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center">
                <div className="text-6xl mb-4">🎲</div>
                <div className="text-xl text-white mb-2">아직 참여한 예측이 없습니다</div>
                <div className="text-gray-400 mb-6">마켓에서 예측을 시작해보세요!</div>
                <button
                  onClick={() => router.push('/markets')}
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                >
                  마켓 둘러보기
                </button>
              </div>
            ) : (
              predictions.map((pred) => (
                <div
                  key={pred.id}
                  className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:border-pink-500/50 transition-all cursor-pointer"
                  onClick={() => router.push(`/markets/${pred.market_category}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-2">{pred.market_title}</h3>
                      <div className="flex items-center space-x-3 text-sm">
                        <span className="px-3 py-1 bg-purple-500/30 text-purple-300 rounded-full">
                          {pred.option_label}
                        </span>
                        <span className="text-gray-400">{pred.shares}주</span>
                        <span className="text-yellow-400">{pred.point_type} {pred.points_spent}P</span>
                      </div>
                    </div>
                    {pred.is_settled ? (
                      pred.is_correct ? (
                        <div className="text-right">
                          <div className="text-green-400 font-bold text-xl">✅ 성공</div>
                          <div className="text-green-400 text-sm">+{pred.actual_profit}P</div>
                        </div>
                      ) : (
                        <div className="text-right">
                          <div className="text-red-400 font-bold text-xl">❌ 실패</div>
                          <div className="text-red-400 text-sm">{pred.actual_profit}P</div>
                        </div>
                      )
                    ) : (
                      <div className="text-right">
                        <div className="text-gray-400 text-sm">진행 중</div>
                        <div className="text-green-400 text-sm">+{pred.potential_profit}P 예상</div>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatDate(pred.created_at)} · 마감: {formatDate(pred.market_closes_at)}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center">
                <div className="text-6xl mb-4">💸</div>
                <div className="text-xl text-white mb-2">거래 내역이 없습니다</div>
                <div className="text-gray-400">포인트 활동이 여기에 표시됩니다.</div>
              </div>
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 hover:border-pink-500/50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl">{tx.type_icon}</div>
                      <div>
                        <div className="text-white font-medium">{tx.type_label}</div>
                        <div className="text-xs text-gray-400">{tx.description}</div>
                        <div className="text-xs text-gray-500">{formatDate(tx.created_at)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-xl font-bold ${
                          tx.amount > 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} {tx.point_type}
                      </div>
                      <div className="text-xs text-gray-400">
                        잔액: {tx.balance_after.toLocaleString()} {tx.point_type}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

