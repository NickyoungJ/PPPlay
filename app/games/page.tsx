'use client';

import { useState, useEffect } from 'react';
import { supabaseClient } from '../../utils/supabase/client';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

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
  home_score: number | null;
  away_score: number | null;
  start_time: string;
  result: string | null;
  is_closed: boolean;
  sports: {
    name: string;
  };
}


type MainTab = "games" | "ranking";
type SportFilter = "all" | "baseball" | "soccer" | "basketball" | "volleyball";

export default function GamesPage() {
  const [mainTab, setMainTab] = useState<MainTab>("games");
  const [selectedSport, setSelectedSport] = useState<SportFilter>("baseball");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPredictions, setSelectedPredictions] = useState<{[gameId: string]: 'home' | 'away'}>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      let gamesData = [];
      let gamesError = null;

      // 배구인 경우 volleyball_games 테이블에서 가져오기
      if (selectedSport === "volleyball") {
        const { data, error } = await supabaseClient
          .from('volleyball_games')
          .select('*')
          .order('start_time', { ascending: true });
        
        gamesData = data;
        gamesError = error;
      } else if (selectedSport === "soccer") {
        // 축구인 경우 soccer_games 테이블에서 가져오기
        const { data, error } = await supabaseClient
          .from('soccer_games')
          .select('*')
          .order('start_time', { ascending: true });
        
        gamesData = data;
        gamesError = error;
      } else {
        // 기존 games 테이블에서 가져오기
        let gamesQuery = supabaseClient
          .from('games')
          .select(`
            *,
            sports(name)
          `)
          .order('start_time', { ascending: true });

        // Filter by sport
        if (selectedSport !== "all") {
          const sportIdMap: Record<SportFilter, number> = {
            "all": 0,
            "baseball": 1,
            "soccer": 2,
            "basketball": 3,
            "volleyball": 4,
          };
          gamesQuery = gamesQuery.eq('sport_id', sportIdMap[selectedSport]);
        }

        const { data, error } = await gamesQuery;
        gamesData = data;
        gamesError = error;
      }

      if (gamesError) {
        console.error('경기 데이터 로딩 오류:', gamesError);
        setGames([]);
      } else {
        console.log('✅ 가져온 전체 경기 데이터:', gamesData?.length || 0, '개');
        
        // 팀 데이터 가져오기 (스포츠별로 다른 테이블)
        let teamsData = [];
        let teamsError = null;

        if (selectedSport === "volleyball") {
          const { data, error } = await supabaseClient
            .from('volleyball_teams')
            .select('*');
          teamsData = data;
          teamsError = error;
        } else if (selectedSport === "soccer") {
          const { data, error } = await supabaseClient
            .from('soccer_teams')
            .select('*');
          teamsData = data;
          teamsError = error;
        } else {
          const { data, error } = await supabaseClient
            .from('KBO_teams')
            .select('*');
          teamsData = data;
          teamsError = error;
        }

        let processedGames = gamesData || [];

        // 팀 데이터가 있으면 매핑
        if (teamsData && !teamsError) {
          console.log('✅ 팀 데이터 로드:', teamsData.length, '개');
          console.log('📋 팀 데이터:', teamsData.map(t => `${t.name}: ${t.logo_url ? '로고있음' : '로고없음'}`));
          
          processedGames = gamesData?.map(game => {
            // 팀명으로 팀 정보 찾기
            const homeTeamData = teamsData.find(team => team.name === game.home_team);
            const awayTeamData = teamsData.find(team => team.name === game.away_team);
            
            console.log(`🏠 ${game.home_team} -> ${homeTeamData ? '매칭됨' : '매칭안됨'}${homeTeamData?.logo_url ? ' (로고있음)' : ''}`);
            console.log(`🏃 ${game.away_team} -> ${awayTeamData ? '매칭됨' : '매칭안됨'}${awayTeamData?.logo_url ? ' (로고있음)' : ''}`);
            
            return {
              ...game,
              home_team_data: homeTeamData || null,
              away_team_data: awayTeamData || null
            };
          }) || [];
        } else {
          console.warn('팀 데이터 로딩 실패:', teamsError);
        }
        
        // 선택된 날짜에 맞는 경기만 필터링 (클라이언트 사이드)
        const filteredGames = processedGames?.filter(game => {
          const gameDate = new Date(game.start_time);
          const selectedDateStr = selectedDate.toDateString();
          const gameDateStr = gameDate.toDateString();
          return selectedDateStr === gameDateStr;
        }) || [];
        
        console.log(`📅 ${selectedDate.toLocaleDateString('ko-KR')} 경기:`, filteredGames.length, '개');
        setGames(filteredGames);
      }
    } catch (error) {
      console.error('데이터 로딩 중 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate, selectedSport]);

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const handleTeamSelect = (gameId: string, team: 'home' | 'away') => {
    if (selectedPredictions[gameId] === team) {
      // 같은 팀을 다시 클릭하면 선택 해제
      const newPredictions = { ...selectedPredictions };
      delete newPredictions[gameId];
      setSelectedPredictions(newPredictions);
    } else {
      // 새로운 팀 선택
      setSelectedPredictions(prev => ({
        ...prev,
        [gameId]: team
      }));
    }
  };

  const handleFinalPredict = () => {
    if (Object.keys(selectedPredictions).length === 0) {
      alert('예측할 경기를 선택해주세요!');
      return;
    }
    setShowConfirmModal(true);
  };

  const submitAllPredictions = async () => {
    try {
      const predictionData = Object.entries(selectedPredictions).map(([gameId, team]) => {
        const game = games.find(g => g.id === gameId);
        return {
          gameId: gameId,
          selectedTeam: team,
          homeTeam: game?.home_team,
          awayTeam: game?.away_team
        };
      });

      const response = await fetch('/api/predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          predictions: predictionData,
          userId: 'temp-user'
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '예측 제출에 실패했습니다.');
      }

      const totalCoins = Object.keys(selectedPredictions).length * 50;
      const expectedPoints = calculatePoints(Object.keys(selectedPredictions).length);
      
      alert(`✅ ${Object.keys(selectedPredictions).length}개 경기 예측 완료!\n소모된 코인: ${totalCoins}\n예상 획득 포인트: ${expectedPoints}`);
      
      // 선택 초기화
      setSelectedPredictions({});
      setShowConfirmModal(false);
      
    } catch (error) {
      console.error('예측 제출 실패:', error);
      alert(error instanceof Error ? error.message : '예측 제출에 실패했습니다.');
    }
  };

  const calculatePoints = (predictionCount: number): number => {
    const basePoints = 10;
    const multiplier = Math.pow(1.5, predictionCount - 1);
    return Math.floor(basePoints * multiplier);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/70">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-grow py-10 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          {/* 설명 텍스트 */}
          <div className="text-center mb-10">
            <p className="text-lg text-foreground/80">
              다양한 스포츠 경기의 승부를 예측하고 코인을 획득하세요. 경기 시작 전까지 언제든지 예측을 변경할 수 있습니다.
            </p>
          </div>

          {/* 메인 탭 */}
          <div className="flex justify-center mb-10">
            <div className="bg-background/70 backdrop-blur-md rounded-2xl p-1 border border-white/10">
              <div className="flex">
                <button
                  onClick={() => setMainTab('games')}
                  className={`px-8 py-3 rounded-xl font-semibold transition-all ${
                    mainTab === 'games'
                      ? 'bg-primary text-white shadow-lg'
                      : 'text-foreground/70 hover:text-primary'
                  }`}
                >
                  오늘의 경기
                </button>
                <button
                  onClick={() => setMainTab('ranking')}
                  className={`px-8 py-3 rounded-xl font-semibold transition-all ${
                    mainTab === 'ranking'
                      ? 'bg-primary text-white shadow-lg'
                      : 'text-foreground/70 hover:text-primary'
                  }`}
                >
                  랭킹
                </button>
              </div>
            </div>
          </div>

          {/* 오늘의 경기 탭 */}
          {mainTab === 'games' && (
            <div className="space-y-8">
              {/* 날짜 네비게이션 */}
              <div className="flex justify-between items-center bg-background/70 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                <button 
                  onClick={goToPreviousDay}
                  className="flex items-center px-4 py-2 text-foreground/70 hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
                >
                  <FaChevronLeft className="mr-2" /> 이전 날짜
                </button>
                <h2 className="text-xl font-bold text-foreground">{formatDisplayDate(selectedDate)}</h2>
                <button 
                  onClick={goToNextDay}
                  className="flex items-center px-4 py-2 text-foreground/70 hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
                >
                  다음 날짜 <FaChevronRight className="ml-2" />
                </button>
              </div>

              {/* 스포츠 필터 */}
              <div className="flex justify-center">
                <div className="bg-background/70 backdrop-blur-md rounded-2xl p-1 border border-white/10">
                  <div className="flex">
                    <button
                      onClick={() => setSelectedSport('baseball')}
                      className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                        selectedSport === 'baseball'
                          ? 'bg-primary text-white shadow-lg'
                          : 'text-foreground/70 hover:text-primary'
                      }`}
                    >
                      야구
                    </button>
                    <button
                      onClick={() => setSelectedSport('soccer')}
                      className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                        selectedSport === 'soccer'
                          ? 'bg-primary text-white shadow-lg'
                          : 'text-foreground/70 hover:text-primary'
                      }`}
                    >
                      축구
                    </button>
                    <button
                      onClick={() => setSelectedSport('basketball')}
                      className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                        selectedSport === 'basketball'
                          ? 'bg-primary text-white shadow-lg'
                          : 'text-foreground/70 hover:text-primary'
                      }`}
                    >
                      농구
                    </button>
                    <button
                      onClick={() => setSelectedSport('volleyball')}
                      className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                        selectedSport === 'volleyball'
                          ? 'bg-primary text-white shadow-lg'
                          : 'text-foreground/70 hover:text-primary'
                      }`}
                    >
                      배구
                    </button>
                  </div>
                </div>
              </div>

              {/* 경기가 없을 때 */}
              {games.length === 0 && !loading && (
                <div className="text-center py-20">
                  {/* 야구공 아이콘 */}
                  <div className="w-24 h-24 bg-white rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
                    <div className="w-16 h-16 bg-white rounded-full relative">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-sm rotate-45"></div>
                      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-red-500 rounded-sm"></div>
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-red-500 rounded-sm"></div>
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-foreground mb-4">경기가 없습니다</h3>
                  <p className="text-foreground/70 mb-4">
                    선택한 조건에 맞는 경기가 없습니다.
                  </p>
                  <p className="text-foreground/50 mb-8 text-sm">
                    다른 날짜나 스포츠를 선택해보세요.
                  </p>
                  
                  <div className="flex justify-center space-x-4">
                    <button 
                      onClick={goToPreviousDay}
                      className="bg-background/70 hover:bg-background/90 text-foreground px-6 py-3 rounded-2xl font-medium transition-colors border border-white/10"
                    >
                      이전 날짜
                    </button>
                    <button 
                      onClick={goToNextDay}
                      className="bg-background/70 hover:bg-background/90 text-foreground px-6 py-3 rounded-2xl font-medium transition-colors border border-white/10"
                    >
                      다음 날짜
                    </button>
                  </div>
                </div>
              )}

              {/* 경기 목록 */}
              {games.length > 0 && (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <p className="text-foreground/70">
                      총 {games.length}개의 경기가 있습니다.
                    </p>
                    {games.some(game => !game.is_closed) && (
                      <p className="text-primary/70 text-sm mt-2">
                        팀 로고나 팀명을 클릭해서 승리 팀을 예측하세요! ⚾
                      </p>
                    )}
                  </div>
                  {games.map((game, index) => (
                    <div key={game.id || index} className="bg-background/70 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-primary/20 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-3">
                            <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium border border-primary/20">
                              {game.sports?.name || '야구'}
                            </span>
                            <span className="text-foreground/70 text-sm">
                              {new Date(game.start_time).toLocaleTimeString('ko-KR', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: false
                              })}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              game.is_closed ? 'bg-muted text-foreground/70' : 'bg-primary/20 text-primary'
                            }`}>
                              {game.is_closed ? '종료' : '예측가능'}
                            </span>
                          </div>
                          
          <div className="flex items-center justify-center mb-4">
            {/* 원정팀 */}
            <button
              onClick={() => !game.is_closed && handleTeamSelect(game.id, 'away')}
              disabled={game.is_closed}
              className={`flex items-center space-x-3 p-3 rounded-2xl transition-all ${
                game.is_closed 
                  ? 'cursor-not-allowed opacity-70' 
                  : selectedPredictions[game.id] === 'away'
                    ? 'bg-destructive/20 border-destructive scale-105 border-2'
                    : 'hover:bg-destructive/10 hover:scale-105 cursor-pointer border border-transparent hover:border-destructive/30'
              }`}
            >
              {/* 팀 로고 */}
              <div className="w-16 h-16 bg-background/40 rounded-full flex items-center justify-center border border-white/10">
                {game.away_team_data?.logo_url ? (
                  <img 
                    src={game.away_team_data.logo_url} 
                    alt={`${game.away_team_data.name} 로고`}
                    className="w-12 h-12 object-contain rounded-full"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                {/* 로고가 없을 때 팀명 첫 글자 */}
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ 
                    backgroundColor: game.away_team_data?.primary_color || '#ef4444',
                    display: game.away_team_data?.logo_url ? 'none' : 'flex'
                  }}
                >
                  {game.away_team.charAt(0)}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold text-destructive">
                  {game.away_team}
                </div>
                {game.is_closed && game.away_score !== null && (
                  <div className="text-2xl font-bold text-destructive">
                    {game.away_score}
                  </div>
                )}
                {!game.is_closed && (
                  <div className="text-xs text-destructive/70 mt-1">
                    {selectedPredictions[game.id] === 'away' ? '✓ 선택됨' : '클릭해서 선택'}
                  </div>
                )}
              </div>
            </button>

            {/* VS 또는 점수 구분자 */}
            <div className="mx-8 text-center">
              {game.is_closed && game.away_score !== null && game.home_score !== null ? (
                <div className="text-foreground/40 text-2xl font-bold">:</div>
              ) : (
                <div className="text-foreground/40 text-lg font-medium bg-background/40 rounded-full px-4 py-2 border border-white/10">VS</div>
              )}
            </div>

            {/* 홈팀 */}
            <button
              onClick={() => !game.is_closed && handleTeamSelect(game.id, 'home')}
              disabled={game.is_closed}
              className={`flex items-center space-x-3 p-3 rounded-2xl transition-all ${
                game.is_closed 
                  ? 'cursor-not-allowed opacity-70' 
                  : selectedPredictions[game.id] === 'home'
                    ? 'bg-primary/20 border-primary scale-105 border-2'
                    : 'hover:bg-primary/10 hover:scale-105 cursor-pointer border border-transparent hover:border-primary/30'
              }`}
            >
              <div className="text-center">
                <div className="text-lg font-bold text-primary">
                  {game.home_team}
                </div>
                {game.is_closed && game.home_score !== null && (
                  <div className="text-2xl font-bold text-primary">
                    {game.home_score}
                  </div>
                )}
                {!game.is_closed && (
                  <div className="text-xs text-primary/70 mt-1">
                    {selectedPredictions[game.id] === 'home' ? '✓ 선택됨' : '클릭해서 선택'}
                  </div>
                )}
              </div>
              
              {/* 팀 로고 */}
              <div className="w-16 h-16 bg-background/40 rounded-full flex items-center justify-center border border-white/10">
                {game.home_team_data?.logo_url ? (
                  <img 
                    src={game.home_team_data.logo_url} 
                    alt={`${game.home_team_data.name} 로고`}
                    className="w-12 h-12 object-contain rounded-full"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                {/* 로고가 없을 때 팀명 첫 글자 */}
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ 
                    backgroundColor: game.home_team_data?.primary_color || '#ff4081',
                    display: game.home_team_data?.logo_url ? 'none' : 'flex'
                  }}
                >
                  {game.home_team.charAt(0)}
                </div>
              </div>
            </button>
          </div>
                          
                          {game.is_closed && game.away_score !== null && game.home_score !== null && (
                            <div className="text-center text-sm text-foreground/70 bg-background/40 rounded-lg px-3 py-2 border border-white/10">
                              {game.result === '1' ? 
                                `${game.home_team} 승리` : 
                               game.result === '2' ? 
                                `${game.away_team} 승리` : '무승부'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 하단 예측하기 버튼 */}
              {games.some(game => !game.is_closed) && (
                <div className="sticky bottom-6 mt-8">
                  <div className="bg-background/90 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-2xl">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-foreground/70">
                        {Object.keys(selectedPredictions).length > 0 ? (
                          <>
                            <span className="font-semibold text-primary">{Object.keys(selectedPredictions).length}개 경기</span> 선택됨
                            <br />
                            소모 코인: <span className="font-semibold text-destructive">{Object.keys(selectedPredictions).length * 50}</span> • 
                            예상 포인트: <span className="font-semibold text-accent">{calculatePoints(Object.keys(selectedPredictions).length)}</span>
                          </>
                        ) : (
                          '팀을 선택해서 예측에 참여하세요'
                        )}
                      </div>
                      
                      <button
                        onClick={handleFinalPredict}
                        disabled={Object.keys(selectedPredictions).length === 0}
                        className={`px-8 py-4 rounded-2xl font-bold transition-all ${
                          Object.keys(selectedPredictions).length > 0
                            ? 'bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 text-white shadow-lg scale-105'
                            : 'bg-gray-500/50 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        예측하기
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 랭킹 탭 */}
          {mainTab === 'ranking' && (
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold text-foreground mb-4">랭킹 기능 준비중</h2>
              <p className="text-foreground/70">곧 멋진 랭킹 시스템으로 찾아뵙겠습니다!</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
      
      {/* 예측 확인 모달 */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background/95 backdrop-blur-md rounded-3xl max-w-lg w-full border border-white/10 shadow-2xl">
            {/* 헤더 */}
            <div className="p-6 border-b border-white/10">
              <h2 className="text-2xl font-bold text-foreground text-center">예측 확인</h2>
            </div>

            {/* 선택된 예측 목록 */}
            <div className="p-6 max-h-96 overflow-y-auto">
              <p className="text-foreground/70 text-center mb-4">
                선택하신 예측이 맞나요?
              </p>
              
              <div className="space-y-3">
                {Object.entries(selectedPredictions).map(([gameId, team]) => {
                  const game = games.find(g => g.id === gameId);
                  if (!game) return null;
                  
                  const selectedTeamName = team === 'home' ? game.home_team : game.away_team;
                  const selectedTeamColor = team === 'home' ? 'text-primary' : 'text-destructive';
                  
                  return (
                    <div key={gameId} className="bg-background/40 rounded-2xl p-4 border border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-foreground/70">
                          {game.away_team} vs {game.home_team}
                        </div>
                        <div className={`font-bold ${selectedTeamColor}`}>
                          {selectedTeamName} 승리
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 비용 정보 */}
              <div className="mt-6 bg-primary/5 rounded-2xl p-4 border border-primary/20">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-destructive">
                      {Object.keys(selectedPredictions).length * 50}
                    </div>
                    <div className="text-xs text-foreground/70">소모 코인</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-accent">
                      {calculatePoints(Object.keys(selectedPredictions).length)}
                    </div>
                    <div className="text-xs text-foreground/70">예상 포인트</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 하단 버튼 */}
            <div className="p-6 border-t border-white/10">
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-6 py-3 rounded-2xl border border-white/20 text-foreground/70 hover:bg-background/40 transition-colors"
                >
                  취소
                </button>
                
                <button
                  onClick={submitAllPredictions}
                  className="flex-1 px-6 py-3 rounded-2xl bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 text-white font-bold transition-all shadow-lg"
                >
                  예측 확정
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}