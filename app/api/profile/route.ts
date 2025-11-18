import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// 마이페이지 데이터 조회 API
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 🔥 임시: 테스트 사용자 ID 사용
    const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';
    const user = { id: TEST_USER_ID };
    
    /*
    // 실제 인증 (나중에 활성화)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }
    */

    // 1. 포인트 정보 조회
    const { data: userPoints, error: pointsError } = await supabase
      .from('user_points')
      .select('total_points, available_points, daily_votes, total_predictions, correct_predictions, win_rate')
      .eq('user_id', user.id)
      .single();

    if (pointsError) {
      console.error('포인트 조회 오류:', pointsError);
      return NextResponse.json(
        { error: '포인트 정보를 불러올 수 없습니다.' },
        { status: 500 }
      );
    }

    // 2. 최근 투표 내역 조회 (최근 5개)
    const { data: recentPredictions, error: predictionsError } = await supabase
      .from('predictions')
      .select(`
        id,
        predicted_option,
        participation_reward,
        accuracy_reward,
        created_at,
        markets (
          id,
          title,
          result,
          is_closed,
          option_yes,
          option_no
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (predictionsError) {
      console.error('투표 내역 조회 오류:', predictionsError);
    }

    return NextResponse.json({
      success: true,
      profile: {
        // 포인트 현황
        points: {
          total: userPoints?.total_points || 0,
          available: userPoints?.available_points || 0,
          daily_votes: userPoints?.daily_votes || 0,
          daily_limit: 10,
        },
        // 투표 통계
        stats: {
          total_votes: userPoints?.total_predictions || 0,
          correct_votes: userPoints?.correct_predictions || 0,
          win_rate: userPoints?.win_rate || 0,
        },
        // 최근 투표 내역
        recent_predictions: recentPredictions || [],
      },
    });
  } catch (error) {
    console.error('프로필 조회 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

