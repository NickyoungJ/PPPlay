import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// 관리자 권한 확인 API
export async function GET() {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // 환경 변수에서 관리자 이메일 목록 가져오기
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(email => email.trim());
    
    // 사용자 이메일이 관리자 목록에 있는지 확인
    const isAdmin = adminEmails.includes(user.email || '');

    if (!isAdmin) {
      return NextResponse.json(
        { error: '관리자 권한이 없습니다.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      isAdmin: true,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Admin check error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}


