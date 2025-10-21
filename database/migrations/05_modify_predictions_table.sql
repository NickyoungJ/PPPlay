-- predictions 테이블 수정
-- 기존 예측 테이블을 markets 테이블과 연동하도록 수정

-- 1. 새로운 predictions 테이블 생성 (기존 구조 개선)
DROP TABLE IF EXISTS predictions CASCADE;

CREATE TABLE predictions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 사용자 정보
    user_id UUID NOT NULL, -- auth.users 참조
    
    -- 마켓 연결 (통합)
    market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    
    -- 예측 선택
    predicted_option VARCHAR(10) NOT NULL CHECK (predicted_option IN ('yes', 'no')),
    -- 스포츠의 경우: 'yes' = 홈팀/option_yes, 'no' = 원정팀/option_no
    -- 일반의 경우: 'yes' = Yes, 'no' = No
    
    -- 포인트 정보
    points_spent INTEGER NOT NULL DEFAULT 10,
    points_reward INTEGER DEFAULT 0,
    
    -- 결과
    is_correct BOOLEAN, -- NULL: 결과 미확정, true: 정답, false: 오답
    is_settled BOOLEAN DEFAULT false, -- 정산 완료 여부
    settled_at TIMESTAMP WITH TIME ZONE, -- 정산 시간
    
    -- 예측 시점 정보 (추후 분석용)
    predicted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    market_closes_at TIMESTAMP WITH TIME ZONE, -- 예측 시점의 마감 시간
    
    -- 예측 컨텍스트 (옵션)
    prediction_metadata JSONB, -- 예측 당시의 추가 정보
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 중복 예측 방지 (한 마켓당 한 번만 예측 가능)
    UNIQUE(user_id, market_id)
);

-- 인덱스 생성
CREATE INDEX idx_predictions_user ON predictions(user_id);
CREATE INDEX idx_predictions_market ON predictions(market_id);
CREATE INDEX idx_predictions_settled ON predictions(is_settled);
CREATE INDEX idx_predictions_correct ON predictions(is_correct) WHERE is_correct IS NOT NULL;
CREATE INDEX idx_predictions_user_date ON predictions(user_id, created_at DESC);
CREATE INDEX idx_predictions_market_option ON predictions(market_id, predicted_option);

-- JSONB 메타데이터 검색을 위한 GIN 인덱스
CREATE INDEX idx_predictions_metadata ON predictions USING GIN (prediction_metadata);

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_predictions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 업데이트 트리거
CREATE TRIGGER trigger_update_predictions_updated_at
    BEFORE UPDATE ON predictions
    FOR EACH ROW
    EXECUTE FUNCTION update_predictions_updated_at();

-- 예측 생성 시 마켓 통계 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_market_stats_on_prediction()
RETURNS TRIGGER AS $$
BEGIN
    -- 마켓 통계 업데이트
    UPDATE markets
    SET total_participants = total_participants + 1,
        total_points_pool = total_points_pool + NEW.points_spent,
        prediction_count = prediction_count + 1,
        yes_count = CASE WHEN NEW.predicted_option = 'yes' THEN yes_count + 1 ELSE yes_count END,
        no_count = CASE WHEN NEW.predicted_option = 'no' THEN no_count + 1 ELSE no_count END,
        yes_points = CASE WHEN NEW.predicted_option = 'yes' THEN yes_points + NEW.points_spent ELSE yes_points END,
        no_points = CASE WHEN NEW.predicted_option = 'no' THEN no_points + NEW.points_spent ELSE no_points END
    WHERE id = NEW.market_id;
    
    -- 사용자 통계 업데이트
    UPDATE user_points
    SET total_predictions = total_predictions + 1,
        locked_points = locked_points + NEW.points_spent,
        experience_points = experience_points + 5 -- 예측 참여 경험치
    WHERE user_id = NEW.user_id;
    
    -- 포인트 차감 트랜잭션 생성
    INSERT INTO point_transactions (
        user_id, transaction_type, amount, market_id, prediction_id,
        description, status
    ) VALUES (
        NEW.user_id, 'prediction_spent', -NEW.points_spent, NEW.market_id, NEW.id,
        '예측 참여', 'completed'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 예측 생성 트리거
CREATE TRIGGER trigger_update_market_stats_on_prediction
    AFTER INSERT ON predictions
    FOR EACH ROW
    EXECUTE FUNCTION update_market_stats_on_prediction();

-- 예측 정산 함수
CREATE OR REPLACE FUNCTION settle_prediction(p_prediction_id UUID)
RETURNS JSONB AS $$
DECLARE
    pred_record RECORD;
    market_record RECORD;
    reward_amount INTEGER := 0;
    result JSONB;
BEGIN
    -- 예측 레코드 조회
    SELECT * INTO pred_record
    FROM predictions
    WHERE id = p_prediction_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION '예측을 찾을 수 없습니다: %', p_prediction_id;
    END IF;
    
    -- 이미 정산된 경우
    IF pred_record.is_settled THEN
        RAISE EXCEPTION '이미 정산된 예측입니다: %', p_prediction_id;
    END IF;
    
    -- 마켓 레코드 조회
    SELECT * INTO market_record
    FROM markets
    WHERE id = pred_record.market_id;
    
    IF market_record.result IS NULL THEN
        RAISE EXCEPTION '마켓 결과가 확정되지 않았습니다: %', pred_record.market_id;
    END IF;
    
    -- 정답 여부 확인
    IF pred_record.predicted_option = market_record.result THEN
        -- 정답: 보상 계산
        pred_record.is_correct := true;
        
        -- 보상 계산 (총 풀의 90%를 정답자들이 나눔)
        IF market_record.result = 'yes' AND market_record.yes_count > 0 THEN
            reward_amount := FLOOR((market_record.total_points_pool * 0.9 / market_record.yes_count));
        ELSIF market_record.result = 'no' AND market_record.no_count > 0 THEN
            reward_amount := FLOOR((market_record.total_points_pool * 0.9 / market_record.no_count));
        END IF;
        
        -- 최소 보상 보장 (원금 + 10%)
        IF reward_amount < pred_record.points_spent * 1.1 THEN
            reward_amount := FLOOR(pred_record.points_spent * 1.1);
        END IF;
        
    ELSE
        -- 오답: 보상 없음
        pred_record.is_correct := false;
        reward_amount := 0;
    END IF;
    
    -- 예측 레코드 업데이트
    UPDATE predictions
    SET is_correct = pred_record.is_correct,
        is_settled = true,
        points_reward = reward_amount,
        settled_at = NOW()
    WHERE id = p_prediction_id;
    
    -- 사용자 포인트 업데이트
    UPDATE user_points
    SET locked_points = locked_points - pred_record.points_spent,
        correct_predictions = CASE WHEN pred_record.is_correct THEN correct_predictions + 1 ELSE correct_predictions END,
        current_streak = CASE WHEN pred_record.is_correct THEN current_streak + 1 ELSE 0 END,
        best_streak = CASE WHEN pred_record.is_correct AND current_streak + 1 > best_streak 
                           THEN current_streak + 1 ELSE best_streak END,
        experience_points = experience_points + CASE WHEN pred_record.is_correct THEN 10 ELSE 2 END
    WHERE user_id = pred_record.user_id;
    
    -- 정답인 경우 포인트 지급
    IF pred_record.is_correct AND reward_amount > 0 THEN
        INSERT INTO point_transactions (
            user_id, transaction_type, amount, market_id, prediction_id,
            description, status
        ) VALUES (
            pred_record.user_id, 'prediction_reward', reward_amount, 
            pred_record.market_id, p_prediction_id,
            '예측 성공 보상', 'completed'
        );
    END IF;
    
    -- 결과 반환
    result := jsonb_build_object(
        'prediction_id', p_prediction_id,
        'is_correct', pred_record.is_correct,
        'points_spent', pred_record.points_spent,
        'points_reward', reward_amount,
        'settled_at', NOW()
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 마켓의 모든 예측 일괄 정산 함수
CREATE OR REPLACE FUNCTION settle_market_predictions(p_market_id UUID)
RETURNS JSONB AS $$
DECLARE
    settled_count INTEGER := 0;
    correct_count INTEGER := 0;
    total_rewards INTEGER := 0;
    pred_record RECORD;
    result JSONB;
BEGIN
    -- 마켓의 미정산 예측들을 모두 정산
    FOR pred_record IN 
        SELECT id FROM predictions 
        WHERE market_id = p_market_id AND is_settled = false
        FOR UPDATE
    LOOP
        BEGIN
            PERFORM settle_prediction(pred_record.id);
            settled_count := settled_count + 1;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING '예측 정산 실패: %, 오류: %', pred_record.id, SQLERRM;
        END;
    END LOOP;
    
    -- 정산 결과 집계
    SELECT 
        COUNT(*) FILTER (WHERE is_correct = true),
        COALESCE(SUM(points_reward), 0)
    INTO correct_count, total_rewards
    FROM predictions
    WHERE market_id = p_market_id AND is_settled = true;
    
    -- 결과 반환
    result := jsonb_build_object(
        'market_id', p_market_id,
        'settled_count', settled_count,
        'correct_count', correct_count,
        'total_rewards', total_rewards
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 코멘트 추가
COMMENT ON TABLE predictions IS '사용자 예측 테이블 (마켓 기반)';
COMMENT ON COLUMN predictions.predicted_option IS '예측 선택: yes(홈팀/Yes) 또는 no(원정팀/No)';
COMMENT ON COLUMN predictions.is_correct IS '정답 여부 (NULL: 미확정, true: 정답, false: 오답)';
COMMENT ON COLUMN predictions.is_settled IS '정산 완료 여부';
COMMENT ON FUNCTION settle_prediction IS '개별 예측 정산 (결과 확정 후 호출)';
COMMENT ON FUNCTION settle_market_predictions IS '마켓의 모든 예측 일괄 정산';

