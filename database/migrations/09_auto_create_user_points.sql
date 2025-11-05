-- 신규 유저 가입 시 자동으로 user_points 생성 (초기 RP 1000점 지급)
-- Supabase Auth Trigger 사용

-- 1. 신규 유저 생성 시 자동으로 user_points 생성하는 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_referral_code VARCHAR(20);
BEGIN
    -- 고유한 추천인 코드 생성 (user_id 기반)
    v_referral_code := 'REF' || UPPER(SUBSTRING(NEW.id::TEXT FROM 1 FOR 8));

    -- user_points 테이블에 신규 유저 데이터 삽입
    INSERT INTO public.user_points (
        user_id,
        rp_points,              -- 초기 RP 1000점 지급
        pp_points,              -- 초기 PP 0점
        wp_points,              -- 초기 WP 0점
        total_earned_rp,        -- 초기 획득 RP 1000점 (가입 보너스)
        referral_code,          -- 고유 추천인 코드
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        1000,
        0,
        0,
        1000,
        v_referral_code,
        NOW(),
        NOW()
    );

    -- 포인트 거래 내역에 가입 보너스 기록
    INSERT INTO public.point_transactions (
        user_id,
        transaction_type,
        point_type,
        amount,
        balance_before,
        balance_after,
        description,
        status,
        created_at,
        processed_at
    ) VALUES (
        NEW.id,
        'daily_login',          -- 가입 보너스를 daily_login 타입으로 기록
        'RP',
        1000,
        0,
        1000,
        '🎉 회원가입 축하 보너스',
        'completed',
        NOW(),
        NOW()
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. auth.users 테이블에 트리거 연결
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 3. 기존 유저들에게도 user_points 생성 (이미 가입한 유저 대상)
INSERT INTO public.user_points (
    user_id,
    rp_points,
    pp_points,
    wp_points,
    total_earned_rp,
    referral_code,
    created_at,
    updated_at
)
SELECT 
    u.id,
    1000,
    0,
    0,
    1000,
    'REF' || UPPER(SUBSTRING(u.id::TEXT FROM 1 FOR 8)),
    NOW(),
    NOW()
FROM auth.users u
LEFT JOIN public.user_points up ON u.id = up.user_id
WHERE up.user_id IS NULL; -- user_points가 없는 유저만 삽입

-- 4. 기존 유저들에게도 가입 보너스 거래 내역 생성
INSERT INTO public.point_transactions (
    user_id,
    transaction_type,
    point_type,
    amount,
    balance_before,
    balance_after,
    description,
    status,
    created_at,
    processed_at
)
SELECT 
    up.user_id,
    'daily_login',
    'RP',
    1000,
    0,
    1000,
    '🎉 회원가입 축하 보너스',
    'completed',
    NOW(),
    NOW()
FROM public.user_points up
WHERE up.created_at >= NOW() - INTERVAL '1 minute'; -- 방금 생성된 유저들만

-- 확인용 쿼리
SELECT 
    u.id as user_id,
    u.email,
    up.rp_points,
    up.pp_points,
    up.wp_points,
    up.referral_code,
    up.created_at
FROM auth.users u
LEFT JOIN public.user_points up ON u.id = up.user_id
ORDER BY u.created_at DESC
LIMIT 10;

