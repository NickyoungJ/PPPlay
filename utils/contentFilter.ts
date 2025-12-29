// 콘텐츠 필터링 유틸리티

// 금지어 목록 (욕설, 비속어, 혐오 표현)
const BANNED_WORDS = [
  // 욕설
  '시발', '씨발', '시bal', '씨bal', 'ㅅㅂ', 'ㅆㅂ', 'ㅅ1ㅂ', '씹', 'ㅆ', 
  '병신', 'ㅂㅅ', 'ㅄ', '븅신', '빙신',
  '개새끼', '개새', '개색끼', '개색', '개쉐이', '개쉑',
  '좆', 'ㅈㄴ', '존나', '졸라', '존내',
  '미친놈', '미친년', '미친새끼', '미놈', '미년',
  '꺼져', '닥쳐', '뒤져', '뒈져', '디져',
  '지랄', 'ㅈㄹ', '지럴',
  '썅', 'ㅆㅇ',
  '애미', '애비', '느금마', '느금',
  '한남', '한녀', '김치녀', '김치남',
  
  // 성적 표현
  '보지', '자지', '섹스', 'sex', '야동', '포르노',
  
  // 혐오 표현  
  '장애인', '병신새끼', '정신병자',
  
  // 사기/도박 관련
  '토토', '배팅사이트', '카지노', '슬롯',
];

// 우회 문자 변환 맵
const CHAR_MAP: { [key: string]: string } = {
  '0': 'o', 'ㅇ': 'o',
  '1': 'i', 'l': 'i', 'ㅣ': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '@': 'a',
  '$': 's',
  '!': 'i',
  '*': '',
  '.': '',
  '_': '',
  '-': '',
  ' ': '',
};

/**
 * 텍스트 정규화 (우회 문자 변환)
 */
function normalizeText(text: string): string {
  let normalized = text.toLowerCase();
  
  // 우회 문자 변환
  for (const [from, to] of Object.entries(CHAR_MAP)) {
    normalized = normalized.split(from).join(to);
  }
  
  // 연속 문자 축소 (ㅋㅋㅋㅋㅋ -> ㅋㅋ)
  normalized = normalized.replace(/(.)\1{2,}/g, '$1$1');
  
  return normalized;
}

/**
 * 금지어 포함 여부 체크
 */
export function containsBannedWord(text: string): { found: boolean; word?: string } {
  const normalized = normalizeText(text);
  
  for (const word of BANNED_WORDS) {
    const normalizedWord = normalizeText(word);
    if (normalized.includes(normalizedWord)) {
      return { found: true, word };
    }
  }
  
  return { found: false };
}

/**
 * 과도한 반복 문자 체크 (도배 방지)
 */
export function hasExcessiveRepetition(text: string): boolean {
  // 같은 문자가 10번 이상 연속
  if (/(.)\1{9,}/.test(text)) {
    return true;
  }
  
  // 같은 이모지가 5번 이상 연속
  const emojiPattern = /(\p{Emoji})\1{4,}/gu;
  if (emojiPattern.test(text)) {
    return true;
  }
  
  return false;
}

/**
 * 콘텐츠 검증 (종합)
 */
export function validateContent(text: string): { 
  valid: boolean; 
  error?: string;
} {
  // 빈 텍스트 체크
  if (!text || !text.trim()) {
    return { valid: false, error: '내용을 입력해주세요.' };
  }
  
  // 최소 길이 체크
  if (text.trim().length < 2) {
    return { valid: false, error: '2자 이상 입력해주세요.' };
  }
  
  // 금지어 체크
  const bannedCheck = containsBannedWord(text);
  if (bannedCheck.found) {
    return { valid: false, error: '부적절한 표현이 포함되어 있습니다.' };
  }
  
  // 과도한 반복 체크
  if (hasExcessiveRepetition(text)) {
    return { valid: false, error: '과도한 반복 문자는 사용할 수 없습니다.' };
  }
  
  return { valid: true };
}

