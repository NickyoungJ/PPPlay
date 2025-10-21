-- 사용자 포인트 관리 테이블
-- 포인트 획득/사용, 통계, 레벨 관리

CREATE TABLE user_points (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE, -- auth.users 참조
    
    -- 포인트 현황
    total_points INTEGER DEFAULT 1000 NOT NULL, -- 총 보유 포인트
    available_points INTEGER DEFAULT 1000 NOT NULL, -- 사용 가능 포인트
    locked_points INTEGER DEFAULT 0 NOT NULL, -- 예측 참여로 잠긴 포인트
    
    -- 포인트 통계
    total_earned INTEGER DEFAULT 0, -- 누적 획득 포인트
    total_spent INTEGER DEFAULT 0, -- 누적 사용 포인트
    
    -- 예측 통계
    total_predictions INTEGER DEFAULT 0, -- 총 예측 횟수
    correct_predictions INTEGER DEFAULT 0, -- 정답 횟수
    win_rate DECIMAL(5,2) DEFAULT 0.00, -- 승률 (%)
    current_streak INTEGER DEFAULT 0, -- 현재 연속 정답
    best_streak INTEGER DEFAULT 0, -- 최고 연속 정답
    
    -- 레벨/등급 시스템
    level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    next_level_exp INTEGER DEFAULT 100, -- 다음 레벨까지 필요 경험치
    
    -- 티어 시스템 (옵션)
    tier VARCHAR(20) DEFAULT 'bronze' 
        CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
    
    -- 출석/활동
    last_login_at TIMESTAMP WITH TIME ZONE,
    consecutive_login_days INTEGER DEFAULT 0, -- 연속 출석일
    total_login_days INTEGER DEFAULT 0, -- 총 출석일
    
    -- 초대/추천
    referral_code VARCHAR(20) UNIQUE, -- 내 추천 코드
    referred_by VARCHAR(20), -- 나를 초대한 사람의 코드
    referral_count INTEGER DEFAULT 0, -- 내가 초대한 사람 수
    referral_rewards INTEGER DEFAULT 0, -- 초대 보상 누적
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_user_points_user_id ON user_points(user_id);
CREATE INDEX idx_user_points_level ON user_points(level DESC);
CREATE INDEX idx_user_points_tier ON user_points(tier);
CREATE INDEX idx_user_points_total_points ON user_points(total_points DESC);
CREATE INDEX idx_user_points_win_rate ON user_points(win_rate DESC);
CREATE INDEX idx_user_points_referral_code ON user_points(referral_code);

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_user_points_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 업데이트 트리거
CREATE TRIGGER trigger_update_user_points_updated_at
    BEFORE UPDATE ON user_points
    FOR EACH ROW
    EXECUTE FUNCTION update_user_points_updated_at();

-- 승률 자동 계산 함수
CREATE OR REPLACE FUNCTION calculate_win_rate()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.total_predictions > 0 THEN
        NEW.win_rate := ROUND((NEW.correct_predictions::DECIMAL / NEW.total_predictions) * 100, 2);
    ELSE
        NEW.win_rate := 0.00;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 승률 자동 계산 트리거
CREATE TRIGGER trigger_calculate_win_rate
    BEFORE INSERT OR UPDATE OF total_predictions, correct_predictions ON user_points
    FOR EACH ROW
    EXECUTE FUNCTION calculate_win_rate();

-- 레벨업 자동 처리 함수
CREATE OR REPLACE FUNCTION process_level_up()
RETURNS TRIGGER AS $$
BEGIN
    -- 경험치가 다음 레벨 요구치를 초과하면 레벨업
    WHILE NEW.experience_points >= NEW.next_level_exp LOOP
        NEW.experience_points := NEW.experience_points - NEW.next_level_exp;
        NEW.level := NEW.level + 1;
        NEW.next_level_exp := NEW.level * 100; -- 레벨당 100씩 증가
        
        -- 레벨업 보상 (100 포인트)
        NEW.total_points := NEW.total_points + 100;
        NEW.available_points := NEW.available_points + 100;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 레벨업 트리거
CREATE TRIGGER trigger_process_level_up
    BEFORE UPDATE OF experience_points ON user_points
    FOR EACH ROW
    EXECUTE FUNCTION process_level_up();

-- 티어 자동 조정 함수
CREATE OR REPLACE FUNCTION adjust_tier()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.total_points >= 10000 THEN
        NEW.tier := 'diamond';
    ELSIF NEW.total_points >= 5000 THEN
        NEW.tier := 'platinum';
    ELSIF NEW.total_points >= 2000 THEN
        NEW.tier := 'gold';
    ELSIF NEW.total_points >= 1000 THEN
        NEW.tier := 'silver';
    ELSE
        NEW.tier := 'bronze';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 티어 자동 조정 트리거
CREATE TRIGGER trigger_adjust_tier
    BEFORE UPDATE OF total_points ON user_points
    FOR EACH ROW
    EXECUTE FUNCTION adjust_tier();

-- 추천 코드 자동 생성 함수
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.referral_code IS NULL THEN
        -- 사용자 ID 기반 8자리 랜덤 코드 생성
        NEW.referral_code := UPPER(SUBSTRING(MD5(NEW.user_id::TEXT || RANDOM()::TEXT) FROM 1 FOR 8));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 추천 코드 생성 트리거
CREATE TRIGGER trigger_generate_referral_code
    BEFORE INSERT ON user_points
    FOR EACH ROW
    EXECUTE FUNCTION generate_referral_code();

-- 코멘트 추가
COMMENT ON TABLE user_points IS '사용자 포인트 및 통계 관리';
COMMENT ON COLUMN user_points.available_points IS '실제 사용 가능한 포인트';
COMMENT ON COLUMN user_points.locked_points IS '예측 참여로 잠긴 포인트 (결과 확정 전)';
COMMENT ON COLUMN user_points.win_rate IS '예측 성공률 (%)';
COMMENT ON COLUMN user_points.referral_code IS '내 추천 코드 (친구 초대용)';

