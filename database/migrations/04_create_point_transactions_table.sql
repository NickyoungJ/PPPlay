-- 포인트 트랜잭션 테이블
-- 모든 포인트 획득/사용 내역 기록

CREATE TABLE point_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL, -- auth.users 참조
    
    -- 트랜잭션 타입
    transaction_type VARCHAR(50) NOT NULL 
        CHECK (transaction_type IN (
            'daily_login',        -- 출석 체크
            'consecutive_bonus',  -- 연속 출석 보너스
            'ad_reward',          -- 광고 시청 보상
            'referral_signup',    -- 친구 초대 (가입)
            'referral_activity',  -- 친구 활동 보상
            'prediction_spent',   -- 예측 참여 (차감)
            'prediction_reward',  -- 예측 성공 (보상)
            'prediction_refund',  -- 예측 취소 (환불)
            'market_creation',    -- 마켓 개설 (차감)
            'creator_bonus',      -- 개설자 보너스
            'level_up_bonus',     -- 레벨업 보상
            'achievement_reward', -- 업적 달성 보상
            'admin_adjustment',   -- 관리자 조정
            'reward_shop'         -- 리워드 상점 사용
        )),
    
    -- 포인트 변동
    amount INTEGER NOT NULL, -- 양수(획득), 음수(사용)
    balance_before INTEGER NOT NULL, -- 트랜잭션 전 잔액
    balance_after INTEGER NOT NULL, -- 트랜잭션 후 잔액
    
    -- 관련 데이터
    market_id UUID, -- markets 테이블 참조
    prediction_id UUID, -- predictions 테이블 참조
    related_user_id UUID, -- 관련 사용자 (초대한 친구 등)
    
    -- 설명/메모
    description TEXT,
    metadata JSONB, -- 추가 메타데이터 (유연한 확장)
    
    -- 상태
    status VARCHAR(20) DEFAULT 'completed'
        CHECK (status IN ('pending', 'completed', 'cancelled', 'failed')),
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_point_transactions_user ON point_transactions(user_id);
CREATE INDEX idx_point_transactions_type ON point_transactions(transaction_type);
CREATE INDEX idx_point_transactions_market ON point_transactions(market_id);
CREATE INDEX idx_point_transactions_prediction ON point_transactions(prediction_id);
CREATE INDEX idx_point_transactions_created ON point_transactions(created_at DESC);
CREATE INDEX idx_point_transactions_status ON point_transactions(status);

-- 일별 트랜잭션 조회를 위한 인덱스
CREATE INDEX idx_point_transactions_user_date ON point_transactions(user_id, created_at DESC);

-- JSONB 메타데이터 검색을 위한 GIN 인덱스
CREATE INDEX idx_point_transactions_metadata ON point_transactions USING GIN (metadata);

-- 포인트 트랜잭션 자동 처리 함수
CREATE OR REPLACE FUNCTION process_point_transaction()
RETURNS TRIGGER AS $$
DECLARE
    user_points_record RECORD;
BEGIN
    -- 사용자 포인트 레코드 조회 및 락
    SELECT * INTO user_points_record
    FROM user_points
    WHERE user_id = NEW.user_id
    FOR UPDATE;
    
    -- 사용자 포인트 레코드가 없으면 생성
    IF NOT FOUND THEN
        INSERT INTO user_points (user_id, total_points, available_points)
        VALUES (NEW.user_id, 1000, 1000)
        RETURNING * INTO user_points_record;
    END IF;
    
    -- 트랜잭션 전 잔액 기록
    NEW.balance_before := user_points_record.available_points;
    
    -- 포인트 변동 적용
    IF NEW.amount > 0 THEN
        -- 포인트 획득
        UPDATE user_points
        SET available_points = available_points + NEW.amount,
            total_points = total_points + NEW.amount,
            total_earned = total_earned + NEW.amount
        WHERE user_id = NEW.user_id;
        
    ELSIF NEW.amount < 0 THEN
        -- 포인트 사용
        -- 잔액 부족 체크
        IF user_points_record.available_points < ABS(NEW.amount) THEN
            RAISE EXCEPTION '포인트가 부족합니다. 현재: %, 필요: %', 
                user_points_record.available_points, ABS(NEW.amount);
        END IF;
        
        UPDATE user_points
        SET available_points = available_points + NEW.amount, -- amount는 음수
            total_spent = total_spent + ABS(NEW.amount)
        WHERE user_id = NEW.user_id;
    END IF;
    
    -- 트랜잭션 후 잔액 조회
    SELECT available_points INTO NEW.balance_after
    FROM user_points
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 포인트 트랜잭션 처리 트리거
CREATE TRIGGER trigger_process_point_transaction
    BEFORE INSERT ON point_transactions
    FOR EACH ROW
    WHEN (NEW.status = 'completed')
    EXECUTE FUNCTION process_point_transaction();

-- 일일 출석 체크 함수
CREATE OR REPLACE FUNCTION check_daily_login(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    user_record RECORD;
    points_earned INTEGER := 10; -- 기본 출석 포인트
    bonus_points INTEGER := 0;
    is_new_day BOOLEAN := false;
    result JSONB;
BEGIN
    -- 사용자 포인트 레코드 조회
    SELECT * INTO user_record
    FROM user_points
    WHERE user_id = p_user_id
    FOR UPDATE;
    
    -- 마지막 로그인이 오늘이 아니면 출석 처리
    IF user_record.last_login_at IS NULL OR 
       DATE(user_record.last_login_at) < CURRENT_DATE THEN
        
        is_new_day := true;
        
        -- 연속 출석 계산
        IF user_record.last_login_at IS NOT NULL AND
           DATE(user_record.last_login_at) = CURRENT_DATE - INTERVAL '1 day' THEN
            -- 연속 출석
            UPDATE user_points
            SET consecutive_login_days = consecutive_login_days + 1,
                total_login_days = total_login_days + 1,
                last_login_at = NOW()
            WHERE user_id = p_user_id;
            
            -- 연속 출석 보너스 (7일마다)
            IF (user_record.consecutive_login_days + 1) % 7 = 0 THEN
                bonus_points := 50;
            END IF;
        ELSE
            -- 연속 출석 끊김
            UPDATE user_points
            SET consecutive_login_days = 1,
                total_login_days = total_login_days + 1,
                last_login_at = NOW()
            WHERE user_id = p_user_id;
        END IF;
        
        -- 출석 포인트 지급
        INSERT INTO point_transactions (
            user_id, transaction_type, amount, description, status
        ) VALUES (
            p_user_id, 'daily_login', points_earned, 
            '일일 출석 보상', 'completed'
        );
        
        -- 연속 출석 보너스 지급
        IF bonus_points > 0 THEN
            INSERT INTO point_transactions (
                user_id, transaction_type, amount, description, status
            ) VALUES (
                p_user_id, 'consecutive_bonus', bonus_points,
                FORMAT('연속 출석 %s일 보너스', user_record.consecutive_login_days + 1),
                'completed'
            );
        END IF;
        
    ELSE
        -- 오늘 이미 출석함
        UPDATE user_points
        SET last_login_at = NOW()
        WHERE user_id = p_user_id;
    END IF;
    
    -- 결과 반환
    SELECT jsonb_build_object(
        'is_new_day', is_new_day,
        'points_earned', points_earned + bonus_points,
        'consecutive_days', consecutive_login_days,
        'total_days', total_login_days
    ) INTO result
    FROM user_points
    WHERE user_id = p_user_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 코멘트 추가
COMMENT ON TABLE point_transactions IS '포인트 트랜잭션 내역 (모든 획득/사용 기록)';
COMMENT ON COLUMN point_transactions.transaction_type IS '트랜잭션 타입 (출석/광고/예측/초대 등)';
COMMENT ON COLUMN point_transactions.amount IS '포인트 변동량 (양수: 획득, 음수: 사용)';
COMMENT ON COLUMN point_transactions.metadata IS '추가 메타데이터 (JSON 형식)';
COMMENT ON FUNCTION check_daily_login IS '일일 출석 체크 및 포인트 지급';

