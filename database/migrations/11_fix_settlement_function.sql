-- =============================================
-- 11. 정산 함수 수정 (point_type 제거)
-- =============================================
-- 설명: settle_market_simple 함수에서 point_type 컬럼 제거
-- 작성일: 2025-11-18

DROP FUNCTION IF EXISTS settle_market_simple(UUID, TEXT, UUID) CASCADE;

CREATE OR REPLACE FUNCTION settle_market_simple(
    p_market_id UUID,
    p_result TEXT,
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
    WHERE id = p_market_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION '마켓을 찾을 수 없습니다: %', p_market_id;
    END IF;
    
    -- 이미 정산된 마켓 확인
    IF v_market.result IS NOT NULL THEN
        RAISE EXCEPTION '이미 정산된 마켓입니다. 결과: %', v_market.result;
    END IF;
    
    -- 2. 마켓 결과 업데이트
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
        UPDATE predictions p
        SET 
            is_correct = (p.predicted_option = p_result),
            accuracy_reward = CASE WHEN p.predicted_option = p_result THEN 20 ELSE 0 END,
            is_settled = true,
            settled_at = NOW()
        WHERE p.market_id = p_market_id;
        
        -- 정답자 수 및 총 보상 계산
        SELECT 
            COUNT(*) FILTER (WHERE is_correct = true),
            COALESCE(SUM(accuracy_reward), 0)
        INTO v_winners_count, v_total_rewards
        FROM predictions
        WHERE market_id = p_market_id AND is_settled = true;
        
        -- 4. 포인트 트랜잭션 생성 (정답자에게 +20P) - point_type 제거
        INSERT INTO point_transactions (
            user_id,
            transaction_type,
            amount,
            market_id,
            prediction_id,
            description,
            status
        )
        SELECT 
            p.user_id,
            'prediction_correct',
            20,
            p_market_id,
            p.id,
            FORMAT('예측 적중: %s (+20P)', v_market.title),
            'completed'
        FROM predictions p
        WHERE p.market_id = p_market_id
          AND p.is_correct = true
          AND p.is_settled = true;
        
        -- 5. 사용자 포인트 업데이트 (+20P)
        UPDATE user_points up
        SET 
            total_points = total_points + 20,
            available_points = available_points + 20,
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

COMMENT ON FUNCTION settle_market_simple IS '마켓 정산 (고정 보상: 적중 시 +20P) - point_type 제거 버전';

-- 검증 쿼리
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'settle_market_simple';

