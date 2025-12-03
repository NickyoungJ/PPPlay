import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

const MARKET_CREATION_COST = 1000;

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

    // 사용자 포인트 사전 확인
    const { data: userPoints, error: pointsError } = await supabase
      .from('user_points')
      .select('total_points')
      .eq('user_id', user.id)
      .single();

    if (pointsError || !userPoints) {
      return NextResponse.json(
        { error: '포인트 정보를 가져올 수 없습니다.' },
        { status: 500 }
      );
    }

    // 포인트 부족 사전 체크
    if (userPoints.total_points < MARKET_CREATION_COST) {
      return NextResponse.json(
        { 
          error: '포인트가 부족합니다.', 
          required: MARKET_CREATION_COST,
          available: userPoints.total_points 
        },
        { status: 400 }
      );
    }

    // 마켓 생성 (먼저 생성 후 포인트 차감)
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

    // RPC 함수로 포인트 차감 (트랜잭션 포함)
    const { data: deductResult, error: deductError } = await supabase
      .rpc('deduct_points_for_market_creation', {
        p_user_id: user.id,
        p_market_id: market.id,
        p_amount: MARKET_CREATION_COST
      });

    if (deductError) {
      console.error('포인트 차감 RPC 오류:', deductError);
      // 마켓 삭제 (롤백)
      await supabase.from('markets').delete().eq('id', market.id);
      return NextResponse.json(
        { error: '포인트 차감에 실패했습니다.' },
        { status: 500 }
      );
    }

    if (!deductResult?.success) {
      console.error('포인트 차감 실패:', deductResult);
      // 마켓 삭제 (롤백)
      await supabase.from('markets').delete().eq('id', market.id);
      return NextResponse.json(
        { 
          error: deductResult?.error || '포인트 차감에 실패했습니다.',
          required: MARKET_CREATION_COST,
          available: deductResult?.available
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '마켓이 생성되었습니다. 관리자 승인 후 활성화됩니다.',
      market,
      pointsDeducted: MARKET_CREATION_COST,
      remainingPoints: deductResult.remaining
    });
  } catch (error) {
    console.error('마켓 생성 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

