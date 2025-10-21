import { createClient } from '@/utils/supabase/server';

// 관리자 이메일 목록 (환경변수로 관리)
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',') || [
  'admin@ppplay.com', // 기본 관리자 이메일
];

/**
 * 사용자가 관리자인지 확인
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return false;
    }

    // 이메일이 관리자 목록에 있는지 확인
    return ADMIN_EMAILS.includes(user.email || '');
  } catch (error) {
    console.error('관리자 확인 오류:', error);
    return false;
  }
}

/**
 * 관리자 권한 체크 (미들웨어용)
 * 관리자가 아니면 에러를 throw
 */
export async function requireAdmin(): Promise<void> {
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    throw new Error('관리자 권한이 필요합니다.');
  }
}

/**
 * 사용자 정보와 함께 관리자 여부 반환
 */
export async function getAdminStatus() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, isAdmin: false };
  }

  const adminStatus = ADMIN_EMAILS.includes(user.email || '');

  return {
    user,
    isAdmin: adminStatus,
  };
}

