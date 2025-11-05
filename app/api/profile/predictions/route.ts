import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// 사용자 예측 내역 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // URL 쿼리 파라미터
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'active', 'settled', 'all'
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 예측 내역 조회 (마켓 정보 포함)
    let query = supabase
      .from('predictions')
      .select(`
        *,
        markets:market_id (
          id,
          title,
          description,
          category_slug,
          option_yes,
          option_no,
          status,
          result,
          closes_at,
          is_closed,
          yes_price,
          no_price,
          total_participants,
          yes_count,
          no_count
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // 상태 필터링
    if (status === 'active') {
      query = query.eq('is_settled', false);
    } else if (status === 'settled') {
      query = query.eq('is_settled', true);
    }

    // 페이지네이션
    query = query.range(offset, offset + limit - 1);

    const { data: predictions, error: predictionsError } = await query;

    if (predictionsError) {
      console.error('예측 내역 조회 오류:', predictionsError);
      return NextResponse.json({ error: '예측 내역을 가져올 수 없습니다.' }, { status: 500 });
    }

    // 전체 개수 조회
    let countQuery = supabase
      .from('predictions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (status === 'active') {
      countQuery = countQuery.eq('is_settled', false);
    } else if (status === 'settled') {
      countQuery = countQuery.eq('is_settled', true);
    }

    const { count } = await countQuery;

    // 예측 내역 가공
    const formattedPredictions = predictions.map((pred: any) => {
      const market = pred.markets;
      const isActive = !pred.is_settled && !market.is_closed;
      const potentialProfit = pred.potential_payout - pred.points_spent;
      
      return {
        id: pred.id,
        market_id: pred.market_id,
        market_title: market?.title || '알 수 없는 마켓',
        market_category: market?.category_slug || 'general',
        predicted_option: pred.predicted_option,
        option_label: pred.predicted_option === 'yes' ? market?.option_yes : market?.option_no,
        point_type: pred.point_type,
        points_spent: pred.points_spent,
        purchase_price: pred.purchase_price,
        shares: pred.shares,
        potential_payout: pred.potential_payout,
        potential_profit: potentialProfit,
        is_correct: pred.is_correct,
        is_settled: pred.is_settled,
        settled_at: pred.settled_at,
        reward_amount: pred.reward_amount,
        actual_profit: pred.reward_amount ? pred.reward_amount - pred.points_spent : null,
        created_at: pred.created_at,
        market_closes_at: pred.market_closes_at,
        market_status: market?.status,
        market_result: market?.result,
        is_active: isActive,
        // 현재 가격 (마켓이 활성 상태일 때만)
        current_yes_price: isActive ? market?.yes_price : null,
        current_no_price: isActive ? market?.no_price : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedPredictions,
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: (offset + limit) < (count || 0),
      }
    });

  } catch (error) {
    console.error('예측 내역 조회 API 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

