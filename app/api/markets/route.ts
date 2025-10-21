import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/utils/supabase/client';
import { createClient } from '@/utils/supabase/server';

// 마켓 리스트 조회 API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || null;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status') || 'active';

    const supabase = createClient();

    // get_active_markets 함수 호출
    const { data, error } = await supabase.rpc('get_active_markets', {
      p_category_slug: category === 'all' ? null : category,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      console.error('마켓 조회 오류:', error);
      return NextResponse.json(
        { error: '마켓 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      markets: data || [],
      count: data?.length || 0,
    });
  } catch (error) {
    console.error('마켓 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

