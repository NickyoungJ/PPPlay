-- 포인트 경제 구조 수정: RP/PP/WP 분리
-- RP (Reward Point): 무료 포인트 (광고/로그인/미션)
-- PP (Premium Point): 유료 포인트 (결제)
-- WP (Winning Point): 보상 포인트 (예측 적중)

-- user_points 테이블에 포인트 타입별 컬럼 추가
ALTER TABLE user_points
    ADD COLUMN rp_points INTEGER DEFAULT 1000 NOT NULL,  -- Reward Points (무료)
    ADD COLUMN pp_points INTEGER DEFAULT 0 NOT NULL,     -- Premium Points (유료)
    ADD COLUMN wp_points INTEGER DEFAULT 0 NOT NULL,     -- Winning Points (보상)
    ADD COLUMN rp_locked INTEGER DEFAULT 0 NOT NULL,     -- RP 잠금
    ADD COLUMN pp_locked INTEGER DEFAULT 0 NOT NULL;     -- PP 잠금

-- 기존 포인트 데이터를 RP로 마이그레이션
UPDATE user_points
SET rp_points = available_points
WHERE rp_points = 1000; -- 초기값인 경우만

-- 포인트 타입별 트랜잭션 기록을 위한 컬럼 추가
ALTER TABLE point_transactions
    ADD COLUMN point_type VARCHAR(10) CHECK (point_type IN ('RP', 'PP', 'WP'));

-- 기존 트랜잭션을 RP로 설정
UPDATE point_transactions
SET point_type = 'RP'
WHERE point_type IS NULL;

-- point_type을 NOT NULL로 변경
ALTER TABLE point_transactions
    ALTER COLUMN point_type SET NOT NULL;

-- 트랜잭션 타입에 PP, WP 관련 추가
ALTER TABLE point_transactions
    DROP CONSTRAINT IF EXISTS point_transactions_transaction_type_check;

ALTER TABLE point_transactions
    ADD CONSTRAINT point_transactions_transaction_type_check
    CHECK (transaction_type IN (
        'daily_login',        -- 출석 체크 (RP)
        'consecutive_bonus',  -- 연속 출석 보너스 (RP)
        'ad_reward',          -- 광고 시청 보상 (RP)
        'mission_reward',     -- 미션 보상 (RP)
        'referral_signup',    -- 친구 초대 (RP)
        'referral_activity',  -- 친구 활동 보상 (RP)
        'pp_purchase',        -- PP 구매 (PP)
        'prediction_spent',   -- 예측 참여 (RP/PP 차감)
        'prediction_reward',  -- 예측 성공 (WP 지급)
        'prediction_refund',  -- 예측 취소 (RP/PP 환불)
        'market_creation',    -- 마켓 개설 (PP 차감)
        'creator_bonus',      -- 개설자 보너스 (WP)
        'level_up_bonus',     -- 레벨업 보상 (RP)
        'achievement_reward', -- 업적 달성 보상 (RP/WP)
        'admin_adjustment',   -- 관리자 조정
        'reward_shop',        -- 리워드 상점 사용 (WP 차감)
        'wp_to_giftcard'      -- WP 기프티콘 교환 (WP 차감)
    ));

-- 포인트 타입별 잔액 계산 뷰 생성
CREATE OR REPLACE VIEW user_points_summary AS
SELECT 
    user_id,
    rp_points,
    pp_points,
    wp_points,
    (rp_points + pp_points) AS usable_points,  -- 예측 가능한 포인트
    rp_locked,
    pp_locked,
    (rp_locked + pp_locked) AS total_locked,
    total_points,
    available_points,
    locked_points,
    win_rate,
    level,
    tier
FROM user_points;

-- 포인트 트랜잭션 처리 함수 업데이트
CREATE OR REPLACE FUNCTION process_point_transaction_v2()
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
        INSERT INTO user_points (user_id, rp_points, pp_points, wp_points)
        VALUES (NEW.user_id, 1000, 0, 0)
        RETURNING * INTO user_points_record;
    END IF;
    
    -- 포인트 타입별 처리
    IF NEW.point_type = 'RP' THEN
        NEW.balance_before := user_points_record.rp_points;
        
        IF NEW.amount > 0 THEN
            -- RP 획득
            UPDATE user_points
            SET rp_points = rp_points + NEW.amount,
                total_points = total_points + NEW.amount,
                available_points = available_points + NEW.amount,
                total_earned = total_earned + NEW.amount
            WHERE user_id = NEW.user_id;
        ELSE
            -- RP 사용
            IF user_points_record.rp_points < ABS(NEW.amount) THEN
                RAISE EXCEPTION 'RP 포인트가 부족합니다. 현재: %, 필요: %', 
                    user_points_record.rp_points, ABS(NEW.amount);
            END IF;
            
            UPDATE user_points
            SET rp_points = rp_points + NEW.amount,
                total_points = total_points + NEW.amount,
                available_points = available_points + NEW.amount,
                total_spent = total_spent + ABS(NEW.amount)
            WHERE user_id = NEW.user_id;
        END IF;
        
        SELECT rp_points INTO NEW.balance_after
        FROM user_points WHERE user_id = NEW.user_id;
        
    ELSIF NEW.point_type = 'PP' THEN
        NEW.balance_before := user_points_record.pp_points;
        
        IF NEW.amount > 0 THEN
            -- PP 획득 (구매)
            UPDATE user_points
            SET pp_points = pp_points + NEW.amount,
                total_points = total_points + NEW.amount,
                available_points = available_points + NEW.amount
            WHERE user_id = NEW.user_id;
        ELSE
            -- PP 사용
            IF user_points_record.pp_points < ABS(NEW.amount) THEN
                RAISE EXCEPTION 'PP 포인트가 부족합니다. 현재: %, 필요: %', 
                    user_points_record.pp_points, ABS(NEW.amount);
            END IF;
            
            UPDATE user_points
            SET pp_points = pp_points + NEW.amount,
                total_points = total_points + NEW.amount,
                available_points = available_points + NEW.amount,
                total_spent = total_spent + ABS(NEW.amount)
            WHERE user_id = NEW.user_id;
        END IF;
        
        SELECT pp_points INTO NEW.balance_after
        FROM user_points WHERE user_id = NEW.user_id;
        
    ELSIF NEW.point_type = 'WP' THEN
        NEW.balance_before := user_points_record.wp_points;
        
        IF NEW.amount > 0 THEN
            -- WP 획득 (예측 적중)
            UPDATE user_points
            SET wp_points = wp_points + NEW.amount,
                total_earned = total_earned + NEW.amount
            WHERE user_id = NEW.user_id;
        ELSE
            -- WP 사용 (리워드몰)
            IF user_points_record.wp_points < ABS(NEW.amount) THEN
                RAISE EXCEPTION 'WP 포인트가 부족합니다. 현재: %, 필요: %', 
                    user_points_record.wp_points, ABS(NEW.amount);
            END IF;
            
            UPDATE user_points
            SET wp_points = wp_points + NEW.amount
            WHERE user_id = NEW.user_id;
        END IF;
        
        SELECT wp_points INTO NEW.balance_after
        FROM user_points WHERE user_id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 기존 트리거 삭제 및 새 트리거 생성
DROP TRIGGER IF EXISTS trigger_process_point_transaction ON point_transactions;

CREATE TRIGGER trigger_process_point_transaction_v2
    BEFORE INSERT ON point_transactions
    FOR EACH ROW
    WHEN (NEW.status = 'completed')
    EXECUTE FUNCTION process_point_transaction_v2();

-- 예측 주식 가격 시스템 (1 예측 주식 = 100P)
-- markets 테이블에 가격 관련 컬럼 추가
ALTER TABLE markets
    ADD COLUMN yes_price INTEGER DEFAULT 50,  -- YES 현재 가격 (0-100)
    ADD COLUMN no_price INTEGER DEFAULT 50,   -- NO 현재 가격 (0-100)
    ADD COLUMN yes_shares INTEGER DEFAULT 0,  -- YES 주식 수
    ADD COLUMN no_shares INTEGER DEFAULT 0;   -- NO 주식 수

-- predictions 테이블에 주식 가격 기록
ALTER TABLE predictions
    ADD COLUMN purchase_price INTEGER,  -- 구매 시 가격
    ADD COLUMN shares INTEGER DEFAULT 1, -- 구매한 주식 수
    ADD COLUMN potential_payout INTEGER; -- 잠재 수익 (100 * shares)

-- 주석 추가
COMMENT ON COLUMN user_points.rp_points IS 'Reward Points - 무료 포인트 (광고/로그인/미션)';
COMMENT ON COLUMN user_points.pp_points IS 'Premium Points - 유료 포인트 (결제)';
COMMENT ON COLUMN user_points.wp_points IS 'Winning Points - 보상 포인트 (예측 적중, 환전 불가)';
COMMENT ON COLUMN point_transactions.point_type IS '포인트 타입 (RP/PP/WP)';
COMMENT ON COLUMN markets.yes_price IS 'YES 옵션 현재 가격 (0-100, 가격 = 확률)';
COMMENT ON COLUMN markets.no_price IS 'NO 옵션 현재 가격 (0-100, 가격 = 확률)';
COMMENT ON COLUMN predictions.purchase_price IS '예측 참여 시 구매 가격';
COMMENT ON COLUMN predictions.shares IS '구매한 예측 주식 수';


