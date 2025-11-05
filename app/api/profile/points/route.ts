import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// 사용자 포인트 정보 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // 사용자 포인트 정보 조회
    const { data: userPoints, error: pointsError } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (pointsError) {
      console.error('포인트 조회 오류:', pointsError);
      return NextResponse.json({ error: '포인트 정보를 가져올 수 없습니다.' }, { status: 500 });
    }

    // 승률 계산
    const winRate = userPoints.total_predictions > 0 
      ? (userPoints.correct_predictions / userPoints.total_predictions * 100).toFixed(2)
      : '0.00';

    return NextResponse.json({
      success: true,
      data: {
        user_id: userPoints.user_id,
        // 현재 포인트
        rp_points: userPoints.rp_points,
        pp_points: userPoints.pp_points,
        wp_points: userPoints.wp_points,
        // 누적 통계
        total_earned_rp: userPoints.total_earned_rp,
        total_spent_rp: userPoints.total_spent_rp,
        total_earned_pp: userPoints.total_earned_pp,
        total_spent_pp: userPoints.total_spent_pp,
        total_earned_wp: userPoints.total_earned_wp,
        total_spent_wp: userPoints.total_spent_wp,
        // 예측 통계
        total_predictions: userPoints.total_predictions,
        correct_predictions: userPoints.correct_predictions,
        win_rate: winRate,
        // 레벨 & 티어
        level: userPoints.level,
        experience_points: userPoints.experience_points,
        next_level_exp: userPoints.next_level_exp,
        tier: userPoints.tier,
        // 로그인 통계
        last_login_at: userPoints.last_login_at,
        consecutive_login_days: userPoints.consecutive_login_days,
        total_login_days: userPoints.total_login_days,
        // 추천인
        referral_code: userPoints.referral_code,
        referred_by: userPoints.referred_by,
        referral_count: userPoints.referral_count,
        referral_rewards: userPoints.referral_rewards,
        // 생성일
        created_at: userPoints.created_at,
        updated_at: userPoints.updated_at,
      }
    });

  } catch (error) {
    console.error('포인트 조회 API 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

