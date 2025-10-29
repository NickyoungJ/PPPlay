import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// 예측 참여 API (RP/PP 주식 시스템)
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
    const { market_id, predicted_option, shares = 1, point_type = 'RP' } = body;

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

    // 포인트 타입 검증
    if (point_type !== 'RP' && point_type !== 'PP') {
      return NextResponse.json(
        { error: '올바른 포인트 타입을 선택해주세요. (RP 또는 PP)' },
        { status: 400 }
      );
    }

    // 주식 수 검증
    if (shares < 1 || shares > 100) {
      return NextResponse.json(
        { error: '주식 수는 1~100 사이여야 합니다.' },
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

    // 주식 가격 계산 (1주 = 현재 가격)
    const purchase_price = predicted_option === 'yes' ? market.yes_price : market.no_price;
    const total_cost = purchase_price * shares;
    const potential_payout = 100 * shares; // 정답 시 주식당 100P

    // 포인트 범위 검증
    if (total_cost < market.min_points || total_cost > market.max_points) {
      return NextResponse.json(
        { 
          error: `총 비용은 ${market.min_points}P ~ ${market.max_points}P 사이여야 합니다.`,
          min: market.min_points,
          max: market.max_points,
          your_cost: total_cost,
        },
        { status: 400 }
      );
    }

    // 사용자 포인트 확인
    const { data: userPoints, error: pointsError } = await supabase
      .from('user_points')
      .select('rp_points, pp_points')
      .eq('user_id', user.id)
      .single();

    if (pointsError || !userPoints) {
      return NextResponse.json(
        { error: '포인트 정보를 가져올 수 없습니다.' },
        { status: 500 }
      );
    }

    // 포인트 부족 체크
    const available_points = point_type === 'RP' ? userPoints.rp_points : userPoints.pp_points;
    if (available_points < total_cost) {
      return NextResponse.json(
        { 
          error: `${point_type} 포인트가 부족합니다.`, 
          required: total_cost,
          available: available_points 
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

    // 예측 생성 (주식 시스템)
    const { data: prediction, error: predictionError } = await supabase
      .from('predictions')
      .insert({
        user_id: user.id,
        market_id,
        predicted_option,
        points_spent: total_cost,
        purchase_price,
        shares,
        potential_payout,
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

    // 포인트 트랜잭션 생성
    const { error: transactionError } = await supabase
      .from('point_transactions')
      .insert({
        user_id: user.id,
        transaction_type: 'prediction_spent',
        point_type,
        amount: -total_cost,
        market_id,
        prediction_id: prediction.id,
        description: `예측 참여: ${market.title} (${predicted_option.toUpperCase()})`,
        status: 'completed',
      });

    if (transactionError) {
      console.error('트랜잭션 생성 오류:', transactionError);
      // 예측은 생성되었지만 트랜잭션 실패 - 롤백 필요
      await supabase.from('predictions').delete().eq('id', prediction.id);
      return NextResponse.json(
        { error: '포인트 차감에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 마켓 통계 업데이트
    const updateField = predicted_option === 'yes' ? 'yes_count' : 'no_count';
    const sharesField = predicted_option === 'yes' ? 'yes_shares' : 'no_shares';
    
    await supabase.rpc('update_market_stats', {
      p_market_id: market_id,
      p_option: predicted_option,
      p_shares: shares,
      p_points: total_cost,
    });

    // 업데이트된 마켓 통계 조회
    const { data: updatedMarket } = await supabase
      .from('markets')
      .select('total_participants, yes_count, no_count, yes_shares, no_shares, yes_price, no_price, total_points_pool')
      .eq('id', market_id)
      .single();

    return NextResponse.json({
      success: true,
      message: '예측에 참여했습니다!',
      prediction: {
        ...prediction,
        purchase_info: {
          shares,
          price_per_share: purchase_price,
          total_cost,
          potential_payout,
          potential_profit: potential_payout - total_cost,
        }
      },
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

