-- =====================================================
-- 마켓 생성 포인트 차감/환불 시스템
-- =====================================================

-- 1. 마켓 생성 시 포인트 차감 함수
CREATE OR REPLACE FUNCTION deduct_points_for_market_creation(
  p_user_id UUID,
  p_market_id UUID,
  p_amount INTEGER DEFAULT 1000
) RETURNS JSONB AS $$
DECLARE
  v_current_points INTEGER;
BEGIN
  -- 1. 현재 포인트 조회 및 잠금 (동시성 문제 방지)
  SELECT total_points INTO v_current_points
  FROM user_points
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- 2. 사용자 포인트 레코드가 없는 경우
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', '포인트 정보를 찾을 수 없습니다.'
    );
  END IF;

  -- 3. 포인트 부족 체크
  IF v_current_points < p_amount THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', '포인트가 부족합니다.',
      'required', p_amount,
      'available', v_current_points
    );
  END IF;

  -- 4. 포인트 차감
  UPDATE user_points
  SET 
    total_points = total_points - p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- 5. 트랜잭션 기록
  INSERT INTO point_transactions (
    user_id, 
    transaction_type, 
    amount, 
    market_id,
    description,
    status
  ) VALUES (
    p_user_id,
    'market_creation',
    -p_amount,
    p_market_id,
    '마켓 개설 비용',
    'completed'
  );

  RETURN jsonb_build_object(
    'success', true,
    'deducted', p_amount,
    'remaining', v_current_points - p_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 마켓 거절 시 포인트 환불 함수
CREATE OR REPLACE FUNCTION refund_market_creation(
  p_user_id UUID,
  p_market_id UUID,
  p_amount INTEGER DEFAULT 1000
) RETURNS JSONB AS $$
BEGIN
  -- 1. 포인트 환불
  UPDATE user_points
  SET 
    total_points = total_points + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- 사용자가 없는 경우
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', '사용자를 찾을 수 없습니다.'
    );
  END IF;

  -- 2. 환불 트랜잭션 기록
  INSERT INTO point_transactions (
    user_id, 
    transaction_type, 
    amount, 
    market_id,
    description,
    status
  ) VALUES (
    p_user_id,
    'market_creation_refund',
    p_amount,
    p_market_id,
    '마켓 거절로 인한 환불',
    'completed'
  );

  RETURN jsonb_build_object(
    'success', true,
    'refunded', p_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION deduct_points_for_market_creation(UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION refund_market_creation(UUID, UUID, INTEGER) TO authenticated;

-- =====================================================
-- 확인용 쿼리 (실행 후 확인)
-- =====================================================
-- SELECT proname, prosrc 
-- FROM pg_proc 
-- WHERE proname IN ('deduct_points_for_market_creation', 'refund_market_creation');

