import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// 마켓 생성 API
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
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
    const { title, description, category_slug, option_yes, option_no, closes_at } = body;

    // 필수 필드 검증
    if (!title || !category_slug || !option_yes || !option_no || !closes_at) {
      return NextResponse.json(
        { error: '필수 항목을 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    // 마감 시간 검증 (현재 시간보다 미래여야 함)
    const closingTime = new Date(closes_at);
    if (closingTime <= new Date()) {
      return NextResponse.json(
        { error: '마감 시간은 현재 시간보다 미래여야 합니다.' },
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
    const MARKET_CREATION_COST = 1000;
    if (userPoints.available_points < MARKET_CREATION_COST) {
      return NextResponse.json(
        { 
          error: '포인트가 부족합니다.', 
          required: MARKET_CREATION_COST,
          available: userPoints.available_points 
        },
        { status: 400 }
      );
    }

    // 마켓 생성
    const { data: market, error: marketError } = await supabase
      .from('markets')
      .insert({
        market_type: 'general',
        creator_id: user.id,
        title,
        description: description || null,
        category_slug,
        option_yes,
        option_no,
        closes_at,
        status: 'pending', // 관리자 승인 대기
        min_points: 10,
        max_points: 1000,
      })
      .select()
      .single();

    if (marketError) {
      console.error('마켓 생성 오류:', marketError);
      return NextResponse.json(
        { error: '마켓 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 포인트 차감 트랜잭션 생성
    const { error: transactionError } = await supabase
      .from('point_transactions')
      .insert({
        user_id: user.id,
        transaction_type: 'market_creation',
        amount: -MARKET_CREATION_COST,
        market_id: market.id,
        description: '마켓 개설',
        status: 'completed',
      });

    if (transactionError) {
      console.error('트랜잭션 생성 오류:', transactionError);
      // 마켓은 생성되었지만 트랜잭션 실패 (관리자가 수동으로 처리 필요)
    }

    return NextResponse.json({
      success: true,
      message: '마켓이 생성되었습니다. 관리자 승인 후 활성화됩니다.',
      market,
    });
  } catch (error) {
    console.error('마켓 생성 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

