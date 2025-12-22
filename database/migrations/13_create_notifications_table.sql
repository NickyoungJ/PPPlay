-- =====================================================
-- 알림 시스템 테이블 및 함수 생성
-- =====================================================

-- 1. 알림 테이블 생성
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,  -- 알림 유형
    title VARCHAR(200) NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}',  -- 추가 데이터 (마켓 ID, 포인트 등)
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- 알림 유형:
-- 'market_result' - 마켓 결과 확정 (적중/미적중)
-- 'points_earned' - 포인트 획득
-- 'points_spent' - 포인트 사용
-- 'market_approved' - 마켓 승인됨
-- 'market_rejected' - 마켓 거절됨
-- 'attendance_bonus' - 출석 보너스
-- 'streak_bonus' - 연속 출석 보너스
-- 'system' - 시스템 공지

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- 3. RLS 정책 설정
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 알림만 조회 가능
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 알림만 수정 가능 (읽음 처리)
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- 사용자는 자신의 알림만 삭제 가능
CREATE POLICY "Users can delete own notifications" ON notifications
    FOR DELETE USING (auth.uid() = user_id);

-- 서비스 역할은 모든 알림 생성 가능
CREATE POLICY "Service can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- 4. 알림 생성 함수
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type VARCHAR(50),
    p_title VARCHAR(200),
    p_message TEXT DEFAULT NULL,
    p_data JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (p_user_id, p_type, p_title, p_message, p_data)
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 읽지 않은 알림 개수 조회 함수
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM notifications
    WHERE user_id = p_user_id AND is_read = FALSE;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 모든 알림 읽음 처리 함수
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_updated INTEGER;
BEGIN
    UPDATE notifications
    SET is_read = TRUE, read_at = NOW()
    WHERE user_id = p_user_id AND is_read = FALSE;
    
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN v_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 오래된 알림 자동 삭제 함수 (30일 이상)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM notifications
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION create_notification(UUID, VARCHAR, VARCHAR, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read(UUID) TO authenticated;

-- 9. 마켓 정산 시 알림 생성 트리거 함수
CREATE OR REPLACE FUNCTION notify_market_settlement()
RETURNS TRIGGER AS $$
BEGIN
    -- 마켓이 정산 완료 상태로 변경되었을 때
    IF NEW.status = 'settled' AND OLD.status != 'settled' THEN
        -- 해당 마켓에 참여한 모든 사용자에게 알림 생성
        INSERT INTO notifications (user_id, type, title, message, data)
        SELECT 
            p.user_id,
            'market_result',
            CASE 
                WHEN p.selected_option = NEW.result THEN '🎉 예측 적중!'
                ELSE '😢 아쉽게 빗나갔어요'
            END,
            CASE 
                WHEN p.selected_option = NEW.result THEN 
                    '[' || NEW.title || '] 예측에 성공했습니다!'
                ELSE 
                    '[' || NEW.title || '] 다음 기회에 도전해보세요!'
            END,
            jsonb_build_object(
                'market_id', NEW.id,
                'market_title', NEW.title,
                'selected_option', p.selected_option,
                'result', NEW.result,
                'is_correct', p.selected_option = NEW.result
            )
        FROM predictions p
        WHERE p.market_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. 마켓 정산 트리거 생성 (이미 존재하면 교체)
DROP TRIGGER IF EXISTS trigger_notify_market_settlement ON markets;
CREATE TRIGGER trigger_notify_market_settlement
    AFTER UPDATE ON markets
    FOR EACH ROW
    EXECUTE FUNCTION notify_market_settlement();

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '알림 시스템 테이블 및 함수가 성공적으로 생성되었습니다.';
END $$;

