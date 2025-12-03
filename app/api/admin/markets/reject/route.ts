import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAdmin } from '@/utils/admin';

const MARKET_CREATION_COST = 1000;

// 마켓 거부
export async function POST(request: NextRequest) {
  try {
    // 🔥 임시: 관리자 권한 체크 비활성화
    // await requireAdmin();

    const body = await request.json();
    const { market_id, reason } = body;

    if (!market_id) {
      return NextResponse.json(
        { error: '마켓 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 마켓 정보 조회 (환불을 위해)
    const { data: market, error: fetchError } = await supabase
      .from('markets')
      .select('*')
      .eq('id', market_id)
      .single();

    if (fetchError || !market) {
      return NextResponse.json(
        { error: '마켓을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 이미 처리된 마켓인지 확인
    if (market.status !== 'pending') {
      return NextResponse.json(
        { error: '이미 처리된 마켓입니다.' },
        { status: 400 }
      );
    }

    // 마켓 상태를 cancelled로 변경
    const { error: updateError } = await supabase
      .from('markets')
      .update({
        status: 'cancelled',
        result_description: reason || '관리자에 의해 거부됨',
        updated_at: new Date().toISOString(),
      })
      .eq('id', market_id);

    if (updateError) {
      console.error('마켓 거부 오류:', updateError);
      return NextResponse.json(
        { error: '마켓 거부에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 생성자에게 포인트 환불 (RPC 함수 사용)
    let refundSuccess = false;
    if (market.creator_id) {
      const { data: refundResult, error: refundError } = await supabase
        .rpc('refund_market_creation', {
          p_user_id: market.creator_id,
          p_market_id: market.id,
          p_amount: MARKET_CREATION_COST
        });

      if (refundError) {
        console.error('포인트 환불 RPC 오류:', refundError);
      } else if (refundResult?.success) {
        refundSuccess = true;
      }
    }

    return NextResponse.json({
      success: true,
      message: refundSuccess 
        ? '마켓이 거부되었습니다. 생성자에게 1000P가 환불되었습니다.'
        : '마켓이 거부되었습니다. (환불 처리 실패 - 관리자 확인 필요)',
      refunded: refundSuccess,
      refundAmount: refundSuccess ? MARKET_CREATION_COST : 0
    });
  } catch (error: any) {
    console.error('API 오류:', error);
    return NextResponse.json(
      { error: error.message || '권한이 없습니다.' },
      { status: 403 }
    );
  }
}

