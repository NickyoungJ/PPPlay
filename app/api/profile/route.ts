import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { validateContent } from '@/utils/contentFilter';

// 마이페이지 데이터 조회 API
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // ✅ 인증 복구: 실제 사용자 확인
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

    // 1. 포인트 정보 조회 (닉네임 포함)
    const { data: userPoints, error: pointsError } = await supabase
      .from('user_points')
      .select('total_points, available_points, daily_votes, total_predictions, correct_predictions, win_rate, nickname')
      .eq('user_id', user.id)
      .single();

    if (pointsError) {
      console.error('포인트 조회 오류:', pointsError);
      // 신규 사용자일 경우 user_points 레코드가 없을 수 있음
      // 기본값으로 응답
      return NextResponse.json({
        success: true,
        profile: {
          points: {
            total: 100, // 신규 가입 보너스
            available: 100,
            daily_votes: 0,
            daily_limit: 10,
          },
          stats: {
            total_votes: 0,
            correct_votes: 0,
            win_rate: 0,
          },
          recent_predictions: [],
        },
      });
    }

    // 2. 최근 투표 내역 조회 (최근 50개로 확대)
    const { data: recentPredictions, error: predictionsError } = await supabase
      .from('predictions')
      .select(`
        id,
        predicted_option,
        participation_reward,
        accuracy_reward,
        created_at,
        markets (
          id,
          title,
          result,
          is_closed,
          option_yes,
          option_no
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (predictionsError) {
      console.error('투표 내역 조회 오류:', predictionsError);
    }

    // 3. 포인트 트랜잭션 히스토리 조회 (최근 50개로 확대)
    const { data: pointHistory, error: historyError } = await supabase
      .from('point_transactions')
      .select(`
        id,
        transaction_type,
        amount,
        balance_after,
        description,
        created_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (historyError) {
      console.error('포인트 히스토리 조회 오류:', historyError);
    }

    return NextResponse.json({
      success: true,
      profile: {
        // 사용자 정보
        nickname: userPoints?.nickname || null,
        email: user.email,
        // 포인트 현황
        points: {
          total: userPoints?.total_points || 0,
          available: userPoints?.available_points || 0,
          daily_votes: userPoints?.daily_votes || 0,
          daily_limit: 10,
        },
        // 투표 통계
        stats: {
          total_votes: userPoints?.total_predictions || 0,
          correct_votes: userPoints?.correct_predictions || 0,
          win_rate: userPoints?.win_rate || 0,
        },
        // 최근 투표 내역
        recent_predictions: recentPredictions || [],
        // 포인트 히스토리
        point_history: pointHistory || [],
      },
    });
  } catch (error) {
    console.error('프로필 조회 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 닉네임 수정 API
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 인증 확인
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

    const body = await request.json();
    const { nickname } = body;

    // 닉네임 유효성 검사
    if (nickname !== null && nickname !== undefined) {
      // 빈 문자열은 null로 처리 (닉네임 삭제)
      const trimmedNickname = nickname?.trim() || null;
      
      if (trimmedNickname) {
        // 길이 검사 (2-12자)
        if (trimmedNickname.length < 2 || trimmedNickname.length > 12) {
          return NextResponse.json(
            { error: '닉네임은 2-12자 사이여야 합니다.' },
            { status: 400 }
          );
        }

        // 허용 문자 검사 (한글, 영문, 숫자, 언더스코어)
        const nicknameRegex = /^[가-힣a-zA-Z0-9_]+$/;
        if (!nicknameRegex.test(trimmedNickname)) {
          return NextResponse.json(
            { error: '닉네임은 한글, 영문, 숫자, 언더스코어만 사용 가능합니다.' },
            { status: 400 }
          );
        }

        // 금지어 검사
        const forbiddenWords = ['admin', '관리자', '운영자', '시스템', 'system', 'ppplay'];
        if (forbiddenWords.some(word => trimmedNickname.toLowerCase().includes(word))) {
          return NextResponse.json(
            { error: '사용할 수 없는 닉네임입니다.' },
            { status: 400 }
          );
        }

        // 욕설/비속어 검사
        const contentValidation = validateContent(trimmedNickname);
        if (!contentValidation.valid) {
          return NextResponse.json(
            { error: '부적절한 닉네임입니다.' },
            { status: 400 }
          );
        }

        // 중복 검사
        const { data: existingUser } = await supabase
          .from('user_points')
          .select('user_id')
          .eq('nickname', trimmedNickname)
          .neq('user_id', user.id)
          .single();

        if (existingUser) {
          return NextResponse.json(
            { error: '이미 사용 중인 닉네임입니다.' },
            { status: 400 }
          );
        }
      }

      // 닉네임 업데이트
      const { error: updateError } = await supabase
        .from('user_points')
        .update({ nickname: trimmedNickname })
        .eq('user_id', user.id);

      if (updateError) {
        // user_points 레코드가 없으면 생성
        const { error: insertError } = await supabase
          .from('user_points')
          .insert({ user_id: user.id, nickname: trimmedNickname });

        if (insertError) {
          console.error('닉네임 저장 오류:', insertError);
          return NextResponse.json(
            { error: '닉네임 저장에 실패했습니다.' },
            { status: 500 }
          );
        }
      }

      return NextResponse.json({
        success: true,
        nickname: trimmedNickname,
        message: trimmedNickname ? '닉네임이 설정되었습니다.' : '닉네임이 삭제되었습니다.'
      });
    }

    return NextResponse.json(
      { error: '수정할 정보가 없습니다.' },
      { status: 400 }
    );

  } catch (error) {
    console.error('프로필 수정 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
