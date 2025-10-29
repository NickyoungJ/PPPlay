-- 마켓 통계 업데이트 함수
CREATE OR REPLACE FUNCTION update_market_stats(
    p_market_id UUID,
    p_option VARCHAR(3),
    p_shares INTEGER,
    p_points INTEGER
)
RETURNS VOID AS $$
BEGIN
    IF p_option = 'yes' THEN
        UPDATE markets
        SET yes_count = yes_count + 1,
            yes_shares = yes_shares + p_shares,
            total_participants = total_participants + 1,
            total_points_pool = total_points_pool + p_points,
            -- 가격 재계산 (간단한 버전: 주식 비율로 계산)
            yes_price = LEAST(95, GREATEST(5, 
                ROUND((yes_shares + p_shares)::DECIMAL / 
                      NULLIF((yes_shares + p_shares + no_shares), 0) * 100)
            )),
            no_price = LEAST(95, GREATEST(5, 
                ROUND(no_shares::DECIMAL / 
                      NULLIF((yes_shares + p_shares + no_shares), 0) * 100)
            ))
        WHERE id = p_market_id;
    ELSE
        UPDATE markets
        SET no_count = no_count + 1,
            no_shares = no_shares + p_shares,
            total_participants = total_participants + 1,
            total_points_pool = total_points_pool + p_points,
            -- 가격 재계산
            yes_price = LEAST(95, GREATEST(5, 
                ROUND(yes_shares::DECIMAL / 
                      NULLIF((yes_shares + no_shares + p_shares), 0) * 100)
            )),
            no_price = LEAST(95, GREATEST(5, 
                ROUND((no_shares + p_shares)::DECIMAL / 
                      NULLIF((yes_shares + no_shares + p_shares), 0) * 100)
            ))
        WHERE id = p_market_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 마켓 결과 확정 및 정산 함수
CREATE OR REPLACE FUNCTION settle_market(
    p_market_id UUID,
    p_result VARCHAR(10),  -- 'yes', 'no', 'cancelled'
    p_admin_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_market RECORD;
    v_prediction RECORD;
    v_winners_count INTEGER := 0;
    v_losers_count INTEGER := 0;
    v_total_wp_issued INTEGER := 0;
    v_total_points_returned INTEGER := 0;
BEGIN
    -- 마켓 정보 조회
    SELECT * INTO v_market
    FROM markets
    WHERE id = p_market_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION '마켓을 찾을 수 없습니다.';
    END IF;
    
    -- 이미 정산된 마켓인지 확인
    IF v_market.status = 'closed' AND v_market.result IS NOT NULL THEN
        RAISE EXCEPTION '이미 정산된 마켓입니다.';
    END IF;
    
    -- 마켓 상태 업데이트
    UPDATE markets
    SET status = 'closed',
        result = p_result,
        is_closed = true,
        settled_at = NOW(),
        settled_by = p_admin_id
    WHERE id = p_market_id;
    
    -- 결과에 따라 정산
    IF p_result = 'yes' OR p_result = 'no' THEN
        -- 정답/오답 처리
        FOR v_prediction IN
            SELECT * FROM predictions
            WHERE market_id = p_market_id
            FOR UPDATE
        LOOP
            IF v_prediction.predicted_option = p_result THEN
                -- 정답자: WP 지급 (주식당 100P)
                v_winners_count := v_winners_count + 1;
                v_total_wp_issued := v_total_wp_issued + v_prediction.potential_payout;
                
                -- WP 지급 트랜잭션
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
                    v_prediction.user_id,
                    'prediction_reward',
                    'WP',
                    v_prediction.potential_payout,
                    p_market_id,
                    v_prediction.id,
                    FORMAT('예측 성공: %s (+ %s WP)', v_market.title, v_prediction.potential_payout),
                    'completed'
                );
                
                -- 예측 레코드 업데이트
                UPDATE predictions
                SET is_correct = true,
                    is_settled = true,
                    settled_at = NOW(),
                    points_reward = v_prediction.potential_payout
                WHERE id = v_prediction.id;
                
                -- 유저 통계 업데이트
                UPDATE user_points
                SET correct_predictions = correct_predictions + 1,
                    experience_points = experience_points + 10  -- 경험치 보상
                WHERE user_id = v_prediction.user_id;
                
            ELSE
                -- 오답자: 포인트 소각 (아무것도 하지 않음, 이미 차감됨)
                v_losers_count := v_losers_count + 1;
                
                UPDATE predictions
                SET is_correct = false,
                    is_settled = true,
                    settled_at = NOW(),
                    points_reward = 0
                WHERE id = v_prediction.id;
            END IF;
        END LOOP;
        
    ELSIF p_result = 'cancelled' THEN
        -- 취소: 모든 사용자에게 포인트 환불
        FOR v_prediction IN
            SELECT * FROM predictions
            WHERE market_id = p_market_id
            FOR UPDATE
        LOOP
            v_total_points_returned := v_total_points_returned + v_prediction.points_spent;
            
            -- 포인트 환불 (RP로 환불)
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
                v_prediction.user_id,
                'prediction_refund',
                'RP',
                v_prediction.points_spent,
                p_market_id,
                v_prediction.id,
                FORMAT('마켓 취소 환불: %s (+ %s RP)', v_market.title, v_prediction.points_spent),
                'completed'
            );
            
            UPDATE predictions
            SET is_correct = NULL,
                is_settled = true,
                settled_at = NOW(),
                points_reward = v_prediction.points_spent
            WHERE id = v_prediction.id;
        END LOOP;
    END IF;
    
    -- 결과 반환
    RETURN jsonb_build_object(
        'success', true,
        'market_id', p_market_id,
        'result', p_result,
        'winners_count', v_winners_count,
        'losers_count', v_losers_count,
        'total_wp_issued', v_total_wp_issued,
        'total_points_returned', v_total_points_returned,
        'settled_at', NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- 코멘트
COMMENT ON FUNCTION update_market_stats IS '마켓 통계 업데이트 (예측 참여 시)';
COMMENT ON FUNCTION settle_market IS '마켓 결과 확정 및 정산 (Admin)';


