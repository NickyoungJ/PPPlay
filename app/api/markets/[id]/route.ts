import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// 마켓 상세 정보 조회 API
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const marketId = params.id;

    // 마켓 정보 조회
    const { data: market, error } = await supabase
      .from('markets')
      .select(`
        *,
        creator:creator_id(id, email)
      `)
      .eq('id', marketId)
      .single();

    if (error || !market) {
      return NextResponse.json(
        { error: '마켓을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Yes/No 포인트 계산
    const { data: predictions } = await supabase
      .from('predictions')
      .select('predicted_option, points_spent')
      .eq('market_id', marketId);

    let yesPoints = 0;
    let noPoints = 0;

    if (predictions) {
      predictions.forEach(pred => {
        if (pred.predicted_option === 'yes') {
          yesPoints += pred.points_spent;
        } else {
          noPoints += pred.points_spent;
        }
      });
    }

    // 마켓 데이터에 포인트 정보 추가
    const marketWithPoints = {
      ...market,
      yes_points: yesPoints,
      no_points: noPoints,
    };

    return NextResponse.json({
      success: true,
      market: marketWithPoints,
    });
  } catch (error) {
    console.error('마켓 상세 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}


