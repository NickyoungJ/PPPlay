import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAdmin, getAdminStatus } from '@/utils/admin';

// 마켓 결과 확정 및 정산
export async function POST(request: NextRequest) {
  try {
    // 관리자 권한 확인
    await requireAdmin();

    const body = await request.json();
    const { market_id, result, description } = body;

    if (!market_id || !result) {
      return NextResponse.json(
        { error: '마켓 ID와 결과가 필요합니다.' },
        { status: 400 }
      );
    }

    if (result !== 'yes' && result !== 'no' && result !== 'cancelled') {
      return NextResponse.json(
        { error: '결과는 yes, no, cancelled 중 하나여야 합니다.' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { user } = await getAdminStatus();

    // 마켓 결과 확정
    const { data: market, error: updateError } = await supabase
      .from('markets')
      .update({
        result,
        is_closed: true,
        status: 'closed',
        result_confirmed_at: new Date().toISOString(),
        result_confirmed_by: user?.id,
        result_description: description || null,
      })
      .eq('id', market_id)
      .select()
      .single();

    if (updateError) {
      console.error('마켓 결과 확정 오류:', updateError);
      return NextResponse.json(
        { error: '마켓 결과 확정에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 예측 정산 (settle_market_predictions 함수 호출)
    const { data: settlementResult, error: settlementError } = await supabase.rpc(
      'settle_market_predictions',
      { p_market_id: market_id }
    );

    if (settlementError) {
      console.error('정산 오류:', settlementError);
      return NextResponse.json(
        { 
          success: false,
          error: '정산 중 오류가 발생했습니다.',
          details: settlementError.message 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '마켓 결과가 확정되고 정산이 완료되었습니다.',
      market,
      settlement: settlementResult,
    });
  } catch (error: any) {
    console.error('API 오류:', error);
    return NextResponse.json(
      { error: error.message || '권한이 없습니다.' },
      { status: 403 }
    );
  }
}

