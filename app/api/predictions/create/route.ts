import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// 투표 참여 API (간소화된 투표 시스템)
// PRD: 참여 즉시 +5P, 적중 시 +20P
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // 디버깅 로그
    console.log('🔐 Auth Check:', {
      hasUser: !!user,
      userId: user?.id,
      authError: authError?.message,
    });

    if (authError || !user) {
      console.error('❌ 인증 실패:', authError);
      return NextResponse.json(
        { 
          error: '로그인이 필요합니다.',
          debug: {
            authError: authError?.message,
            hasUser: !!user,
          }
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { market_id, predicted_option } = body;

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

    // 일일 투표 제한 체크 (하루 10회)
    const { data: canVote, error: limitError } = await supabase
      .rpc('check_daily_vote_limit', { p_user_id: user.id });

    if (limitError) {
      console.error('일일 제한 체크 오류:', limitError);
      // 에러가 나도 일단 진행 (함수가 없을 수 있음)
    }

    if (canVote === false) {
      return NextResponse.json(
        { error: '오늘의 투표 횟수를 모두 사용했습니다. (하루 10회 제한)' },
        { status: 429 }
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

    // 중복 예측 확인
    const { data: existingPrediction } = await supabase
      .from('predictions')
      .select('id')
      .eq('user_id', user.id)
      .eq('market_id', market_id)
      .single();

    if (existingPrediction) {
      return NextResponse.json(
        { error: '이미 예측에 참여하셨습니다. (1인 1표)' },
        { status: 400 }
      );
    }

    // 예측 생성 (단순 투표)
    const { data: prediction, error: predictionError } = await supabase
      .from('predictions')
      .insert({
        user_id: user.id,
        market_id,
        predicted_option,
        participation_reward: 5,  // 참여 보상 +5P
        accuracy_reward: 0,       // 적중 보상 (결과 확정 후 +20P)
        market_closes_at: market.closes_at,
      })
      .select()
      .single();

    if (predictionError) {
      console.error('예측 생성 오류:', predictionError);
      
      // UNIQUE constraint 오류 (중복 예측)
      if (predictionError.code === '23505') {
        return NextResponse.json(
          { error: '이미 예측에 참여하셨습니다. (1인 1표)' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: '예측 참여에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 일일 투표 카운터 증가
    await supabase.rpc('increment_daily_vote_count', { p_user_id: user.id });

    // 마켓 통계 업데이트 (투표 수 증가)
    // 주의: 트리거(update_market_stats_on_vote)가 자동으로 처리하지만, 
    // 수동으로도 호출 가능
    await supabase.rpc('update_market_stats_for_poll', {
      p_market_id: market_id,
      p_option: predicted_option,
    });

    // 업데이트된 마켓 통계 조회
    const { data: updatedMarket } = await supabase
      .from('markets')
      .select('total_participants, yes_count, no_count, yes_percentage, no_percentage')
      .eq('id', market_id)
      .single();

    return NextResponse.json({
      success: true,
      message: '투표에 참여했습니다! +5P 적립 완료 🎉',
      prediction: {
        ...prediction,
        reward_info: {
          participation_reward: 5,  // 즉시 지급
          accuracy_reward: 20,      // 적중 시 지급 (예정)
          total_potential: 25,      // 최대 획득 가능 포인트
        }
      },
      market_stats: updatedMarket,
    });
  } catch (error) {
    console.error('투표 참여 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

