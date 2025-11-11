import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAdmin } from '@/utils/admin';

// 관리자 통계 조회
export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    await requireAdmin();

    const supabase = await createClient();

    // 1. 전체 마켓 통계
    const { data: marketStats, error: marketError } = await supabase
      .from('markets')
      .select('status, market_type', { count: 'exact' });

    if (marketError) {
      console.error('마켓 통계 오류:', marketError);
    }

    // 상태별 카운트
    const statusCounts = {
      pending: marketStats?.filter(m => m.status === 'pending').length || 0,
      approved: marketStats?.filter(m => m.status === 'approved').length || 0,
      active: marketStats?.filter(m => m.status === 'active').length || 0,
      closed: marketStats?.filter(m => m.status === 'closed').length || 0,
      cancelled: marketStats?.filter(m => m.status === 'cancelled').length || 0,
    };

    // 타입별 카운트
    const typeCounts = {
      sports: marketStats?.filter(m => m.market_type === 'sports').length || 0,
      general: marketStats?.filter(m => m.market_type === 'general').length || 0,
    };

    // 2. 전체 사용자 통계
    const { count: totalUsers, error: userError } = await supabase
      .from('user_points')
      .select('*', { count: 'exact', head: true });

    if (userError) {
      console.error('사용자 통계 오류:', userError);
    }

    // 3. 전체 예측 통계
    const { count: totalPredictions, error: predError } = await supabase
      .from('predictions')
      .select('*', { count: 'exact', head: true });

    if (predError) {
      console.error('예측 통계 오류:', predError);
    }

    // 4. 포인트 통계
    const { data: pointStats, error: pointError } = await supabase
      .from('user_points')
      .select('total_points, available_points, locked_points');

    if (pointError) {
      console.error('포인트 통계 오류:', pointError);
    }

    const totalPointsInSystem = pointStats?.reduce((sum, user) => sum + user.total_points, 0) || 0;
    const totalAvailablePoints = pointStats?.reduce((sum, user) => sum + user.available_points, 0) || 0;
    const totalLockedPoints = pointStats?.reduce((sum, user) => sum + user.locked_points, 0) || 0;

    // 5. 최근 트랜잭션 통계
    const { data: recentTransactions, error: txError } = await supabase
      .from('point_transactions')
      .select('transaction_type, amount')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // 최근 7일

    if (txError) {
      console.error('트랜잭션 통계 오류:', txError);
    }

    const transactionStats = {
      total: recentTransactions?.length || 0,
      earned: recentTransactions?.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0) || 0,
      spent: Math.abs(recentTransactions?.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0) || 0),
    };

    // 6. 최근 가입자 (최근 7일)
    const { count: recentSignups, error: signupError } = await supabase
      .from('user_points')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (signupError) {
      console.error('가입자 통계 오류:', signupError);
    }

    return NextResponse.json({
      success: true,
      stats: {
        markets: {
          total: marketStats?.length || 0,
          byStatus: statusCounts,
          byType: typeCounts,
        },
        users: {
          total: totalUsers || 0,
          recentSignups: recentSignups || 0,
        },
        predictions: {
          total: totalPredictions || 0,
        },
        points: {
          total: totalPointsInSystem,
          available: totalAvailablePoints,
          locked: totalLockedPoints,
        },
        transactions: transactionStats,
      },
    });
  } catch (error: any) {
    console.error('API 오류:', error);
    return NextResponse.json(
      { error: error.message || '권한이 없습니다.' },
      { status: 403 }
    );
  }
}

