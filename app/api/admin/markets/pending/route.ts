import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAdmin } from '@/utils/admin';

// 승인 대기 중인 마켓 조회
export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    await requireAdmin();

    const supabase = await createClient();

    // 승인 대기 중인 마켓 조회
    const { data: markets, error } = await supabase
      .from('markets')
      .select(`
        *,
        creator:creator_id (
          id,
          email,
          user_metadata
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('마켓 조회 오류:', error);
      return NextResponse.json(
        { error: '마켓 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      markets: markets || [],
      count: markets?.length || 0,
    });
  } catch (error: any) {
    console.error('API 오류:', error);
    return NextResponse.json(
      { error: error.message || '권한이 없습니다.' },
      { status: 403 }
    );
  }
}

