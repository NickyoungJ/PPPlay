// Rate Limiting 유틸리티 (메모리 기반)

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// 메모리 저장소 (서버리스 환경에서는 요청 간 공유 안됨 - 기본 보호용)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate Limit 설정
export const RATE_LIMITS = {
  comment: {
    windowMs: 10 * 1000,  // 10초
    maxRequests: 1,       // 10초에 1개
    message: '댓글은 10초에 한 번만 작성할 수 있습니다.',
  },
  marketCreate: {
    windowMs: 60 * 60 * 1000,  // 1시간
    maxRequests: 3,            // 1시간에 3개
    message: '마켓은 1시간에 3개까지만 생성할 수 있습니다.',
  },
  vote: {
    windowMs: 24 * 60 * 60 * 1000,  // 24시간
    maxRequests: 10,                 // 하루 10회
    message: '투표는 하루에 10회까지만 가능합니다.',
  },
} as const;

type RateLimitType = keyof typeof RATE_LIMITS;

/**
 * Rate Limit 체크
 * @param userId 사용자 ID
 * @param type 제한 타입
 * @returns { allowed: boolean, error?: string, remaining?: number }
 */
export function checkRateLimit(
  userId: string, 
  type: RateLimitType
): { allowed: boolean; error?: string; remaining?: number; resetIn?: number } {
  const config = RATE_LIMITS[type];
  const key = `${type}:${userId}`;
  const now = Date.now();
  
  // 기존 엔트리 조회
  let entry = rateLimitStore.get(key);
  
  // 엔트리가 없거나 만료된 경우
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
  }
  
  // 제한 초과 체크
  if (entry.count >= config.maxRequests) {
    const resetIn = Math.ceil((entry.resetTime - now) / 1000);
    return {
      allowed: false,
      error: config.message,
      remaining: 0,
      resetIn,
    };
  }
  
  // 카운트 증가 및 저장
  entry.count += 1;
  rateLimitStore.set(key, entry);
  
  // 오래된 엔트리 정리 (메모리 관리)
  cleanupExpiredEntries();
  
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
  };
}

/**
 * Rate Limit 리셋 (테스트용)
 */
export function resetRateLimit(userId: string, type: RateLimitType): void {
  const key = `${type}:${userId}`;
  rateLimitStore.delete(key);
}

/**
 * 만료된 엔트리 정리
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  
  // 100개 이상일 때만 정리 (성능 최적화)
  if (rateLimitStore.size < 100) return;
  
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * 남은 시간 포맷팅
 */
export function formatResetTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}초`;
  }
  if (seconds < 3600) {
    return `${Math.ceil(seconds / 60)}분`;
  }
  return `${Math.ceil(seconds / 3600)}시간`;
}

