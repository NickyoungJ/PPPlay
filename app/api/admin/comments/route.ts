import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAdmin } from '@/utils/admin';

// 관리자용 댓글 목록 조회
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const marketId = searchParams.get('marketId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('comments')
      .select(`
        id,
        content,
        market_id,
        user_id,
        is_deleted,
        created_at
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (marketId) {
      query = query.eq('market_id', marketId);
    }

    const { data: comments, error } = await query;

    if (error) {
      console.error('댓글 조회 오류:', error);
      return NextResponse.json(
        { error: '댓글 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 사용자 정보 가져오기
    const userIds = [...new Set(comments?.map(c => c.user_id) || [])];
    let usersMap: Record<string, string> = {};
    
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('user_points')
        .select('user_id, nickname')
        .in('user_id', userIds);

      if (users) {
        users.forEach(u => {
          usersMap[u.user_id] = u.nickname || '익명';
        });
      }
    }

    const commentsWithUsers = comments?.map(comment => ({
      ...comment,
      nickname: usersMap[comment.user_id] || '익명'
    })) || [];

    return NextResponse.json({
      success: true,
      comments: commentsWithUsers
    });

  } catch (error) {
    console.error('관리자 댓글 API 오류:', error);
    return NextResponse.json(
      { error: '권한이 없거나 서버 오류가 발생했습니다.' },
      { status: 403 }
    );
  }
}

// 관리자용 댓글 삭제
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('id');

    if (!commentId) {
      return NextResponse.json(
        { error: '댓글 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // Soft delete (is_deleted = true)
    const { error } = await supabase
      .from('comments')
      .update({ is_deleted: true })
      .eq('id', commentId);

    if (error) {
      console.error('댓글 삭제 오류:', error);
      return NextResponse.json(
        { error: '댓글 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: '댓글이 삭제되었습니다.'
    });

  } catch (error) {
    console.error('관리자 댓글 삭제 API 오류:', error);
    return NextResponse.json(
      { error: '권한이 없거나 서버 오류가 발생했습니다.' },
      { status: 403 }
    );
  }
}

