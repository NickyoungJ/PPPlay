-- ================================================================
-- 마이그레이션: 복잡한 주식/베팅 시스템 → 단순 투표 시스템
-- PRD 기반: InsightVote 여론조사 & 예측 플랫폼
-- ================================================================
-- 
-- 변경 사항:
-- 1. markets 테이블: 주식 가격/주식 수 제거, 투표 수 중심으로 변경
-- 2. predictions 테이블: 주식 구매 개념 제거, 단순 투표로 변경
-- 3. user_points 테이블: RP/PP/WP → 단일 포인트로 간소화
-- 4. point_transactions 테이블: 거래 타입 간소화
-- 5. 함수 수정: 주식 가격 계산 → 투표 비율 계산
-- 6. 정산 로직 수정: 풀 분배 → 고정 보상
-- ================================================================

BEGIN;

-- ================================================================
-- STEP 1: markets 테이블 간소화
-- ================================================================

-- 주식/베팅 관련 컬럼 제거
ALTER TABLE markets
    DROP COLUMN IF EXISTS yes_price,
    DROP COLUMN IF EXISTS no_price,
    DROP COLUMN IF EXISTS yes_shares,
    DROP COLUMN IF EXISTS no_shares,
    DROP COLUMN IF EXISTS total_points_pool,
    DROP COLUMN IF EXISTS min_points,
    DROP COLUMN IF EXISTS max_points,
    DROP COLUMN IF EXISTS yes_points,
    DROP COLUMN IF EXISTS no_points;

-- 투표 비율 컬럼 추가
ALTER TABLE markets
    ADD COLUMN IF NOT EXISTS yes_percentage DECIMAL(5,2) DEFAULT 0 CHECK (yes_percentage >= 0 AND yes_percentage <= 100),
    ADD COLUMN IF NOT EXISTS no_percentage DECIMAL(5,2) DEFAULT 0 CHECK (no_percentage >= 0 AND no_percentage <= 100);

-- settled_at, settled_by 컬럼 추가 (없는 경우)
ALTER TABLE markets
    ADD COLUMN IF NOT EXISTS settled_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS settled_by UUID;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_markets_settled ON markets(settled_at);

COMMENT ON COLUMN markets.yes_percentage IS 'YES 투표 비율 (%)';
COMMENT ON COLUMN markets.no_percentage IS 'NO 투표 비율 (%)';

-- ================================================================
-- STEP 2: predictions 테이블 간소화
-- ================================================================

-- 주식/베팅 관련 컬럼 제거
ALTER TABLE predictions
    DROP COLUMN IF EXISTS point_type,
    DROP COLUMN IF EXISTS points_spent,
    DROP COLUMN IF EXISTS purchase_price,
    DROP COLUMN IF EXISTS shares,
    DROP COLUMN IF EXISTS potential_payout;

-- 투표 보상 컬럼 추가
ALTER TABLE predictions
    ADD COLUMN IF NOT EXISTS participation_reward INTEGER DEFAULT 5,  -- 참여 보상 (즉시)
    ADD COLUMN IF NOT EXISTS accuracy_reward INTEGER DEFAULT 0;       -- 적중 보상 (결과 확정 후)

-- points_reward 컬럼이 없다면 추가
ALTER TABLE predictions
    ADD COLUMN IF NOT EXISTS points_reward INTEGER DEFAULT 0;

COMMENT ON COLUMN predictions.participation_reward IS '투표 참여 보상 (+5P, 즉시 지급)';
COMMENT ON COLUMN predictions.accuracy_reward IS '예측 적중 보상 (+20P, 결과 확정 후)';

-- ================================================================
-- STEP 3: user_points 테이블 간소화 (Option B: RP만 사용)
-- ================================================================

-- PP, WP는 유지하되 사용하지 않음 (기존 코드 호환성)
-- rp_points를 주요 포인트로 활용
-- 필요 시 나중에 컬럼 제거 가능

-- 일일 투표 제한 컬럼 추가
ALTER TABLE user_points
    ADD COLUMN IF NOT EXISTS daily_votes INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_vote_date DATE,
    ADD COLUMN IF NOT EXISTS total_votes INTEGER DEFAULT 0;

-- 기존 total_predictions가 있다면 total_votes로 의미 변경
COMMENT ON COLUMN user_points.total_predictions IS '총 투표/예측 수 (= total_votes)';
COMMENT ON COLUMN user_points.daily_votes IS '오늘 투표 수 (일일 10회 제한)';
COMMENT ON COLUMN user_points.last_vote_date IS '마지막 투표 날짜';

-- ================================================================
-- STEP 4: point_transactions 거래 타입 간소화
-- ================================================================

-- 기존 제약 조건 제거
ALTER TABLE point_transactions
    DROP CONSTRAINT IF EXISTS point_transactions_transaction_type_check;

-- 새로운 제약 조건 추가 (PRD 기반)
ALTER TABLE point_transactions
    ADD CONSTRAINT point_transactions_transaction_type_check
    CHECK (transaction_type IN (
        -- 핵심 거래 타입 (PRD 기반)
        'vote_participation',     -- +5P  (투표 참여, 즉시)
        'prediction_correct',     -- +20P (예측 적중, 결과 확정 후)
        'topic_proposal',         -- +50P (주제 제안 승인)
        'comment_reward',         -- +3P  (댓글 작성)
        'weekly_attendance',      -- +100P (7일 연속 출석)
        'admin_adjustment',       -- 가변 (관리자 조정)
        
        -- 기존 호환성 유지
        'daily_login',            -- 출석 체크
        'consecutive_bonus',      -- 연속 출석 보너스
        'ad_reward',              -- 광고 시청
        'mission_reward',         -- 미션 보상
        'referral_signup',        -- 친구 초대
        'referral_activity',      -- 친구 활동
        'pp_purchase',            -- PP 구매 (미사용)
        'prediction_spent',       -- 예측 참여 (기존)
        'prediction_reward',      -- 예측 성공 (기존)
        'prediction_refund',      -- 예측 취소
        'market_creation',        -- 마켓 개설
        'creator_bonus',          -- 개설자 보너스
        'level_up_bonus',         -- 레벨업
        'achievement_reward',     -- 업적 달성
        'reward_shop',            -- 리워드 상점
        'wp_to_giftcard'          -- 기프티콘 교환 (미사용)
    ));

-- ================================================================
-- STEP 5: 투표 비율 자동 계산 함수
-- ================================================================

DROP FUNCTION IF EXISTS update_vote_percentage() CASCADE;

CREATE OR REPLACE FUNCTION update_vote_percentage()
RETURNS TRIGGER AS $$
BEGIN
    -- 총 참여자가 0이면 비율도 0
    IF NEW.total_participants = 0 THEN
        NEW.yes_percentage := 0;
        NEW.no_percentage := 0;
    ELSE
        -- YES 비율 계산 (소수점 2자리)
        NEW.yes_percentage := ROUND(
            (NEW.yes_count::DECIMAL / NEW.total_participants) * 100, 
            2
        );
        
        -- NO 비율 계산 (소수점 2자리)
        NEW.no_percentage := ROUND(
            (NEW.no_count::DECIMAL / NEW.total_participants) * 100, 
            2
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성: markets 테이블 업데이트 시 비율 자동 계산
DROP TRIGGER IF EXISTS trigger_update_vote_percentage ON markets;

CREATE TRIGGER trigger_update_vote_percentage
    BEFORE UPDATE OF yes_count, no_count, total_participants ON markets
    FOR EACH ROW
    EXECUTE FUNCTION update_vote_percentage();

COMMENT ON FUNCTION update_vote_percentage IS '투표 비율 자동 계산 (YES/NO 비율)';

-- ================================================================
-- STEP 6: 투표 참여 시 마켓 통계 업데이트 함수 (간소화)
-- ================================================================

DROP FUNCTION IF EXISTS update_market_stats_for_poll(UUID, VARCHAR) CASCADE;

CREATE OR REPLACE FUNCTION update_market_stats_for_poll(
    p_market_id UUID,
    p_option VARCHAR(3)
)
RETURNS VOID AS $$
BEGIN
    -- 투표 수만 증가 (포인트 계산 제거)
    IF p_option = 'yes' THEN
        UPDATE markets
        SET yes_count = yes_count + 1,
            total_participants = total_participants + 1
        WHERE id = p_market_id;
    ELSIF p_option = 'no' THEN
        UPDATE markets
        SET no_count = no_count + 1,
            total_participants = total_participants + 1
        WHERE id = p_market_id;
    ELSE
        RAISE EXCEPTION '잘못된 옵션입니다: %. "yes" 또는 "no"만 가능합니다.', p_option;
    END IF;
    
    -- 비율은 트리거에서 자동 계산됨
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_market_stats_for_poll IS '투표 참여 시 마켓 통계 업데이트 (투표 수 증가)';

-- ================================================================
-- STEP 7: 마켓 정산 함수 (고정 보상)
-- ================================================================

DROP FUNCTION IF EXISTS settle_market_simple(UUID, VARCHAR) CASCADE;

CREATE OR REPLACE FUNCTION settle_market_simple(
    p_market_id UUID,
    p_result VARCHAR(10),  -- 'yes', 'no', 'cancelled'
    p_admin_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_market RECORD;
    v_winners_count INTEGER := 0;
    v_total_rewards INTEGER := 0;
    v_result JSONB;
BEGIN
    -- 1. 마켓 정보 조회
    SELECT * INTO v_market
    FROM markets
    WHERE id = p_market_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION '마켓을 찾을 수 없습니다: %', p_market_id;
    END IF;
    
    -- 이미 정산된 마켓인지 확인
    IF v_market.result IS NOT NULL AND v_market.settled_at IS NOT NULL THEN
        RAISE EXCEPTION '이미 정산된 마켓입니다: %', p_market_id;
    END IF;
    
    -- 2. 마켓 결과 확정
    UPDATE markets
    SET result = p_result,
        status = 'closed',
        is_closed = true,
        settled_at = NOW(),
        settled_by = p_admin_id,
        result_confirmed_at = NOW(),
        result_confirmed_by = p_admin_id
    WHERE id = p_market_id;
    
    -- 3. 결과에 따른 정산
    IF p_result IN ('yes', 'no') THEN
        -- 정답자 확인 및 보상 지급
        WITH winners AS (
            SELECT 
                p.id,
                p.user_id,
                p.predicted_option
            FROM predictions p
            WHERE p.market_id = p_market_id
              AND p.predicted_option = p_result
              AND p.is_settled = false
        )
        UPDATE predictions p
        SET 
            is_correct = (p.predicted_option = p_result),
            accuracy_reward = CASE WHEN p.predicted_option = p_result THEN 20 ELSE 0 END,
            is_settled = true,
            settled_at = NOW()
        WHERE p.market_id = p_market_id
        RETURNING is_correct, accuracy_reward;
        
        -- 정답자 수 및 총 보상 계산
        SELECT 
            COUNT(*) FILTER (WHERE is_correct = true),
            COALESCE(SUM(accuracy_reward), 0)
        INTO v_winners_count, v_total_rewards
        FROM predictions
        WHERE market_id = p_market_id AND is_settled = true;
        
        -- 4. 포인트 트랜잭션 생성 (정답자에게 +20P)
        INSERT INTO point_transactions (
            user_id,
            transaction_type,
            point_type,
            amount,
            market_id,
            prediction_id,
            description,
            status
        )
        SELECT 
            p.user_id,
            'prediction_correct',
            'RP',
            20,
            p_market_id,
            p.id,
            FORMAT('예측 적중: %s (+20P)', v_market.title),
            'completed'
        FROM predictions p
        WHERE p.market_id = p_market_id
          AND p.is_correct = true
          AND p.is_settled = true;
        
        -- 5. 사용자 통계 업데이트
        UPDATE user_points up
        SET 
            correct_predictions = correct_predictions + 1,
            win_rate = CASE 
                WHEN total_predictions > 0 
                THEN ROUND((correct_predictions + 1)::DECIMAL / total_predictions * 100, 2)
                ELSE 0 
            END
        FROM predictions p
        WHERE p.user_id = up.user_id
          AND p.market_id = p_market_id
          AND p.is_correct = true;
        
    ELSIF p_result = 'cancelled' THEN
        -- 마켓 취소: 모든 예측 무효 처리 (보상 없음)
        UPDATE predictions
        SET 
            is_correct = NULL,
            is_settled = true,
            settled_at = NOW()
        WHERE market_id = p_market_id;
        
        v_winners_count := 0;
        v_total_rewards := 0;
    ELSE
        RAISE EXCEPTION '잘못된 결과값입니다: %. "yes", "no", "cancelled"만 가능합니다.', p_result;
    END IF;
    
    -- 6. 결과 반환
    v_result := jsonb_build_object(
        'success', true,
        'market_id', p_market_id,
        'result', p_result,
        'winners_count', v_winners_count,
        'total_rewards', v_total_rewards,
        'settled_at', NOW()
    );
    
    RETURN v_result;
    
EXCEPTION WHEN OTHERS THEN
    -- 에러 발생 시 롤백
    RAISE EXCEPTION '정산 중 오류 발생: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION settle_market_simple IS '마켓 정산 (고정 보상: 적중 시 +20P)';

-- ================================================================
-- STEP 8: 일일 투표 제한 체크 함수
-- ================================================================

DROP FUNCTION IF EXISTS check_daily_vote_limit(UUID) CASCADE;

CREATE OR REPLACE FUNCTION check_daily_vote_limit(
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_points RECORD;
    v_today DATE := CURRENT_DATE;
    v_daily_limit INTEGER := 10;  -- PRD: 하루 10회 제한
BEGIN
    -- 사용자 포인트 레코드 조회
    SELECT * INTO v_user_points
    FROM user_points
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        -- 사용자 레코드가 없으면 OK (첫 투표)
        RETURN true;
    END IF;
    
    -- 날짜 변경 확인
    IF v_user_points.last_vote_date IS NULL OR v_user_points.last_vote_date < v_today THEN
        -- 새로운 날짜: 카운터 리셋
        UPDATE user_points
        SET daily_votes = 0,
            last_vote_date = v_today
        WHERE user_id = p_user_id;
        
        RETURN true;
    END IF;
    
    -- 당일 투표 수 확인
    IF v_user_points.daily_votes >= v_daily_limit THEN
        RETURN false;  -- 제한 초과
    ELSE
        RETURN true;   -- 투표 가능
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_daily_vote_limit IS '일일 투표 제한 체크 (하루 10회)';

-- ================================================================
-- STEP 9: 투표 참여 시 일일 카운터 증가 함수
-- ================================================================

DROP FUNCTION IF EXISTS increment_daily_vote_count(UUID) CASCADE;

CREATE OR REPLACE FUNCTION increment_daily_vote_count(
    p_user_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_today DATE := CURRENT_DATE;
BEGIN
    -- 사용자 포인트 레코드 업데이트
    UPDATE user_points
    SET 
        daily_votes = CASE 
            WHEN last_vote_date = v_today THEN daily_votes + 1
            ELSE 1  -- 새로운 날짜면 1부터 시작
        END,
        last_vote_date = v_today,
        total_votes = COALESCE(total_votes, 0) + 1
    WHERE user_id = p_user_id;
    
    -- 레코드가 없으면 생성
    IF NOT FOUND THEN
        INSERT INTO user_points (user_id, daily_votes, last_vote_date, total_votes, rp_points)
        VALUES (p_user_id, 1, v_today, 1, 1000);  -- 초기 1000 RP
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_daily_vote_count IS '일일 투표 카운터 증가';

-- ================================================================
-- STEP 10: 기존 함수 제거 (사용하지 않음)
-- ================================================================

-- 주식 가격 계산 함수 제거
DROP FUNCTION IF EXISTS update_market_stats(UUID, VARCHAR, INTEGER, INTEGER) CASCADE;

-- 기존 복잡한 정산 함수 제거
DROP FUNCTION IF EXISTS settle_market(UUID, VARCHAR, UUID) CASCADE;

-- 기존 예측 정산 함수 제거 (settle_market_simple로 통합)
DROP FUNCTION IF EXISTS settle_prediction(UUID) CASCADE;
DROP FUNCTION IF EXISTS settle_market_predictions(UUID) CASCADE;

-- ================================================================
-- STEP 11: 기존 트리거 수정
-- ================================================================

-- predictions 테이블의 통계 업데이트 트리거 제거 (새로운 로직으로 대체)
DROP TRIGGER IF EXISTS trigger_update_market_stats_on_prediction ON predictions;
DROP FUNCTION IF EXISTS update_market_stats_on_prediction() CASCADE;

-- 새로운 트리거 함수: 투표 참여 시 통계 업데이트 (포인트 차감 제거)
CREATE OR REPLACE FUNCTION update_market_stats_on_vote()
RETURNS TRIGGER AS $$
BEGIN
    -- 마켓 통계 업데이트 (투표 수만 증가)
    UPDATE markets
    SET 
        total_participants = total_participants + 1,
        prediction_count = prediction_count + 1,
        yes_count = CASE WHEN NEW.predicted_option = 'yes' THEN yes_count + 1 ELSE yes_count END,
        no_count = CASE WHEN NEW.predicted_option = 'no' THEN no_count + 1 ELSE no_count END
    WHERE id = NEW.market_id;
    
    -- 사용자 통계 업데이트
    UPDATE user_points
    SET 
        total_predictions = COALESCE(total_predictions, 0) + 1
    WHERE user_id = NEW.user_id;
    
    -- 참여 보상 트랜잭션 생성 (+5P)
    INSERT INTO point_transactions (
        user_id,
        transaction_type,
        point_type,
        amount,
        market_id,
        prediction_id,
        description,
        status
    ) VALUES (
        NEW.user_id,
        'vote_participation',
        'RP',
        5,
        NEW.market_id,
        NEW.id,
        '투표 참여 보상 (+5P)',
        'completed'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER trigger_update_market_stats_on_vote
    AFTER INSERT ON predictions
    FOR EACH ROW
    EXECUTE FUNCTION update_market_stats_on_vote();

COMMENT ON FUNCTION update_market_stats_on_vote IS '투표 참여 시 통계 업데이트 (포인트 차감 없음, +5P 보상)';

-- ================================================================
-- STEP 12: 데이터 마이그레이션 (기존 데이터 정리)
-- ================================================================

-- 기존 마켓의 비율 재계산
UPDATE markets
SET 
    yes_percentage = CASE 
        WHEN total_participants > 0 THEN ROUND((yes_count::DECIMAL / total_participants) * 100, 2)
        ELSE 0 
    END,
    no_percentage = CASE 
        WHEN total_participants > 0 THEN ROUND((no_count::DECIMAL / total_participants) * 100, 2)
        ELSE 0 
    END;

-- 기존 예측의 보상 값 설정 (participation_reward, accuracy_reward)
UPDATE predictions
SET 
    participation_reward = 5,  -- 모든 투표에 +5P
    accuracy_reward = CASE 
        WHEN is_correct = true THEN 20  -- 적중 시 +20P
        ELSE 0 
    END
WHERE participation_reward IS NULL OR accuracy_reward IS NULL;

-- ================================================================
-- STEP 13: 권한 설정 (RLS)
-- ================================================================

-- RLS가 활성화되어 있다면 새로운 함수들에 대한 권한 부여
-- (필요시 추가)

COMMIT;

-- ================================================================
-- 마이그레이션 완료!
-- ================================================================

SELECT 
    '✅ 마이그레이션 완료!' AS status,
    '복잡한 주식/베팅 시스템 → 단순 투표 시스템 전환 성공' AS message,
    NOW() AS completed_at;

