import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// 예측 참여 API
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // 사용자 인증 확인
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

    const body = await request.json();
    const { market_id, predicted_option, points_spent = 10 } = body;

    // 필수 필드 검증
    if (!market_id || !predicted_option) {
      return NextResponse.json(
        { error: '필수 항목을 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    // 예측 옵션 검증
    if (predicted_option !== 'yes' && predicted_option !== 'no') {
      return NextResponse.json(
        { error: '올바른 예측 옵션을 선택해주세요. (yes 또는 no)' },
        { status: 400 }
      );
    }

    // 마켓 정보 조회
    const { data: market, error: marketError } = await supabase
      .from('markets')
      .select('*')
      .eq('id', market_id)
      .single();

    if (marketError || !market) {
      return NextResponse.json(
        { error: '마켓을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 마켓 상태 확인
    if (market.status !== 'active' && market.status !== 'approved') {
      return NextResponse.json(
        { error: '참여할 수 없는 마켓입니다.' },
        { status: 400 }
      );
    }

    // 마켓 마감 확인
    if (market.is_closed || new Date(market.closes_at) <= new Date()) {
      return NextResponse.json(
        { error: '이미 마감된 마켓입니다.' },
        { status: 400 }
      );
    }

    // 포인트 범위 검증
    if (points_spent < market.min_points || points_spent > market.max_points) {
      return NextResponse.json(
        { 
          error: `포인트는 ${market.min_points}P ~ ${market.max_points}P 사이여야 합니다.`,
          min: market.min_points,
          max: market.max_points,
        },
        { status: 400 }
      );
    }

    // 사용자 포인트 확인
    const { data: userPoints, error: pointsError } = await supabase
      .from('user_points')
      .select('available_points')
      .eq('user_id', user.id)
      .single();

    if (pointsError || !userPoints) {
      return NextResponse.json(
        { error: '포인트 정보를 가져올 수 없습니다.' },
        { status: 500 }
      );
    }

    // 포인트 부족 체크
    if (userPoints.available_points < points_spent) {
      return NextResponse.json(
        { 
          error: '포인트가 부족합니다.', 
          required: points_spent,
          available: userPoints.available_points 
        },
        { status: 400 }
      );
    }

    // 중복 예측 확인
    const { data: existingPrediction } = await supabase
      .from('predictions')
      .select('id')
      .eq('user_id', user.id)
      .eq('market_id', market_id)
      .single();

    if (existingPrediction) {
      return NextResponse.json(
        { error: '이미 예측에 참여하셨습니다.' },
        { status: 400 }
      );
    }

    // 예측 생성 (트리거가 자동으로 포인트 처리 및 통계 업데이트)
    const { data: prediction, error: predictionError } = await supabase
      .from('predictions')
      .insert({
        user_id: user.id,
        market_id,
        predicted_option,
        points_spent,
        market_closes_at: market.closes_at,
      })
      .select()
      .single();

    if (predictionError) {
      console.error('예측 생성 오류:', predictionError);
      
      // UNIQUE constraint 오류 (중복 예측)
      if (predictionError.code === '23505') {
        return NextResponse.json(
          { error: '이미 예측에 참여하셨습니다.' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: '예측 참여에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 업데이트된 마켓 통계 조회
    const { data: updatedMarket } = await supabase
      .from('markets')
      .select('total_participants, yes_count, no_count, total_points_pool')
      .eq('id', market_id)
      .single();

    return NextResponse.json({
      success: true,
      message: '예측에 참여했습니다!',
      prediction,
      market_stats: updatedMarket,
    });
  } catch (error) {
    console.error('예측 참여 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

