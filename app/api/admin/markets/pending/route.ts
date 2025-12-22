import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAdmin } from '@/utils/admin';

// 승인 대기 중인 마켓 조회
export async function GET(request: NextRequest) {
  try {
    // ✅ 관리자 권한 체크 복구
    await requireAdmin();

    const supabase = await createClient();

    // 승인 대기 중인 마켓 조회 (creator 조인 제거 - auth.users 접근 제한)
    const { data: markets, error } = await supabase
      .from('markets')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('마켓 조회 오류:', error);
      return NextResponse.json(
        { error: '마켓 조회에 실패했습니다.', details: error.message },
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

