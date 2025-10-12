import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '../../../utils/supabase/client';

// 예측 제출 API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { predictions, userId } = body;

    if (!predictions || !Array.isArray(predictions) || predictions.length === 0) {
      return NextResponse.json(
        { error: '예측 데이터가 필요합니다.' },
        { status: 400 }
      );
    }

    // 예측 데이터 변환
    interface PredictionInput {
      gameId: string;
      selectedTeam: string;
      homeTeam: string;
      awayTeam: string;
    }
    
    const predictionData = predictions.map((prediction: PredictionInput) => ({
      user_id: userId || 'temp-user', // 임시 사용자 ID (추후 실제 인증 연동)
      game_id: prediction.gameId,
      predicted_winner: prediction.selectedTeam === 'home' ? 1 : 2,
      predicted_team: prediction.selectedTeam === 'home' ? 
        prediction.homeTeam : prediction.awayTeam,
      coins_spent: 50, // 경기당 50 코인
      created_at: new Date().toISOString(),
    }));

    // Supabase에 예측 데이터 저장
    const { data, error } = await supabaseClient
      .from('predictions')
      .insert(predictionData);

    if (error) {
      console.error('예측 저장 오류:', error);
      return NextResponse.json(
        { error: '예측 저장에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${predictions.length}개 경기 예측이 저장되었습니다.`,
      data
    });

  } catch (error) {
    console.error('예측 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 사용자 예측 조회 API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'temp-user';
    const gameDate = searchParams.get('date');

    let query = supabaseClient
      .from('predictions')
      .select(`
        *,
        games(
          id,
          home_team,
          away_team,
          start_time,
          result,
          is_closed,
          home_score,
          away_score
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // 특정 날짜 필터링
    if (gameDate) {
      const startDate = new Date(gameDate);
      const endDate = new Date(gameDate);
      endDate.setDate(endDate.getDate() + 1);

      query = query.gte('created_at', startDate.toISOString())
                   .lt('created_at', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('예측 조회 오류:', error);
      return NextResponse.json(
        { error: '예측 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      predictions: data || []
    });

  } catch (error) {
    console.error('예측 조회 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
