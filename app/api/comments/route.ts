import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// 댓글 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const marketId = searchParams.get('marketId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!marketId) {
      return NextResponse.json(
        { error: '마켓 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 댓글 조회 (사용자 정보 포함)
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        parent_id,
        created_at,
        updated_at,
        user_id
      `)
      .eq('market_id', marketId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('댓글 조회 오류:', error);
      return NextResponse.json(
        { error: '댓글 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 사용자 정보 가져오기
    const userIds = [...new Set(comments?.map(c => c.user_id) || [])];
    
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

    // 댓글에 사용자 정보 추가
    const commentsWithUsers = comments?.map(comment => ({
      ...comment,
      user: usersMap[comment.user_id] || { nickname: '익명', avatar_url: null }
    })) || [];

    return NextResponse.json({
      success: true,
      comments: commentsWithUsers,
      count: commentsWithUsers.length
    });

  } catch (error) {
    console.error('댓글 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 댓글 작성
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { marketId, content, parentId } = body;

    if (!marketId || !content?.trim()) {
      return NextResponse.json(
        { error: '마켓 ID와 댓글 내용이 필요합니다.' },
        { status: 400 }
      );
    }

    // 댓글 길이 제한
    if (content.length > 500) {
      return NextResponse.json(
        { error: '댓글은 500자 이내로 작성해주세요.' },
        { status: 400 }
      );
    }

    // 댓글 생성
    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        market_id: marketId,
        user_id: user.id,
        content: content.trim(),
        parent_id: parentId || null
      })
      .select()
      .single();

    if (error) {
      console.error('댓글 생성 오류:', error);
      return NextResponse.json(
        { error: '댓글 작성에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 사용자 닉네임 가져오기
    const { data: userInfo } = await supabase
      .from('user_points')
      .select('nickname')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({
      success: true,
      comment: {
        ...comment,
        user: {
          nickname: userInfo?.nickname || '익명',
          avatar_url: null
        }
      }
    });

  } catch (error) {
    console.error('댓글 작성 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 댓글 삭제 (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('id');

    if (!commentId) {
      return NextResponse.json(
        { error: '댓글 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 본인 댓글인지 확인
    const { data: comment } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', commentId)
      .single();

    if (!comment || comment.user_id !== user.id) {
      return NextResponse.json(
        { error: '삭제 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // Soft delete
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

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('댓글 삭제 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

