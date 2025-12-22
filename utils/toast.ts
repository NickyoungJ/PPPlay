import toast from 'react-hot-toast';

// 성공 토스트
export const showSuccess = (message: string) => {
  toast.success(message, {
    icon: '✅',
  });
};

// 에러 토스트
export const showError = (message: string) => {
  toast.error(message, {
    icon: '❌',
  });
};

// 포인트 획득 토스트
export const showPointsEarned = (points: number, reason?: string) => {
  toast.success(
    reason 
      ? `${reason}\n+${points.toLocaleString()}P 획득! 🎉`
      : `+${points.toLocaleString()}P 획득! 🎉`,
    {
      icon: '💰',
      duration: 4000,
    }
  );
};

// 포인트 사용 토스트
export const showPointsSpent = (points: number, reason?: string) => {
  toast(
    reason 
      ? `${reason}\n-${points.toLocaleString()}P 사용`
      : `-${points.toLocaleString()}P 사용`,
    {
      icon: '💸',
      duration: 3000,
    }
  );
};

// 투표 완료 토스트
export const showVoteSuccess = (option: 'YES' | 'NO') => {
  toast.success(`${option}에 투표 완료!\n+5P 적립 🗳️`, {
    icon: option === 'YES' ? '👍' : '👎',
    duration: 3000,
  });
};

// 출석 체크 토스트
export const showAttendanceSuccess = (points: number, consecutiveDays: number) => {
  const bonusMessage = consecutiveDays >= 7 
    ? `🔥 ${consecutiveDays}일 연속 출석!` 
    : consecutiveDays >= 3 
      ? `✨ ${consecutiveDays}일 연속 출석!`
      : '';
  
  toast.success(
    `출석 체크 완료!\n+${points.toLocaleString()}P ${bonusMessage}`,
    {
      icon: '📅',
      duration: 4000,
    }
  );
};

// 마켓 생성 토스트
export const showMarketCreated = () => {
  toast.success('마켓이 생성되었습니다!\n관리자 승인 후 공개됩니다.', {
    icon: '📝',
    duration: 4000,
  });
};

// 로딩 토스트 (Promise 기반)
export const showLoading = (promise: Promise<unknown>, messages: {
  loading: string;
  success: string;
  error: string;
}) => {
  return toast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error,
  });
};

// 정보 토스트
export const showInfo = (message: string) => {
  toast(message, {
    icon: 'ℹ️',
    duration: 3000,
  });
};

// 경고 토스트
export const showWarning = (message: string) => {
  toast(message, {
    icon: '⚠️',
    duration: 4000,
    style: {
      border: '1px solid rgba(245, 158, 11, 0.5)',
    },
  });
};

// 커스텀 토스트 (아이콘 지정)
export const showCustom = (message: string, icon: string) => {
  toast(message, {
    icon,
    duration: 3000,
  });
};

