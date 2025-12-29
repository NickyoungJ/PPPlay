import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAdmin } from '@/utils/admin';

// 관리자용 마켓 삭제 (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const marketId = searchParams.get('id');
    const reason = searchParams.get('reason') || '관리자에 의해 삭제됨';

    if (!marketId) {
      return NextResponse.json(
        { error: '마켓 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 마켓 정보 조회
    const { data: market, error: fetchError } = await supabase
      .from('markets')
      .select('id, title, status, creator_id')
      .eq('id', marketId)
      .single();

    if (fetchError || !market) {
      return NextResponse.json(
        { error: '마켓을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 마켓 상태를 'deleted'로 변경 (soft delete)
    const { error: updateError } = await supabase
      .from('markets')
      .update({ 
        status: 'deleted',
        is_closed: true
      })
      .eq('id', marketId);

    if (updateError) {
      console.error('마켓 삭제 오류:', updateError);
      return NextResponse.json(
        { error: '마켓 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 마켓 생성자에게 알림 발송 (선택적)
    if (market.creator_id) {
      try {
        await supabase.rpc('create_notification', {
          p_user_id: market.creator_id,
          p_type: 'market_rejected',
          p_title: '마켓 삭제 안내',
          p_message: `마켓 "${market.title}"이(가) 운영정책 위반으로 삭제되었습니다. 사유: ${reason}`,
          p_data: { market_id: marketId, reason }
        });
      } catch (notifError) {
        console.error('알림 발송 실패:', notifError);
        // 알림 실패해도 삭제는 성공으로 처리
      }
    }

    return NextResponse.json({ 
      success: true,
      message: '마켓이 삭제되었습니다.',
      marketId
    });

  } catch (error) {
    console.error('관리자 마켓 삭제 API 오류:', error);
    return NextResponse.json(
      { error: '권한이 없거나 서버 오류가 발생했습니다.' },
      { status: 403 }
    );
  }
}

// 관리자용 마켓 복구
export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
    
    const supabase = await createClient();
    const body = await request.json();
    const { marketId } = body;

    if (!marketId) {
      return NextResponse.json(
        { error: '마켓 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 마켓 상태를 'approved'로 복구
    const { error } = await supabase
      .from('markets')
      .update({ 
        status: 'approved',
        is_closed: false
      })
      .eq('id', marketId);

    if (error) {
      console.error('마켓 복구 오류:', error);
      return NextResponse.json(
        { error: '마켓 복구에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: '마켓이 복구되었습니다.'
    });

  } catch (error) {
    console.error('관리자 마켓 복구 API 오류:', error);
    return NextResponse.json(
      { error: '권한이 없거나 서버 오류가 발생했습니다.' },
      { status: 403 }
    );
  }
}

