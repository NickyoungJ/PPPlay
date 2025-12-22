// 알림 생성 유틸리티 함수
import { createClient } from '@/utils/supabase/server';

export type NotificationType = 
  | 'market_result'
  | 'points_earned'
  | 'points_spent'
  | 'market_approved'
  | 'market_rejected'
  | 'attendance_bonus'
  | 'streak_bonus'
  | 'system';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message?: string;
  data?: Record<string, unknown>;
}

// 서버 사이드에서 알림 생성
export async function createNotification({
  userId,
  type,
  title,
  message,
  data = {},
}: CreateNotificationParams): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        data,
      });

    if (error) {
      console.error('알림 생성 오류:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('알림 생성 예외:', error);
    return { success: false, error: '알림 생성 중 오류가 발생했습니다.' };
  }
}

// 여러 사용자에게 알림 생성 (배치)
export async function createNotificationsBatch(
  notifications: CreateNotificationParams[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const insertData = notifications.map(n => ({
      user_id: n.userId,
      type: n.type,
      title: n.title,
      message: n.message,
      data: n.data || {},
    }));

    const { error } = await supabase
      .from('notifications')
      .insert(insertData);

    if (error) {
      console.error('배치 알림 생성 오류:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('배치 알림 생성 예외:', error);
    return { success: false, error: '알림 생성 중 오류가 발생했습니다.' };
  }
}

// 마켓 결과 알림 생성 헬퍼
export async function notifyMarketResult(
  userId: string,
  marketTitle: string,
  isCorrect: boolean,
  pointsEarned?: number
) {
  return createNotification({
    userId,
    type: 'market_result',
    title: isCorrect ? '🎉 예측 적중!' : '😢 아쉽게 빗나갔어요',
    message: isCorrect
      ? `[${marketTitle}] 예측에 성공했습니다!${pointsEarned ? ` +${pointsEarned}P 획득` : ''}`
      : `[${marketTitle}] 다음 기회에 도전해보세요!`,
    data: { marketTitle, isCorrect, pointsEarned },
  });
}

// 마켓 승인 알림
export async function notifyMarketApproved(
  userId: string,
  marketTitle: string,
  marketId: string
) {
  return createNotification({
    userId,
    type: 'market_approved',
    title: '✅ 마켓이 승인되었습니다!',
    message: `[${marketTitle}] 마켓이 승인되어 공개되었습니다.`,
    data: { marketId, marketTitle },
  });
}

// 마켓 거절 알림
export async function notifyMarketRejected(
  userId: string,
  marketTitle: string,
  marketId: string,
  refundAmount: number
) {
  return createNotification({
    userId,
    type: 'market_rejected',
    title: '❌ 마켓이 거절되었습니다',
    message: `[${marketTitle}] 마켓이 거절되어 ${refundAmount.toLocaleString()}P가 환불되었습니다.`,
    data: { marketId, marketTitle, refundAmount },
  });
}

// 출석 보너스 알림
export async function notifyAttendanceBonus(
  userId: string,
  points: number,
  consecutiveDays: number
) {
  const isStreakBonus = consecutiveDays === 3 || consecutiveDays === 7;
  
  return createNotification({
    userId,
    type: isStreakBonus ? 'streak_bonus' : 'attendance_bonus',
    title: isStreakBonus 
      ? `🔥 ${consecutiveDays}일 연속 출석 보너스!`
      : '📅 출석 체크 완료!',
    message: `+${points.toLocaleString()}P 적립되었습니다.`,
    data: { points, consecutiveDays },
  });
}

// 포인트 획득 알림
export async function notifyPointsEarned(
  userId: string,
  points: number,
  reason: string
) {
  return createNotification({
    userId,
    type: 'points_earned',
    title: '💰 포인트 획득!',
    message: `${reason}으로 +${points.toLocaleString()}P 적립되었습니다.`,
    data: { points, reason },
  });
}

// 포인트 사용 알림
export async function notifyPointsSpent(
  userId: string,
  points: number,
  reason: string
) {
  return createNotification({
    userId,
    type: 'points_spent',
    title: '💸 포인트 사용',
    message: `${reason}으로 ${points.toLocaleString()}P가 사용되었습니다.`,
    data: { points, reason },
  });
}

