'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { FaCoins, FaVoteYea, FaCheckCircle, FaSpinner, FaChartLine } from 'react-icons/fa';

interface ProfileData {
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
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

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
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FaSpinner className="animate-spin text-5xl text-primary mx-auto mb-4" />
            <p className="text-foreground/70">로딩 중...</p>
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 px-4 md:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          {/* 페이지 헤더 */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                마이페이지
              </span>
            </h1>
            <p className="text-foreground/70 text-lg">
              내 포인트와 투표 통계를 확인하세요
            </p>
          </div>

          {/* 포인트 현황 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* 총 포인트 */}
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur-xl border border-primary/30 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <FaCoins className="text-3xl text-primary" />
                <h2 className="text-xl font-bold text-foreground/90">보유 포인트</h2>
              </div>
              <div className="text-5xl font-bold text-primary mb-2">
                {profile.points.total.toLocaleString()}P
              </div>
              <p className="text-foreground/60 text-sm">
                사용 가능: {profile.points.available.toLocaleString()}P
              </p>
            </div>

            {/* 오늘 투표 현황 */}
            <div className="bg-gradient-to-br from-secondary/20 to-secondary/5 backdrop-blur-xl border border-secondary/30 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <FaVoteYea className="text-3xl text-secondary" />
                <h2 className="text-xl font-bold text-foreground/90">오늘의 투표</h2>
              </div>
              <div className="text-5xl font-bold text-secondary mb-2">
                {profile.points.daily_votes} / {profile.points.daily_limit}
              </div>
              <p className="text-foreground/60 text-sm">
                남은 투표: {profile.points.daily_limit - profile.points.daily_votes}회
              </p>
            </div>
          </div>

          {/* 투표 통계 */}
          <div className="bg-background/40 backdrop-blur-xl border border-primary/20 rounded-3xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <FaChartLine className="text-3xl text-accent" />
              <h2 className="text-2xl font-bold text-foreground/90">투표 통계</h2>
            </div>
            
            <div className="grid grid-cols-3 gap-6">
              {/* 총 투표 수 */}
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground/90 mb-2">
                  {profile.stats.total_votes}
                </div>
                <p className="text-foreground/60 text-sm">총 투표 수</p>
              </div>

              {/* 적중 수 */}
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500 mb-2">
                  {profile.stats.correct_votes}
                </div>
                <p className="text-foreground/60 text-sm">적중 수</p>
              </div>

              {/* 정답률 */}
              <div className="text-center">
                <div className="text-3xl font-bold text-accent mb-2">
                  {profile.stats.win_rate.toFixed(1)}%
                </div>
                <p className="text-foreground/60 text-sm">정답률</p>
              </div>
            </div>
          </div>

          {/* 최근 투표 내역 */}
          <div className="bg-background/40 backdrop-blur-xl border border-primary/20 rounded-3xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <FaCheckCircle className="text-2xl text-primary" />
                <h2 className="text-2xl font-bold text-foreground/90">최근 투표 내역</h2>
              </div>
            </div>

            {profile.recent_predictions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-foreground/60 mb-4">아직 투표한 내역이 없습니다.</p>
                <button
                  onClick={() => router.push('/markets')}
                  className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:opacity-90 transition-all font-semibold"
                >
                  마켓 둘러보기
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {profile.recent_predictions.map((prediction) => (
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
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

