import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAdmin } from '@/utils/admin';

// 마켓 승인
export async function POST(request: NextRequest) {
  try {
    // 관리자 권한 확인
    await requireAdmin();

    const body = await request.json();
    const { market_id } = body;

    if (!market_id) {
      return NextResponse.json(
        { error: '마켓 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 마켓 승인 처리
    const { data: market, error } = await supabase
      .from('markets')
      .update({
        status: 'approved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', market_id)
      .select()
      .single();

    if (error) {
      console.error('마켓 승인 오류:', error);
      return NextResponse.json(
        { error: '마켓 승인에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 생성자에게 보너스 지급 (옵션)
    if (market.creator_id) {
      await supabase.from('point_transactions').insert({
        user_id: market.creator_id,
        transaction_type: 'creator_bonus',
        amount: 100, // 승인 보너스 100P
        market_id: market.id,
        description: '마켓 승인 보너스',
        status: 'completed',
      });
    }

    return NextResponse.json({
      success: true,
      message: '마켓이 승인되었습니다.',
      market,
    });
  } catch (error: any) {
    console.error('API 오류:', error);
    return NextResponse.json(
      { error: error.message || '권한이 없습니다.' },
      { status: 403 }
    );
  }
}

