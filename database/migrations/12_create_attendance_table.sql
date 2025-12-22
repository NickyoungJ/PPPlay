-- =====================================================
-- 출석 체크 테이블 생성
-- =====================================================

-- 출석 기록 테이블
CREATE TABLE IF NOT EXISTS attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    points_earned INTEGER NOT NULL DEFAULT 100,
    consecutive_days INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 사용자당 하루에 한 번만 출석 가능
    UNIQUE(user_id, date)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, date);

-- RLS 정책 설정
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 출석 기록만 조회 가능
CREATE POLICY "Users can view own attendance" ON attendance
    FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 출석 기록만 생성 가능
CREATE POLICY "Users can insert own attendance" ON attendance
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 코멘트
COMMENT ON TABLE attendance IS '일일 출석 체크 기록';
COMMENT ON COLUMN attendance.user_id IS '사용자 ID';
COMMENT ON COLUMN attendance.date IS '출석 날짜';
COMMENT ON COLUMN attendance.points_earned IS '획득한 포인트 (보너스 포함)';
COMMENT ON COLUMN attendance.consecutive_days IS '연속 출석 일수';

-- =====================================================
-- user_points 테이블에 출석 관련 컬럼 추가 (없는 경우)
-- =====================================================

-- consecutive_login_days 컬럼 추가 (없는 경우)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_points' AND column_name = 'consecutive_login_days'
    ) THEN
        ALTER TABLE user_points ADD COLUMN consecutive_login_days INTEGER DEFAULT 0;
    END IF;
END $$;

-- total_login_days 컬럼 추가 (없는 경우)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_points' AND column_name = 'total_login_days'
    ) THEN
        ALTER TABLE user_points ADD COLUMN total_login_days INTEGER DEFAULT 0;
    END IF;
END $$;

-- last_login_at 컬럼 추가 (없는 경우)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_points' AND column_name = 'last_login_at'
    ) THEN
        ALTER TABLE user_points ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

