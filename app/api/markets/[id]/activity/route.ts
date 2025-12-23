import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// 마켓 투표 액티비티 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: marketId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = await createClient();

    // 투표 기록 조회
    const { data: predictions, error } = await supabase
      .from('predictions')
      .select(`
        id,
        user_id,
        selected_option,
        participation_reward,
        created_at
      `)
      .eq('market_id', marketId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('투표 액티비티 조회 오류:', error);
      return NextResponse.json(
        { error: '액티비티 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 사용자 정보 가져오기
    const userIds = [...new Set(predictions?.map(p => p.user_id) || [])];
    
    let usersMap: Record<string, { nickname: string; avatar_url: string | null }> = {};
    
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('user_points')
        .select('user_id, nickname')
        .in('user_id', userIds);

      if (users) {
        users.forEach(u => {
          usersMap[u.user_id] = {
            nickname: u.nickname || '익명',
            avatar_url: null
          };
        });
      }
    }

    // 닉네임 마스킹 (프라이버시)
    const maskNickname = (nickname: string) => {
      if (nickname.length <= 2) return nickname[0] + '*';
      return nickname[0] + '*'.repeat(nickname.length - 2) + nickname[nickname.length - 1];
    };

    // 액티비티에 사용자 정보 추가 (마스킹된 닉네임)
    const activities = predictions?.map(prediction => ({
      id: prediction.id,
      type: 'vote' as const,
      selected_option: prediction.selected_option,
      created_at: prediction.created_at,
      user: {
        nickname: maskNickname(usersMap[prediction.user_id]?.nickname || '익명'),
        avatar_url: usersMap[prediction.user_id]?.avatar_url
      }
    })) || [];

    // 총 투표 수 조회
    const { count } = await supabase
      .from('predictions')
      .select('*', { count: 'exact', head: true })
      .eq('market_id', marketId);

    return NextResponse.json({
      success: true,
      activities,
      total: count || 0
    });

  } catch (error) {
    console.error('액티비티 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

