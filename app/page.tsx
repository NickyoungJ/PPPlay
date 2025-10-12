'use client';

import { useEffect, useState } from 'react';
import { supabaseClient } from '../utils/supabase/client';
import { useAuth } from './hooks/useAuth';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Link from 'next/link';

// Interfaces removed as they're not used in this component

export default function Home() {
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 경기 데이터 가져오기
      const { data: gamesData, error: gamesError } = await supabaseClient
        .from('games')
        .select(`
          *,
          sports(name)
        `)
        .order('start_time', { ascending: true });

      if (gamesError) {
        console.error('경기 데이터 로딩 오류:', gamesError);
      } else {
        setGames(gamesData || []);
      }

      // 리그 데이터 가져오기
      const { data: leaguesData, error: leaguesError } = await supabaseClient
        .from('leagues')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (leaguesError) {
        console.error('리그 데이터 로딩 오류:', leaguesError);
      } else {
        setLeagues(leaguesData || []);
      }
    } catch (error) {
      console.error('데이터 로딩 중 오류:', error);
    } finally {
      setLoading(false);
    }
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
      
      <main className="flex-grow">
        {/* 히어로 섹션 */}
        <section className="relative min-h-screen flex items-center px-4 md:px-8 overflow-hidden">
          {/* 배경 그라데이션 */}
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-purple-900/20"></div>
          
          <div className="relative max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* 왼쪽 콘텐츠 */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                  <span className="text-foreground">스포츠 승부를 </span>
                  <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                    예측하고 보상받으세요
                  </span>
                </h1>
                
                <p className="text-xl text-foreground/80 leading-relaxed max-w-2xl">
                  매일 진행되는 야구, 축구, 농구 경기의 승부를 예측하고 친구들과 경쟁하세요. 정확한 예측 코인을 획득하고 특별한 보상을 받아가세요.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                {isAuthenticated ? (
                  <Link 
                    href="/games"
                    className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-colors shadow-lg hover:shadow-xl text-center"
                  >
                    경기 예측하기
                  </Link>
                ) : (
                  <Link 
                    href="/auth"
                    className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-colors shadow-lg hover:shadow-xl text-center"
                  >
                    시작하기
                  </Link>
                )}
                <Link 
                  href="/games"
                  className="border-2 border-primary/30 text-primary px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-primary/10 transition-colors backdrop-blur-md text-center"
                >
                  둘러보기
                </Link>
              </div>

              {/* 통계 */}
              <div className="grid grid-cols-3 gap-8 pt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">15만+</div>
                  <div className="text-foreground/70 text-sm">활동 유저</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-secondary mb-2">3천+</div>
                  <div className="text-foreground/70 text-sm">프라이빗 리그</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent mb-2">95%</div>
                  <div className="text-foreground/70 text-sm">유저 만족도</div>
                </div>
              </div>
            </div>

            {/* 오른쪽 이미지 */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative">
                {/* 축구공 이미지 배경 */}
                <div className="w-96 h-96 bg-gradient-to-br from-green-400 to-green-600 rounded-3xl flex items-center justify-center shadow-2xl">
                  {/* 축구공 */}
                  <div className="w-48 h-48 bg-white rounded-full relative shadow-xl">
                    {/* 축구공 패턴 */}
                    <div className="absolute inset-0 rounded-full overflow-hidden">
                      <div className="w-full h-full relative">
                        {/* 오각형 패턴들 */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-black rounded-sm rotate-45"></div>
                        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-black rounded-sm rotate-12"></div>
                        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-black rounded-sm -rotate-12"></div>
                        <div className="absolute top-1/2 left-8 transform -translate-y-1/2 w-8 h-8 bg-black rounded-sm rotate-45"></div>
                        <div className="absolute top-1/2 right-8 transform -translate-y-1/2 w-8 h-8 bg-black rounded-sm -rotate-45"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 그림자 */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-8 bg-black/20 rounded-full blur-md"></div>
                </div>
                
                {/* 장식 요소들 */}
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-primary rounded-full animate-pulse"></div>
                <div className="absolute -bottom-4 -right-4 w-6 h-6 bg-secondary rounded-full animate-pulse delay-300"></div>
                <div className="absolute top-1/2 -right-8 w-4 h-4 bg-accent rounded-full animate-pulse delay-700"></div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}