import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// 리더보드 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const type = searchParams.get('type') || 'points'; // points, winRate, streak
    const limit = parseInt(searchParams.get('limit') || '50');

    // 현재 로그인한 사용자 확인
    const { data: { user } } = await supabase.auth.getUser();

    let query;
    
    if (type === 'points') {
      // 포인트 랭킹
      query = supabase
        .from('user_points')
        .select(`
          user_id,
          total_points,
          total_votes,
          correct_votes,
          consecutive_login_days,
          nickname
        `)
        .order('total_points', { ascending: false })
        .limit(limit);
    } else if (type === 'winRate') {
      // 승률 랭킹 (최소 10회 이상 참여자만)
      query = supabase
        .from('user_points')
        .select(`
          user_id,
          total_points,
          total_votes,
          correct_votes,
          consecutive_login_days,
          nickname
        `)
        .gte('total_votes', 10)
        .order('correct_votes', { ascending: false })
        .limit(limit);
    } else if (type === 'streak') {
      // 연속 출석 랭킹
      query = supabase
        .from('user_points')
        .select(`
          user_id,
          total_points,
          total_votes,
          correct_votes,
          consecutive_login_days,
          nickname
        `)
        .order('consecutive_login_days', { ascending: false })
        .limit(limit);
    } else {
      return NextResponse.json(
        { error: '유효하지 않은 랭킹 타입입니다.' },
        { status: 400 }
      );
    }

    const { data: rankings, error } = await query;

    if (error) {
      console.error('리더보드 조회 오류:', error);
      return NextResponse.json(
        { error: '리더보드를 불러올 수 없습니다.' },
        { status: 500 }
      );
    }

    // 랭킹 데이터 가공 (닉네임은 user_points에서 직접 가져옴)
    const enrichedRankings = (rankings || []).map((ranking, index) => {
      const winRate = ranking.total_votes > 0 
        ? Math.round((ranking.correct_votes / ranking.total_votes) * 100) 
        : 0;

      return {
        rank: index + 1,
        userId: ranking.user_id,
        nickname: ranking.nickname || `익명${ranking.user_id.slice(0, 4)}`,
        avatarUrl: null,
        totalPoints: ranking.total_points,
        totalVotes: ranking.total_votes,
        correctVotes: ranking.correct_votes,
        winRate,
        consecutiveDays: ranking.consecutive_login_days || 0,
        isCurrentUser: user?.id === ranking.user_id,
      };
    });

    // 현재 사용자의 랭킹 찾기
    let myRanking = null;
    if (user) {
      const myIndex = enrichedRankings.findIndex(r => r.isCurrentUser);
      if (myIndex !== -1) {
        myRanking = enrichedRankings[myIndex];
      } else {
        // 상위 랭킹에 없는 경우 별도 조회
        const { data: myData } = await supabase
          .from('user_points')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (myData) {
          // 내 순위 계산
          if (type === 'points') {
            const { count } = await supabase
              .from('user_points')
              .select('*', { count: 'exact', head: true })
              .gt('total_points', myData.total_points);
            
            myRanking = {
              rank: (count || 0) + 1,
              userId: user.id,
              nickname: myData.nickname || `익명${user.id.slice(0, 4)}`,
              avatarUrl: null,
              totalPoints: myData.total_points,
              totalVotes: myData.total_votes,
              correctVotes: myData.correct_votes,
              winRate: myData.total_votes > 0 
                ? Math.round((myData.correct_votes / myData.total_votes) * 100) 
                : 0,
              consecutiveDays: myData.consecutive_login_days || 0,
              isCurrentUser: true,
            };
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      type,
      rankings: enrichedRankings,
      myRanking,
      total: enrichedRankings.length,
    });
  } catch (error) {
    console.error('리더보드 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

