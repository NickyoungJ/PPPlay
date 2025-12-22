import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { notifyAttendanceBonus } from '@/utils/notifications';

const DAILY_ATTENDANCE_POINTS = 100; // 일일 출석 포인트

// 출석 체크 상태 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // 오늘 출석 여부 확인
    const today = new Date().toISOString().split('T')[0];
    
    const { data: attendance, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    // 연속 출석 일수 조회
    const { data: userPoints } = await supabase
      .from('user_points')
      .select('consecutive_login_days, total_login_days')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({
      success: true,
      checkedIn: !!attendance,
      consecutiveDays: userPoints?.consecutive_login_days || 0,
      totalDays: userPoints?.total_login_days || 0,
      todayPoints: attendance?.points_earned || 0,
    });
  } catch (error) {
    console.error('출석 상태 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 출석 체크 실행
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const today = new Date().toISOString().split('T')[0];
    
    // 오늘 이미 출석했는지 확인
    const { data: existingAttendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    if (existingAttendance) {
      return NextResponse.json(
        { error: '오늘은 이미 출석 체크를 완료했습니다.' },
        { status: 400 }
      );
    }

    // 어제 출석 여부 확인 (연속 출석 계산용)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const { data: yesterdayAttendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', yesterdayStr)
      .single();

    // 현재 user_points 조회
    const { data: userPoints } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // 연속 출석 일수 계산
    let consecutiveDays = 1;
    if (yesterdayAttendance && userPoints) {
      consecutiveDays = (userPoints.consecutive_login_days || 0) + 1;
    }

    // 보너스 포인트 계산 (7일 연속 시 추가 보너스)
    let bonusPoints = 0;
    if (consecutiveDays % 7 === 0) {
      bonusPoints = 500; // 7일 연속 보너스
    } else if (consecutiveDays % 3 === 0) {
      bonusPoints = 50; // 3일 연속 보너스
    }

    const totalPoints = DAILY_ATTENDANCE_POINTS + bonusPoints;

    // 출석 기록 저장
    const { error: attendanceError } = await supabase
      .from('attendance')
      .insert({
        user_id: user.id,
        date: today,
        points_earned: totalPoints,
        consecutive_days: consecutiveDays,
      });

    if (attendanceError) {
      console.error('출석 기록 오류:', attendanceError);
      return NextResponse.json(
        { error: '출석 기록에 실패했습니다.' },
        { status: 500 }
      );
    }

    // user_points 업데이트
    const { error: updateError } = await supabase
      .from('user_points')
      .update({
        total_points: (userPoints?.total_points || 0) + totalPoints,
        consecutive_login_days: consecutiveDays,
        total_login_days: (userPoints?.total_login_days || 0) + 1,
        last_login_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('포인트 업데이트 오류:', updateError);
    }

    // 포인트 트랜잭션 기록
    await supabase
      .from('point_transactions')
      .insert({
        user_id: user.id,
        transaction_type: 'daily_login',
        point_type: 'RP',
        amount: totalPoints,
        balance_before: userPoints?.total_points || 0,
        balance_after: (userPoints?.total_points || 0) + totalPoints,
        description: bonusPoints > 0 
          ? `출석 체크 (${consecutiveDays}일 연속 보너스 +${bonusPoints}P)`
          : '일일 출석 체크',
        status: 'completed',
      });

    // 🔔 알림 생성
    try {
      await notifyAttendanceBonus(user.id, totalPoints, consecutiveDays);
    } catch (notifyError) {
      console.error('출석 알림 생성 오류:', notifyError);
    }

    return NextResponse.json({
      success: true,
      message: bonusPoints > 0 
        ? `출석 체크 완료! ${DAILY_ATTENDANCE_POINTS}P + 연속 보너스 ${bonusPoints}P 획득!`
        : `출석 체크 완료! ${DAILY_ATTENDANCE_POINTS}P 획득!`,
      pointsEarned: totalPoints,
      basePoints: DAILY_ATTENDANCE_POINTS,
      bonusPoints,
      consecutiveDays,
      totalDays: (userPoints?.total_login_days || 0) + 1,
    });
  } catch (error) {
    console.error('출석 체크 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

