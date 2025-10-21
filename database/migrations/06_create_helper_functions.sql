-- 헬퍼 함수 및 유틸리티
-- 자주 사용되는 조회/통계 함수들

-- 1. 사용자 포인트 초기화 함수 (신규 회원가입 시)
CREATE OR REPLACE FUNCTION initialize_user_points(p_user_id UUID, p_referred_by VARCHAR(20) DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
    referrer_id UUID;
    result JSONB;
BEGIN
    -- 이미 존재하는지 확인
    IF EXISTS (SELECT 1 FROM user_points WHERE user_id = p_user_id) THEN
        RAISE EXCEPTION '이미 초기화된 사용자입니다: %', p_user_id;
    END IF;
    
    -- 사용자 포인트 레코드 생성
    INSERT INTO user_points (
        user_id, total_points, available_points, referred_by
    ) VALUES (
        p_user_id, 1000, 1000, p_referred_by
    );
    
    -- 초기 포인트 지급 트랜잭션
    INSERT INTO point_transactions (
        user_id, transaction_type, amount, description, status
    ) VALUES (
        p_user_id, 'daily_login', 1000, '회원가입 환영 포인트', 'completed'
    );
    
    -- 추천인이 있는 경우 보상 지급
    IF p_referred_by IS NOT NULL THEN
        -- 추천인 찾기
        SELECT user_id INTO referrer_id
        FROM user_points
        WHERE referral_code = p_referred_by;
        
        IF referrer_id IS NOT NULL THEN
            -- 추천인에게 보상 (500 포인트)
            INSERT INTO point_transactions (
                user_id, transaction_type, amount, related_user_id,
                description, status
            ) VALUES (
                referrer_id, 'referral_signup', 500, p_user_id,
                '친구 초대 보상', 'completed'
            );
            
            -- 추천인 통계 업데이트
            UPDATE user_points
            SET referral_count = referral_count + 1,
                referral_rewards = referral_rewards + 500
            WHERE user_id = referrer_id;
            
            -- 신규 회원에게도 보너스 (200 포인트)
            INSERT INTO point_transactions (
                user_id, transaction_type, amount, related_user_id,
                description, status
            ) VALUES (
                p_user_id, 'referral_signup', 200, referrer_id,
                '추천인 입력 보너스', 'completed'
            );
        END IF;
    END IF;
    
    -- 결과 반환
    SELECT jsonb_build_object(
        'user_id', user_id,
        'total_points', total_points,
        'referral_code', referral_code,
        'referred_by', referred_by
    ) INTO result
    FROM user_points
    WHERE user_id = p_user_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 2. 활성 마켓 조회 함수
CREATE OR REPLACE FUNCTION get_active_markets(
    p_category_slug VARCHAR(50) DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    market_type VARCHAR(20),
    title VARCHAR(200),
    description TEXT,
    category_slug VARCHAR(50),
    option_yes VARCHAR(100),
    option_no VARCHAR(100),
    total_participants INTEGER,
    total_points_pool INTEGER,
    yes_count INTEGER,
    no_count INTEGER,
    yes_percentage DECIMAL(5,2),
    no_percentage DECIMAL(5,2),
    closes_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.market_type,
        m.title,
        m.description,
        m.category_slug,
        m.option_yes,
        m.option_no,
        m.total_participants,
        m.total_points_pool,
        m.yes_count,
        m.no_count,
        CASE WHEN m.total_participants > 0 
             THEN ROUND((m.yes_count::DECIMAL / m.total_participants) * 100, 2)
             ELSE 0 END AS yes_percentage,
        CASE WHEN m.total_participants > 0 
             THEN ROUND((m.no_count::DECIMAL / m.total_participants) * 100, 2)
             ELSE 0 END AS no_percentage,
        m.closes_at,
        m.created_at
    FROM markets m
    WHERE m.status = 'active'
      AND m.is_closed = false
      AND m.closes_at > NOW()
      AND (p_category_slug IS NULL OR m.category_slug = p_category_slug)
    ORDER BY m.prediction_count DESC, m.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- 3. 사용자 예측 내역 조회 함수
CREATE OR REPLACE FUNCTION get_user_predictions(
    p_user_id UUID,
    p_status VARCHAR(20) DEFAULT NULL, -- 'pending', 'settled', 'correct', 'incorrect'
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    prediction_id UUID,
    market_id UUID,
    market_title VARCHAR(200),
    predicted_option VARCHAR(10),
    points_spent INTEGER,
    points_reward INTEGER,
    is_correct BOOLEAN,
    is_settled BOOLEAN,
    closes_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id AS prediction_id,
        p.market_id,
        m.title AS market_title,
        p.predicted_option,
        p.points_spent,
        p.points_reward,
        p.is_correct,
        p.is_settled,
        m.closes_at,
        p.created_at
    FROM predictions p
    JOIN markets m ON p.market_id = m.id
    WHERE p.user_id = p_user_id
      AND (
          p_status IS NULL OR
          (p_status = 'pending' AND p.is_settled = false) OR
          (p_status = 'settled' AND p.is_settled = true) OR
          (p_status = 'correct' AND p.is_correct = true) OR
          (p_status = 'incorrect' AND p.is_correct = false)
      )
    ORDER BY p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- 4. 리더보드 조회 함수 (포인트 기준)
CREATE OR REPLACE FUNCTION get_leaderboard(
    p_type VARCHAR(20) DEFAULT 'points', -- 'points', 'win_rate', 'streak'
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    rank BIGINT,
    user_id UUID,
    total_points INTEGER,
    win_rate DECIMAL(5,2),
    total_predictions INTEGER,
    correct_predictions INTEGER,
    current_streak INTEGER,
    level INTEGER,
    tier VARCHAR(20)
) AS $$
BEGIN
    IF p_type = 'points' THEN
        RETURN QUERY
        SELECT 
            ROW_NUMBER() OVER (ORDER BY up.total_points DESC) AS rank,
            up.user_id,
            up.total_points,
            up.win_rate,
            up.total_predictions,
            up.correct_predictions,
            up.current_streak,
            up.level,
            up.tier
        FROM user_points up
        ORDER BY up.total_points DESC
        LIMIT p_limit;
    
    ELSIF p_type = 'win_rate' THEN
        RETURN QUERY
        SELECT 
            ROW_NUMBER() OVER (ORDER BY up.win_rate DESC, up.total_predictions DESC) AS rank,
            up.user_id,
            up.total_points,
            up.win_rate,
            up.total_predictions,
            up.correct_predictions,
            up.current_streak,
            up.level,
            up.tier
        FROM user_points up
        WHERE up.total_predictions >= 10 -- 최소 10번 이상 예측한 사용자만
        ORDER BY up.win_rate DESC, up.total_predictions DESC
        LIMIT p_limit;
    
    ELSIF p_type = 'streak' THEN
        RETURN QUERY
        SELECT 
            ROW_NUMBER() OVER (ORDER BY up.current_streak DESC) AS rank,
            up.user_id,
            up.total_points,
            up.win_rate,
            up.total_predictions,
            up.correct_predictions,
            up.current_streak,
            up.level,
            up.tier
        FROM user_points up
        WHERE up.current_streak > 0
        ORDER BY up.current_streak DESC
        LIMIT p_limit;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 5. 마켓 통계 조회 함수
CREATE OR REPLACE FUNCTION get_market_statistics(p_market_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'market_id', m.id,
        'title', m.title,
        'status', m.status,
        'total_participants', m.total_participants,
        'total_points_pool', m.total_points_pool,
        'yes_count', m.yes_count,
        'no_count', m.no_count,
        'yes_points', m.yes_points,
        'no_points', m.no_points,
        'yes_percentage', CASE WHEN m.total_participants > 0 
                               THEN ROUND((m.yes_count::DECIMAL / m.total_participants) * 100, 2)
                               ELSE 0 END,
        'no_percentage', CASE WHEN m.total_participants > 0 
                              THEN ROUND((m.no_count::DECIMAL / m.total_participants) * 100, 2)
                              ELSE 0 END,
        'closes_at', m.closes_at,
        'is_closed', m.is_closed,
        'result', m.result,
        'created_at', m.created_at
    ) INTO result
    FROM markets m
    WHERE m.id = p_market_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 6. 사용자 통계 조회 함수
CREATE OR REPLACE FUNCTION get_user_statistics(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'user_id', up.user_id,
        'total_points', up.total_points,
        'available_points', up.available_points,
        'locked_points', up.locked_points,
        'level', up.level,
        'tier', up.tier,
        'experience_points', up.experience_points,
        'next_level_exp', up.next_level_exp,
        'total_predictions', up.total_predictions,
        'correct_predictions', up.correct_predictions,
        'win_rate', up.win_rate,
        'current_streak', up.current_streak,
        'best_streak', up.best_streak,
        'consecutive_login_days', up.consecutive_login_days,
        'total_login_days', up.total_login_days,
        'referral_code', up.referral_code,
        'referral_count', up.referral_count,
        'referral_rewards', up.referral_rewards
    ) INTO result
    FROM user_points up
    WHERE up.user_id = p_user_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 7. 광고 시청 보상 지급 함수
CREATE OR REPLACE FUNCTION reward_ad_view(
    p_user_id UUID,
    p_ad_type VARCHAR(50) DEFAULT 'video'
)
RETURNS JSONB AS $$
DECLARE
    reward_amount INTEGER := 20; -- 기본 광고 보상
    daily_limit INTEGER := 10; -- 일일 광고 시청 제한
    today_count INTEGER;
    result JSONB;
BEGIN
    -- 오늘 광고 시청 횟수 확인
    SELECT COUNT(*) INTO today_count
    FROM point_transactions
    WHERE user_id = p_user_id
      AND transaction_type = 'ad_reward'
      AND created_at >= CURRENT_DATE;
    
    -- 일일 제한 체크
    IF today_count >= daily_limit THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', '오늘의 광고 시청 제한에 도달했습니다.',
            'daily_limit', daily_limit,
            'today_count', today_count
        );
    END IF;
    
    -- 광고 보상 지급
    INSERT INTO point_transactions (
        user_id, transaction_type, amount, description, status,
        metadata
    ) VALUES (
        p_user_id, 'ad_reward', reward_amount, 
        '광고 시청 보상', 'completed',
        jsonb_build_object('ad_type', p_ad_type)
    );
    
    -- 결과 반환
    result := jsonb_build_object(
        'success', true,
        'points_earned', reward_amount,
        'today_count', today_count + 1,
        'remaining', daily_limit - today_count - 1
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 코멘트 추가
COMMENT ON FUNCTION initialize_user_points IS '신규 회원 포인트 초기화 (회원가입 시 호출)';
COMMENT ON FUNCTION get_active_markets IS '활성 마켓 목록 조회 (카테고리 필터링 가능)';
COMMENT ON FUNCTION get_user_predictions IS '사용자 예측 내역 조회';
COMMENT ON FUNCTION get_leaderboard IS '리더보드 조회 (포인트/승률/연속 정답)';
COMMENT ON FUNCTION get_market_statistics IS '마켓 통계 조회';
COMMENT ON FUNCTION get_user_statistics IS '사용자 통계 조회';
COMMENT ON FUNCTION reward_ad_view IS '광고 시청 보상 지급 (일일 제한 포함)';

