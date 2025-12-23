-- =====================================================
-- 마켓 댓글 테이블 생성
-- =====================================================

-- 1. 댓글 테이블 생성
CREATE TABLE IF NOT EXISTS comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- 대댓글용
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_comments_market_id ON comments(market_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- 3. RLS 정책 설정
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 댓글 조회 가능
CREATE POLICY "Anyone can view comments" ON comments
    FOR SELECT USING (is_deleted = FALSE);

-- 인증된 사용자만 댓글 작성 가능
CREATE POLICY "Authenticated users can create comments" ON comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 본인 댓글만 수정 가능
CREATE POLICY "Users can update own comments" ON comments
    FOR UPDATE USING (auth.uid() = user_id);

-- 본인 댓글만 삭제 가능 (soft delete)
CREATE POLICY "Users can delete own comments" ON comments
    FOR DELETE USING (auth.uid() = user_id);

-- 4. 댓글 수 업데이트 트리거 (markets 테이블에 comment_count 컬럼 추가 필요시)
-- ALTER TABLE markets ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '댓글 테이블이 성공적으로 생성되었습니다.';
END $$;

