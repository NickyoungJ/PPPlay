import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAdmin, getAdminStatus } from '@/utils/admin';

// 마켓 결과 확정 및 정산
export async function POST(request: NextRequest) {
  try {
    // ✅ 관리자 권한 체크 복구
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

    const supabase = await createClient();
    const { user } = await getAdminStatus();

    // settle_market_simple 함수 호출 (간소화된 정산)
    const { data: settlementResult, error: settlementError } = await supabase.rpc(
      'settle_market_simple',
      { 
        p_market_id: market_id,
        p_result: result,
        p_admin_id: user?.id 
      }
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

    // 업데이트된 마켓 정보 조회
    const { data: market } = await supabase
      .from('markets')
      .select('*')
      .eq('id', market_id)
      .single();

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
