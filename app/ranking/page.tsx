'use client';

import { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { FaTrophy, FaMedal, FaFire, FaChartLine, FaCrown, FaUser } from 'react-icons/fa';
import { RankingListSkeleton } from '../components/ui/Skeleton';
import { EmptyRanking } from '../components/ui/EmptyState';

interface RankingUser {
  rank: number;
  userId: string;
  nickname: string;
  avatarUrl: string | null;
  totalPoints: number;
  totalVotes: number;
  correctVotes: number;
  winRate: number;
  consecutiveDays: number;
  isCurrentUser: boolean;
}

type RankingType = 'points' | 'winRate' | 'streak';

export default function RankingPage() {
  const [activeTab, setActiveTab] = useState<RankingType>('points');
  const [rankings, setRankings] = useState<RankingUser[]>([]);
  const [myRanking, setMyRanking] = useState<RankingUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRankings(activeTab);
  }, [activeTab]);

  const fetchRankings = async (type: RankingType) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/leaderboard?type=${type}&limit=50`);
      const data = await response.json();

      if (data.success) {
        setRankings(data.rankings);
        setMyRanking(data.myRanking);
      }
    } catch (error) {
      console.error('랭킹 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <FaCrown className="text-2xl text-yellow-400" />;
      case 2:
        return <FaMedal className="text-2xl text-gray-300" />;
      case 3:
        return <FaMedal className="text-2xl text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-foreground/50">{rank}</span>;
    }
  };

  const getRankBgClass = (rank: number, isCurrentUser: boolean) => {
    if (isCurrentUser) return 'bg-primary/20 border-primary/50';
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/50';
      case 2:
        return 'bg-gradient-to-r from-gray-300/20 to-gray-400/20 border-gray-400/50';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-600/50';
      default:
        return 'bg-background/40 border-primary/10';
    }
  };

  const tabs = [
    { id: 'points' as RankingType, label: '포인트', icon: <FaTrophy /> },
    { id: 'winRate' as RankingType, label: '승률', icon: <FaChartLine /> },
    { id: 'streak' as RankingType, label: '연속 출석', icon: <FaFire /> },
  ];

  const getMainValue = (user: RankingUser) => {
    switch (activeTab) {
      case 'points':
        return `${user.totalPoints.toLocaleString()}P`;
      case 'winRate':
        return `${user.winRate}%`;
      case 'streak':
        return `${user.consecutiveDays}일`;
    }
  };

  const getSubValue = (user: RankingUser) => {
    switch (activeTab) {
      case 'points':
        return `${user.totalVotes}회 참여`;
      case 'winRate':
        return `${user.correctVotes}/${user.totalVotes} 적중`;
      case 'streak':
        return `${user.totalPoints.toLocaleString()}P`;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 px-4 md:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          {/* 페이지 헤더 */}
          <div className="mb-10 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              <span className="bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
                🏆 랭킹
              </span>
            </h1>
            <p className="text-foreground/70 text-lg">
              최고의 예측가들을 확인하세요
            </p>
          </div>

          {/* 탭 */}
          <div className="flex justify-center gap-2 mb-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30'
                    : 'bg-background/40 text-foreground/70 hover:bg-background/60 border border-primary/20'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* 내 랭킹 (로그인한 경우) */}
          {myRanking && !rankings.find(r => r.isCurrentUser) && (
            <div className="mb-6">
              <div className="text-sm text-foreground/50 mb-2">내 순위</div>
              <div className={`flex items-center gap-4 p-4 rounded-2xl border-2 ${getRankBgClass(myRanking.rank, true)}`}>
                <div className="w-12 h-12 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">{myRanking.rank}</span>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                  {myRanking.avatarUrl ? (
                    <img src={myRanking.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <FaUser className="text-primary text-xl" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-foreground flex items-center gap-2">
                    {myRanking.nickname}
                    <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">나</span>
                  </div>
                  <div className="text-sm text-foreground/50">{getSubValue(myRanking)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-primary">{getMainValue(myRanking)}</div>
                </div>
              </div>
            </div>
          )}

          {/* 랭킹 리스트 */}
          {loading ? (
            <RankingListSkeleton count={10} />
          ) : rankings.length === 0 ? (
            <EmptyRanking />
          ) : (
            <div className="space-y-3">
              {rankings.map((user, index) => (
                <div
                  key={user.userId}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-2 hover-lift opacity-0 animate-fade-in-up ${getRankBgClass(user.rank, user.isCurrentUser)}`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* 순위 */}
                  <div className="w-12 h-12 flex items-center justify-center">
                    {getRankIcon(user.rank)}
                  </div>

                  {/* 프로필 */}
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <FaUser className="text-primary/50 text-xl" />
                    )}
                  </div>

                  {/* 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-foreground truncate flex items-center gap-2">
                      {user.nickname}
                      {user.isCurrentUser && (
                        <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">나</span>
                      )}
                    </div>
                    <div className="text-sm text-foreground/50">{getSubValue(user)}</div>
                  </div>

                  {/* 메인 수치 */}
                  <div className="text-right">
                    <div className={`text-xl font-bold ${
                      user.rank <= 3 ? 'text-yellow-500' : 'text-primary'
                    }`}>
                      {getMainValue(user)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 안내 */}
          <div className="mt-10 p-6 bg-primary/5 border border-primary/20 rounded-2xl">
            <h4 className="font-semibold text-foreground mb-3">📌 랭킹 안내</h4>
            <ul className="text-sm text-foreground/70 space-y-1">
              <li>• <strong>포인트 랭킹</strong>: 보유 포인트 기준 순위</li>
              <li>• <strong>승률 랭킹</strong>: 10회 이상 참여자 중 적중률 기준 순위</li>
              <li>• <strong>연속 출석</strong>: 연속 출석 일수 기준 순위</li>
              <li>• 랭킹은 실시간으로 업데이트됩니다</li>
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

