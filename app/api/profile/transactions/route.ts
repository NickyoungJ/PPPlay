import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// 포인트 거래 내역 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // URL 쿼리 파라미터
    const { searchParams } = new URL(request.url);
    const point_type = searchParams.get('point_type'); // 'RP', 'PP', 'WP', 'all'
    const transaction_type = searchParams.get('transaction_type'); // 'daily_login', 'prediction_spent', etc.
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 거래 내역 조회
    let query = supabase
      .from('point_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // 포인트 타입 필터링
    if (point_type && point_type !== 'all') {
      query = query.eq('point_type', point_type);
    }

    // 거래 타입 필터링
    if (transaction_type) {
      query = query.eq('transaction_type', transaction_type);
    }

    // 페이지네이션
    query = query.range(offset, offset + limit - 1);

    const { data: transactions, error: transactionsError } = await query;

    if (transactionsError) {
      console.error('거래 내역 조회 오류:', transactionsError);
      return NextResponse.json({ error: '거래 내역을 가져올 수 없습니다.' }, { status: 500 });
    }

    // 전체 개수 조회
    let countQuery = supabase
      .from('point_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (point_type && point_type !== 'all') {
      countQuery = countQuery.eq('point_type', point_type);
    }

    if (transaction_type) {
      countQuery = countQuery.eq('transaction_type', transaction_type);
    }

    const { count } = await countQuery;

    // 거래 내역 가공
    const formattedTransactions = transactions.map((tx: any) => {
      // 거래 타입별 아이콘 & 라벨
      const typeLabels: Record<string, { icon: string; label: string }> = {
        'daily_login': { icon: '🎁', label: '일일 로그인' },
        'consecutive_bonus': { icon: '🔥', label: '연속 출석 보너스' },
        'ad_reward': { icon: '📺', label: '광고 시청 보상' },
        'referral_signup': { icon: '👥', label: '친구 초대 보상' },
        'referral_activity': { icon: '🎉', label: '친구 활동 보상' },
        'prediction_spent': { icon: '🎲', label: '예측 참여' },
        'prediction_reward': { icon: '💰', label: '예측 성공 보상' },
        'prediction_refund': { icon: '↩️', label: '예측 환불' },
        'market_creation': { icon: '📝', label: '마켓 생성' },
        'creator_bonus': { icon: '🏆', label: '마켓 생성자 보너스' },
        'level_up_bonus': { icon: '⬆️', label: '레벨업 보너스' },
        'achievement_reward': { icon: '🎖️', label: '업적 달성' },
        'admin_adjustment': { icon: '⚙️', label: '관리자 조정' },
        'reward_shop': { icon: '🛒', label: '리워드샵 구매' },
      };

      const typeInfo = typeLabels[tx.transaction_type] || { icon: '💸', label: tx.transaction_type };

      return {
        id: tx.id,
        transaction_type: tx.transaction_type,
        type_icon: typeInfo.icon,
        type_label: typeInfo.label,
        point_type: tx.point_type,
        amount: tx.amount,
        balance_before: tx.balance_before,
        balance_after: tx.balance_after,
        description: tx.description,
        status: tx.status,
        created_at: tx.created_at,
        processed_at: tx.processed_at,
        market_id: tx.market_id,
        prediction_id: tx.prediction_id,
        related_user_id: tx.related_user_id,
        metadata: tx.metadata,
      };
    });

    // 포인트 타입별 합계 계산
    const summary = {
      rp: {
        earned: 0,
        spent: 0,
        net: 0,
      },
      pp: {
        earned: 0,
        spent: 0,
        net: 0,
      },
      wp: {
        earned: 0,
        spent: 0,
        net: 0,
      },
    };

    transactions.forEach((tx: any) => {
      const key = tx.point_type.toLowerCase() as 'rp' | 'pp' | 'wp';
      if (tx.amount > 0) {
        summary[key].earned += tx.amount;
      } else {
        summary[key].spent += Math.abs(tx.amount);
      }
      summary[key].net += tx.amount;
    });

    return NextResponse.json({
      success: true,
      data: formattedTransactions,
      summary,
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: (offset + limit) < (count || 0),
      }
    });

  } catch (error) {
    console.error('거래 내역 조회 API 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

