import { createClient } from '@supabase/supabase-js';

// 환경 변수가 없을 경우 임시 값 설정 (개발 환경용)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 클라이언트 측 브라우저 환경에서만 경고 출력
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development' && 
    (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
  console.warn(
    '⚠️ Supabase 환경 변수가 설정되지 않았습니다. .env.local 파일을 생성하고 다음 값을 설정하세요:\n' +
    'NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\n' +
    'NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key'
  );
}

// 클라이언트 컴포넌트용 Supabase 클라이언트
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});