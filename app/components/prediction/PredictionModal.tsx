'use client';

import { useState, useEffect } from 'react';
import { FaTimes, FaCoins, FaTrophy, FaCheck } from 'react-icons/fa';

interface Team {
  id: number;
  name: string;
  logo_url: string;
  primary_color: string;
  full_name: string;
}

interface Game {
  id: string;
  home_team: string;
  away_team: string;
  home_team_data?: Team | null;
  away_team_data?: Team | null;
  start_time: string;
  is_closed: boolean;
  sports: {
    name: string;
  };
}

interface Prediction {
  gameId: string;
  selectedTeam: 'home' | 'away';
}

interface PredictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  games: Game[];
  initialGameId?: string;
}

export default function PredictionModal({ isOpen, onClose, games, initialGameId }: PredictionModalProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [userCoins, setUserCoins] = useState(1250); // 임시 사용자 코인
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 예측 가능한 경기만 필터링
  const availableGames = games.filter(game => !game.is_closed);

  // 포인트 계산 로직
  const calculatePoints = (predictionCount: number): number => {
    const basePoints = 10;
    const multiplier = Math.pow(1.5, predictionCount - 1);
    return Math.floor(basePoints * multiplier);
  };

  const calculateRequiredCoins = (predictionCount: number): number => {
    return predictionCount * 50; // 경기당 50 코인
  };

  // 초기 게임이 있으면 자동 선택
  useEffect(() => {
    if (initialGameId && isOpen) {
      const existingPrediction = predictions.find(p => p.gameId === initialGameId);
      if (!existingPrediction) {
        // 초기 게임을 예측 목록에 추가하되 팀은 선택하지 않음
        // 사용자가 직접 선택하도록 함
      }
    }
  }, [initialGameId, isOpen]);

  const handleGameToggle = (gameId: string) => {
    const existingIndex = predictions.findIndex(p => p.gameId === gameId);
    
    if (existingIndex >= 0) {
      // 이미 선택된 경기면 제거
      setPredictions(prev => prev.filter(p => p.gameId !== gameId));
    } else {
      // 새로운 경기 추가 (팀은 아직 선택하지 않음)
      setPredictions(prev => [...prev, { gameId, selectedTeam: 'home' }]);
    }
  };

  const handleTeamSelection = (gameId: string, team: 'home' | 'away') => {
    setPredictions(prev => 
      prev.map(p => 
        p.gameId === gameId 
          ? { ...p, selectedTeam: team }
          : p
      )
    );
  };

  const handleSubmit = async () => {
    if (predictions.length === 0) return;

    const requiredCoins = calculateRequiredCoins(predictions.length);
    if (userCoins < requiredCoins) {
      alert('코인이 부족합니다!');
      return;
    }

    setIsSubmitting(true);

    try {
      // 예측 데이터를 API 형식에 맞게 변환
      const predictionData = predictions.map(prediction => {
        const game = games.find(g => g.id === prediction.gameId);
        return {
          gameId: prediction.gameId,
          selectedTeam: prediction.selectedTeam,
          homeTeam: game?.home_team,
          awayTeam: game?.away_team
        };
      });

      // API 호출로 예측 데이터 저장
      const response = await fetch('/api/predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          predictions: predictionData,
          userId: 'temp-user' // 임시 사용자 ID
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '예측 제출에 실패했습니다.');
      }

      // 성공시 코인 차감
      setUserCoins(prev => prev - requiredCoins);
      
      alert(`${predictions.length}개 경기 예측 완료!\n소모된 코인: ${requiredCoins}\n예상 획득 포인트: ${calculatePoints(predictions.length)}`);
      
      // 모달 닫기
      onClose();
      setPredictions([]);
      
    } catch (error) {
      console.error('예측 제출 실패:', error);
      alert(error instanceof Error ? error.message : '예측 제출에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const totalRequiredCoins = calculateRequiredCoins(predictions.length);
  const expectedPoints = predictions.length > 0 ? calculatePoints(predictions.length) : 0;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background/95 backdrop-blur-md rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/10 shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <FaTrophy className="text-2xl text-primary" />
            <h2 className="text-2xl font-bold text-foreground">승부예측</h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-background/40 rounded-full px-4 py-2 border border-primary/20">
              <FaCoins className="text-accent mr-2" />
              <span className="font-semibold text-foreground">{userCoins.toLocaleString()}</span>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-background/40 transition-colors"
            >
              <FaTimes className="text-foreground/70 hover:text-foreground" />
            </button>
          </div>
        </div>

        {/* 예측 정보 */}
        {predictions.length > 0 && (
          <div className="p-6 bg-primary/5 border-b border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-background/40 rounded-2xl p-4 border border-white/10">
                <div className="text-2xl font-bold text-primary">{predictions.length}</div>
                <div className="text-sm text-foreground/70">선택한 경기</div>
              </div>
              
              <div className="bg-background/40 rounded-2xl p-4 border border-white/10">
                <div className="text-2xl font-bold text-destructive">{totalRequiredCoins}</div>
                <div className="text-sm text-foreground/70">필요 코인</div>
              </div>
              
              <div className="bg-background/40 rounded-2xl p-4 border border-white/10">
                <div className="text-2xl font-bold text-accent">{expectedPoints}</div>
                <div className="text-sm text-foreground/70">예상 획득 포인트</div>
              </div>
            </div>
          </div>
        )}

        {/* 경기 목록 */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {availableGames.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl text-foreground/30 mb-4">⚾</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">예측 가능한 경기가 없습니다</h3>
              <p className="text-foreground/70">다른 날짜를 선택해보세요.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableGames.map((game) => {
                const isPredicting = predictions.some(p => p.gameId === game.id);
                const prediction = predictions.find(p => p.gameId === game.id);
                
                return (
                  <div
                    key={game.id}
                    className={`rounded-2xl border transition-all ${
                      isPredicting 
                        ? 'border-primary bg-primary/5' 
                        : 'border-white/10 bg-background/40'
                    }`}
                  >
                    {/* 경기 헤더 */}
                    <div className="p-4 border-b border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium">
                            {game.sports?.name || '야구'}
                          </span>
                          <span className="text-foreground/70 text-sm">
                            {new Date(game.start_time).toLocaleString('ko-KR', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        
                        <button
                          onClick={() => handleGameToggle(game.id)}
                          className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                            isPredicting
                              ? 'bg-primary text-white'
                              : 'border border-primary/50 text-primary hover:bg-primary/10'
                          }`}
                        >
                          {isPredicting ? (
                            <div className="flex items-center space-x-2">
                              <FaCheck />
                              <span>선택됨</span>
                            </div>
                          ) : (
                            '예측 참여'
                          )}
                        </button>
                      </div>
                    </div>

                    {/* 팀 선택 */}
                    {isPredicting && (
                      <div className="p-4">
                        <div className="grid grid-cols-2 gap-4">
                          {/* 원정팀 */}
                          <button
                            onClick={() => handleTeamSelection(game.id, 'away')}
                            className={`p-4 rounded-xl border-2 transition-all ${
                              prediction?.selectedTeam === 'away'
                                ? 'border-destructive bg-destructive/10'
                                : 'border-white/10 hover:border-destructive/50'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              {/* 팀 로고 */}
                              <div className="w-12 h-12 bg-background/40 rounded-full flex items-center justify-center border border-white/10">
                                {game.away_team_data?.logo_url ? (
                                  <img 
                                    src={game.away_team_data.logo_url} 
                                    alt={`${game.away_team_data.name} 로고`}
                                    className="w-8 h-8 object-contain"
                                  />
                                ) : (
                                  <div 
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                    style={{ backgroundColor: game.away_team_data?.primary_color || '#ef4444' }}
                                  >
                                    {game.away_team.charAt(0)}
                                  </div>
                                )}
                              </div>
                              
                              <div className="text-left">
                                <div className="font-semibold text-destructive">{game.away_team}</div>
                                <div className="text-xs text-foreground/70">원정팀</div>
                              </div>
                            </div>
                          </button>

                          {/* 홈팀 */}
                          <button
                            onClick={() => handleTeamSelection(game.id, 'home')}
                            className={`p-4 rounded-xl border-2 transition-all ${
                              prediction?.selectedTeam === 'home'
                                ? 'border-primary bg-primary/10'
                                : 'border-white/10 hover:border-primary/50'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              {/* 팀 로고 */}
                              <div className="w-12 h-12 bg-background/40 rounded-full flex items-center justify-center border border-white/10">
                                {game.home_team_data?.logo_url ? (
                                  <img 
                                    src={game.home_team_data.logo_url} 
                                    alt={`${game.home_team_data.name} 로고`}
                                    className="w-8 h-8 object-contain"
                                  />
                                ) : (
                                  <div 
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                    style={{ backgroundColor: game.home_team_data?.primary_color || '#ff4081' }}
                                  >
                                    {game.home_team.charAt(0)}
                                  </div>
                                )}
                              </div>
                              
                              <div className="text-left">
                                <div className="font-semibold text-primary">{game.home_team}</div>
                                <div className="text-xs text-foreground/70">홈팀</div>
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        {predictions.length > 0 && (
          <div className="p-6 border-t border-white/10 bg-background/40">
            <div className="flex items-center justify-between">
              <div className="text-sm text-foreground/70">
                {predictions.length}개 경기 • {totalRequiredCoins} 코인 • 최대 {expectedPoints} 포인트
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setPredictions([])}
                  className="px-6 py-3 rounded-xl border border-white/20 text-foreground/70 hover:bg-background/40 transition-colors"
                >
                  초기화
                </button>
                
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || userCoins < totalRequiredCoins}
                  className="px-6 py-3 rounded-xl bg-primary hover:bg-primary/80 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '제출 중...' : '예측 제출'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
