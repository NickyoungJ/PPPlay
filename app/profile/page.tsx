'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { FaCoins, FaVoteYea, FaCheckCircle, FaChartLine, FaHistory, FaArrowUp, FaArrowDown, FaChevronLeft, FaChevronRight, FaUser, FaPen } from 'react-icons/fa';
import { ProfileSkeleton } from '../components/ui/Skeleton';
import { EmptyVoteHistory, EmptyPointHistory } from '../components/ui/EmptyState';
import NicknameModal from '../components/profile/NicknameModal';

const ITEMS_PER_PAGE = 5;

interface PointTransaction {
  id: string;
  transaction_type: string;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
}

interface ProfileData {
  nickname: string | null;
  email: string;
  points: {
    total: number;
    available: number;
    daily_votes: number;
    daily_limit: number;
  };
  stats: {
    total_votes: number;
    correct_votes: number;
    win_rate: number;
  };
  recent_predictions: Array<{
    id: string;
    predicted_option: string;
    participation_reward: number;
    accuracy_reward: number;
    created_at: string;
    markets: {
      id: string;
      title: string;
      result: string | null;
      is_closed: boolean;
      option_yes: string;
      option_no: string;
    };
  }>;
  point_history: PointTransaction[];
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  
  // 페이지네이션 상태
  const [pointHistoryPage, setPointHistoryPage] = useState(1);
  const [predictionsPage, setPredictionsPage] = useState(1);

  useEffect(() => {
    fetchProfile();
  }, []);

  // 닉네임 업데이트 핸들러
  const handleNicknameUpdate = (newNickname: string | null) => {
    if (profile) {
      setProfile({ ...profile, nickname: newNickname });
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      const data = await response.json();

      if (data.success) {
        setProfile(data.profile);
      } else {
        console.error('프로필 조회 실패:', data.error);
      }
    } catch (error) {
      console.error('프로필 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 px-4 md:px-8 py-12">
          <div className="max-w-4xl mx-auto">
            {/* 페이지 헤더 스켈레톤 */}
            <div className="mb-12">
              <div className="h-12 w-48 bg-foreground/10 rounded-lg animate-pulse mb-3" />
              <div className="h-6 w-64 bg-foreground/5 rounded-lg animate-pulse" />
            </div>
            <ProfileSkeleton />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-foreground/70 mb-4">프로필을 불러올 수 없습니다.</p>
            <button
              onClick={() => router.push('/markets')}
              className="px-6 py-3 bg-primary text-white rounded-xl hover:opacity-90 transition-all"
            >
              마켓으로 돌아가기
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 트랜잭션 타입 라벨 변환
  const getTransactionLabel = (type: string) => {
    const labels: Record<string, string> = {
      'daily_login': '📅 출석 체크',
      'consecutive_bonus': '🔥 연속 출석 보너스',
      'vote_participation': '🗳️ 투표 참여',
      'prediction_spent': '🎯 예측 참여',
      'prediction_reward': '🎉 예측 적중 보상',
      'prediction_refund': '💸 예측 환불',
      'market_creation': '📝 마켓 개설',
      'market_creation_refund': '💰 마켓 거절 환불',
      'creator_bonus': '⭐ 마켓 승인 보너스',
      'ad_reward': '📺 광고 시청',
      'referral_signup': '👥 친구 추천',
      'referral_activity': '👥 추천인 활동',
      'level_up_bonus': '🎖️ 레벨업 보너스',
      'achievement_reward': '🏆 업적 달성',
      'admin_adjustment': '⚙️ 관리자 조정',
      'reward_shop': '🛒 상점 교환',
    };
    return labels[type] || type;
  };

  // 결과 상태 표시
  const getResultBadge = (prediction: ProfileData['recent_predictions'][0]) => {
    const { markets, predicted_option, accuracy_reward } = prediction;
    
    if (!markets.result) {
      return <span className="px-3 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-xs font-semibold">대기 중</span>;
    }
    
    const isCorrect = markets.result === predicted_option;
    
    if (isCorrect) {
      return <span className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-xs font-semibold">✅ 적중 (+{accuracy_reward}P)</span>;
    } else {
      return <span className="px-3 py-1 bg-red-500/20 text-red-500 rounded-full text-xs font-semibold">❌ 미적중</span>;
    }
  };

  // 페이지네이션 계산
  const getPagedData = <T,>(data: T[], page: number): T[] => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    return data.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  const getTotalPages = (totalItems: number): number => {
    return Math.ceil(totalItems / ITEMS_PER_PAGE);
  };

  // 페이지네이션 컴포넌트
  const Pagination = ({ 
    currentPage, 
    totalPages, 
    onPageChange 
  }: { 
    currentPage: number; 
    totalPages: number; 
    onPageChange: (page: number) => void;
  }) => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-center gap-2 mt-6">
        {/* 이전 버튼 */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg transition-all ${
            currentPage === 1
              ? 'text-foreground/30 cursor-not-allowed'
              : 'text-foreground/70 hover:bg-primary/10 hover:text-primary'
          }`}
        >
          <FaChevronLeft />
        </button>

        {/* 페이지 번호 */}
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 rounded-lg font-medium transition-all ${
                currentPage === page
                  ? 'bg-primary text-white'
                  : 'text-foreground/70 hover:bg-primary/10 hover:text-primary'
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        {/* 다음 버튼 */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-lg transition-all ${
            currentPage === totalPages
              ? 'text-foreground/30 cursor-not-allowed'
              : 'text-foreground/70 hover:bg-primary/10 hover:text-primary'
          }`}
        >
          <FaChevronRight />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 px-3 sm:px-4 md:px-8 py-6 sm:py-12">
        <div className="max-w-4xl mx-auto">
          {/* 페이지 헤더 - 모바일 최적화 */}
          <div className="mb-6 sm:mb-12">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-1 sm:mb-3">
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                마이페이지
              </span>
            </h1>
            <p className="text-foreground/70 text-sm sm:text-lg">
              내 포인트와 투표 통계를 확인하세요
            </p>
          </div>

          {/* 프로필 정보 - 닉네임 */}
          <div className="bg-gradient-to-br from-accent/20 to-accent/5 backdrop-blur-xl border border-accent/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-4 sm:mb-8 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* 프로필 아이콘 */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-accent/20 flex items-center justify-center">
                  <FaUser className="text-2xl sm:text-3xl text-accent" />
                </div>
                
                {/* 닉네임 & 이메일 */}
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                      {profile.nickname || '닉네임 없음'}
                    </h2>
                    {!profile.nickname && (
                      <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-500 rounded-full">
                        설정 필요
                      </span>
                    )}
                  </div>
                  <p className="text-foreground/50 text-sm mt-0.5">
                    {profile.email}
                  </p>
                </div>
              </div>
              
              {/* 편집 버튼 */}
              <button
                onClick={() => setShowNicknameModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-accent/20 hover:bg-accent/30 text-accent rounded-xl font-medium transition-all btn-press"
              >
                <FaPen className="text-sm" />
                <span className="hidden sm:inline">수정</span>
              </button>
            </div>
          </div>

          {/* 포인트 현황 - 모바일 최적화 */}
          <div className="grid grid-cols-2 gap-3 sm:gap-6 mb-4 sm:mb-8">
            {/* 총 포인트 */}
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur-xl border border-primary/30 rounded-2xl sm:rounded-3xl p-4 sm:p-8 hover-lift opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                <FaCoins className="text-xl sm:text-3xl text-primary" />
                <h2 className="text-sm sm:text-xl font-bold text-foreground/90">보유 포인트</h2>
              </div>
              <div className="text-2xl sm:text-5xl font-bold text-primary mb-1 sm:mb-2 animate-count-up">
                {profile.points.total.toLocaleString()}P
              </div>
              <p className="text-foreground/60 text-xs sm:text-sm">
                사용 가능: {profile.points.available.toLocaleString()}P
              </p>
            </div>

            {/* 오늘 투표 현황 */}
            <div className="bg-gradient-to-br from-secondary/20 to-secondary/5 backdrop-blur-xl border border-secondary/30 rounded-2xl sm:rounded-3xl p-4 sm:p-8 hover-lift opacity-0 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                <FaVoteYea className="text-xl sm:text-3xl text-secondary" />
                <h2 className="text-sm sm:text-xl font-bold text-foreground/90">오늘의 투표</h2>
              </div>
              <div className="text-2xl sm:text-5xl font-bold text-secondary mb-1 sm:mb-2 animate-count-up">
                {profile.points.daily_votes} / {profile.points.daily_limit}
              </div>
              <p className="text-foreground/60 text-xs sm:text-sm">
                남은 투표: {profile.points.daily_limit - profile.points.daily_votes}회
              </p>
            </div>
          </div>

          {/* 투표 통계 - 모바일 최적화 */}
          <div className="bg-background/40 backdrop-blur-xl border border-primary/20 rounded-2xl sm:rounded-3xl p-4 sm:p-8 mb-4 sm:mb-8 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <FaChartLine className="text-xl sm:text-3xl text-accent" />
              <h2 className="text-lg sm:text-2xl font-bold text-foreground/90">투표 통계</h2>
            </div>
            
            <div className="grid grid-cols-3 gap-3 sm:gap-6">
              {/* 총 투표 수 */}
              <div className="text-center opacity-0 animate-bounce-in" style={{ animationDelay: '0.3s' }}>
                <div className="text-xl sm:text-3xl font-bold text-foreground/90 mb-1 sm:mb-2">
                  {profile.stats.total_votes}
                </div>
                <p className="text-foreground/60 text-xs sm:text-sm">총 투표</p>
              </div>

              {/* 적중 수 */}
              <div className="text-center opacity-0 animate-bounce-in" style={{ animationDelay: '0.4s' }}>
                <div className="text-xl sm:text-3xl font-bold text-green-500 mb-1 sm:mb-2">
                  {profile.stats.correct_votes}
                </div>
                <p className="text-foreground/60 text-xs sm:text-sm">적중</p>
              </div>

              {/* 정답률 */}
              <div className="text-center opacity-0 animate-bounce-in" style={{ animationDelay: '0.5s' }}>
                <div className="text-xl sm:text-3xl font-bold text-accent mb-1 sm:mb-2">
                  {profile.stats.win_rate.toFixed(1)}%
                </div>
                <p className="text-foreground/60 text-xs sm:text-sm">정답률</p>
              </div>
            </div>
          </div>

          {/* 포인트 히스토리 - 모바일 최적화 */}
          <div className="bg-background/40 backdrop-blur-xl border border-primary/20 rounded-2xl sm:rounded-3xl p-4 sm:p-8 mb-4 sm:mb-8">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <FaHistory className="text-lg sm:text-2xl text-accent" />
                <h2 className="text-lg sm:text-2xl font-bold text-foreground/90">포인트 내역</h2>
              </div>
              {profile.point_history && profile.point_history.length > 0 && (
                <span className="text-xs sm:text-sm text-foreground/50">
                  총 {profile.point_history.length}건
                </span>
              )}
            </div>

            {(!profile.point_history || profile.point_history.length === 0) ? (
              <EmptyPointHistory />
            ) : (
              <>
                <div className="space-y-3">
                  {getPagedData(profile.point_history, pointHistoryPage).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between bg-background/60 border border-primary/10 rounded-xl p-4 hover:border-primary/20 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        {/* 증감 아이콘 */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.amount > 0 
                            ? 'bg-green-500/20' 
                            : 'bg-red-500/20'
                        }`}>
                          {transaction.amount > 0 ? (
                            <FaArrowUp className="text-green-500" />
                          ) : (
                            <FaArrowDown className="text-red-500" />
                          )}
                        </div>
                        
                        {/* 내용 */}
                        <div>
                          <p className="font-medium text-foreground/90">
                            {getTransactionLabel(transaction.transaction_type)}
                          </p>
                          <p className="text-sm text-foreground/50">
                            {transaction.description || '-'}
                          </p>
                          <p className="text-xs text-foreground/40 mt-1">
                            {new Date(transaction.created_at).toLocaleString('ko-KR', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      
                      {/* 금액 */}
                      <div className="text-right">
                        <p className={`text-lg font-bold ${
                          transaction.amount > 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()}P
                        </p>
                        <p className="text-xs text-foreground/40">
                          잔액: {transaction.balance_after?.toLocaleString() || '-'}P
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* 페이지네이션 */}
                <Pagination
                  currentPage={pointHistoryPage}
                  totalPages={getTotalPages(profile.point_history.length)}
                  onPageChange={setPointHistoryPage}
                />
              </>
            )}
          </div>

          {/* 최근 투표 내역 - 모바일 최적화 */}
          <div className="bg-background/40 backdrop-blur-xl border border-primary/20 rounded-2xl sm:rounded-3xl p-4 sm:p-8">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <FaCheckCircle className="text-lg sm:text-2xl text-primary" />
                <h2 className="text-lg sm:text-2xl font-bold text-foreground/90">최근 투표 내역</h2>
              </div>
              {profile.recent_predictions.length > 0 && (
                <span className="text-xs sm:text-sm text-foreground/50">
                  총 {profile.recent_predictions.length}건
                </span>
              )}
            </div>

            {profile.recent_predictions.length === 0 ? (
              <EmptyVoteHistory />
            ) : (
              <>
                <div className="space-y-4">
                  {getPagedData(profile.recent_predictions, predictionsPage).map((prediction) => (
                    <div
                      key={prediction.id}
                      className="bg-background/60 border border-primary/10 rounded-2xl p-6 hover:border-primary/30 transition-all cursor-pointer"
                      onClick={() => router.push(`/markets/${prediction.markets.id}`)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-bold text-foreground/90 flex-1 pr-4">
                          {prediction.markets.title}
                        </h3>
                        {getResultBadge(prediction)}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-foreground/70">
                        <span>
                          내 선택: <span className={prediction.predicted_option === 'yes' ? 'text-primary font-semibold' : 'text-secondary font-semibold'}>
                            {prediction.predicted_option === 'yes' ? 'YES' : 'NO'}
                          </span>
                        </span>
                        <span>•</span>
                        <span>참여 보상: +{prediction.participation_reward}P</span>
                        <span>•</span>
                        <span>{new Date(prediction.created_at).toLocaleDateString('ko-KR')}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* 페이지네이션 */}
                <Pagination
                  currentPage={predictionsPage}
                  totalPages={getTotalPages(profile.recent_predictions.length)}
                  onPageChange={setPredictionsPage}
                />
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {/* 닉네임 설정 모달 */}
      <NicknameModal
        isOpen={showNicknameModal}
        onClose={() => setShowNicknameModal(false)}
        currentNickname={profile?.nickname || null}
        onUpdate={handleNicknameUpdate}
      />
    </div>
  );
}

