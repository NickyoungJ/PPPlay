-- 닉네임 기능 추가
-- user_points 테이블에 nickname 컬럼이 없으면 추가

-- 1. nickname 컬럼 추가 (이미 존재할 수 있으므로 IF NOT EXISTS 사용 불가, 조건부 실행)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_points' AND column_name = 'nickname'
    ) THEN
        ALTER TABLE user_points ADD COLUMN nickname VARCHAR(20);
    END IF;
END $$;

-- 2. 닉네임 유니크 인덱스 (NULL 허용, 중복 방지)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_points_nickname 
ON user_points(nickname) 
WHERE nickname IS NOT NULL;

-- 3. 닉네임 검증 함수
CREATE OR REPLACE FUNCTION validate_nickname(input_nickname VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    -- NULL 허용
    IF input_nickname IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- 길이 검증 (2-12자)
    IF LENGTH(input_nickname) < 2 OR LENGTH(input_nickname) > 12 THEN
        RETURN FALSE;
    END IF;
    
    -- 허용 문자: 한글, 영문, 숫자, 언더스코어
    IF input_nickname !~ '^[가-힣a-zA-Z0-9_]+$' THEN
        RETURN FALSE;
    END IF;
    
    -- 금지어 체크 (기본적인 것들)
    IF LOWER(input_nickname) ~ '(admin|관리자|운영자|시스템|system)' THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 4. 닉네임 변경 함수
CREATE OR REPLACE FUNCTION update_user_nickname(
    p_user_id UUID,
    p_nickname VARCHAR
)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    -- 닉네임 유효성 검증
    IF NOT validate_nickname(p_nickname) THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', '닉네임은 2-12자의 한글, 영문, 숫자, 언더스코어만 사용 가능합니다.'
        );
    END IF;
    
    -- 중복 체크
    IF p_nickname IS NOT NULL AND EXISTS (
        SELECT 1 FROM user_points 
        WHERE nickname = p_nickname AND user_id != p_user_id
    ) THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', '이미 사용 중인 닉네임입니다.'
        );
    END IF;
    
    -- 닉네임 업데이트
    UPDATE user_points
    SET nickname = p_nickname
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        -- user_points 레코드가 없으면 생성
        INSERT INTO user_points (user_id, nickname)
        VALUES (p_user_id, p_nickname);
    END IF;
    
    RETURN json_build_object(
        'success', TRUE,
        'nickname', p_nickname
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 주석 추가
COMMENT ON COLUMN user_points.nickname IS '사용자 닉네임 (2-12자, 한글/영문/숫자/언더스코어)';

