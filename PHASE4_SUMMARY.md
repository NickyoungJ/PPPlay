# ✅ Phase 4 완료 - 관리자 시스템

## 🎉 완료된 작업

Phase 4에서 관리자 대시보드와 마켓 관리 기능을 완성했습니다!

---

## 📦 생성된 파일 목록

### **유틸리티**
- ✅ `utils/admin.ts` - 관리자 권한 확인 함수

### **API Routes**
- ✅ `app/api/admin/stats/route.ts` - 통계 조회 API
- ✅ `app/api/admin/markets/pending/route.ts` - 승인 대기 마켓 조회
- ✅ `app/api/admin/markets/approve/route.ts` - 마켓 승인
- ✅ `app/api/admin/markets/reject/route.ts` - 마켓 거부 (환불)
- ✅ `app/api/admin/markets/settle/route.ts` - 결과 확정 & 정산

### **페이지**
- ✅ `app/admin/page.tsx` - 관리자 대시보드
- ✅ `app/admin/settle/page.tsx` - 결과 확정 페이지

### **수정된 파일**
- ✅ `.env.local.example` - 관리자 이메일 환경변수 추가

---

## 🎯 구현된 기능

### **1. 관리자 대시보드** (`/admin`)

#### **통계 탭**
```
✅ 전체 마켓 통계 (총 개수, 상태별, 타입별)
✅ 사용자 통계 (총 사용자, 최근 가입)
✅ 예측 통계 (총 예측 횟수)
✅ 포인트 통계 (총 포인트, 사용 가능, 잠김)
✅ 트랜잭션 통계 (최근 7일)
```

#### **승인 대기 탭**
```
✅ 승인 대기 중인 마켓 목록
✅ 마켓 승인 (생성자에게 100P 보너스)
✅ 마켓 거부 (생성자에게 1000P 환불)
✅ 생성자 정보 표시
```

### **2. 결과 확정 페이지** (`/admin/settle`)
```
✅ 마감되었지만 결과 미확정 마켓 목록
✅ Yes/No/취소 결과 선택
✅ 결과 확정 (되돌릴 수 없음 경고)
✅ 자동 정산 (settle_market_predictions 호출)
✅ 정답자에게 자동 보상 지급
```

### **3. 관리자 권한 시스템**
```
✅ 환경변수 기반 관리자 이메일 관리
✅ requireAdmin() 미들웨어
✅ isAdmin() 권한 확인 함수
✅ 403 에러 처리
```

---

## 🔐 관리자 권한 설정

### **1. 환경변수 설정**

`.env.local` 파일에 관리자 이메일 추가:

```bash
# 관리자 이메일 (쉼표로 구분)
ADMIN_EMAILS=admin@ppplay.com,your-email@example.com,another-admin@example.com
```

### **2. 관리자 계정 로그인**

1. Google/Kakao OAuth로 로그인
2. 로그인한 이메일이 `ADMIN_EMAILS`에 포함되어 있어야 함
3. `/admin` 페이지 접속 시 자동으로 권한 확인

### **3. 권한 없을 경우**

```
- API: 403 Forbidden 에러
- 페이지: 자동으로 홈으로 리다이렉트
```

---

## 📊 API 명세

### **GET /api/admin/stats**
```typescript
// 요청: 없음 (관리자 권한 필요)

// 응답
{
  success: true,
  stats: {
    markets: {
      total: 100,
      byStatus: {
        pending: 5,
        approved: 30,
        active: 20,
        closed: 40,
        cancelled: 5
      },
      byType: {
        sports: 60,
        general: 40
      }
    },
    users: {
      total: 1234,
      recentSignups: 45
    },
    predictions: {
      total: 5678
    },
    points: {
      total: 1234567,
      available: 987654,
      locked: 246913
    },
    transactions: {
      total: 890,
      earned: 123456,
      spent: 98765
    }
  }
}
```

### **GET /api/admin/markets/pending**
```typescript
// 요청: 없음 (관리자 권한 필요)

// 응답
{
  success: true,
  markets: [
    {
      id: "uuid",
      title: "마켓 제목",
      description: "설명",
      category_slug: "economy",
      creator: {
        email: "user@example.com"
      },
      closes_at: "2025-12-31T23:59:59Z",
      created_at: "2025-10-20T12:00:00Z"
    }
  ],
  count: 5
}
```

### **POST /api/admin/markets/approve**
```typescript
// 요청
{
  market_id: "uuid"
}

// 응답
{
  success: true,
  message: "마켓이 승인되었습니다.",
  market: { /* 마켓 객체 */ }
}

// 동작:
// 1. markets.status = 'approved'
// 2. 생성자에게 100P 보너스 지급
```

### **POST /api/admin/markets/reject**
```typescript
// 요청
{
  market_id: "uuid",
  reason: "부적절한 내용"
}

// 응답
{
  success: true,
  message: "마켓이 거부되었습니다. 생성자에게 포인트가 환불되었습니다."
}

// 동작:
// 1. markets.status = 'cancelled'
// 2. markets.result_description = reason
// 3. 생성자에게 1000P 환불
```

### **POST /api/admin/markets/settle**
```typescript
// 요청
{
  market_id: "uuid",
  result: "yes" | "no" | "cancelled",
  description?: "결과 설명"
}

// 응답
{
  success: true,
  message: "마켓 결과가 확정되고 정산이 완료되었습니다.",
  market: { /* 마켓 객체 */ },
  settlement: {
    market_id: "uuid",
    settled_count: 123,
    correct_count: 78,
    total_rewards: 45678
  }
}

// 동작:
// 1. markets.result = 'yes' | 'no' | 'cancelled'
// 2. markets.is_closed = true
// 3. markets.status = 'closed'
// 4. settle_market_predictions() 함수 호출
// 5. 정답자에게 자동 보상 지급
// 6. user_points 통계 업데이트
```

---

## 🔄 데이터 흐름

### **마켓 승인 플로우**
```
사용자가 마켓 생성
    ↓
markets.status = 'pending'
    ↓
관리자 대시보드에서 확인
    ↓
[승인] 버튼 클릭
    ↓
POST /api/admin/markets/approve
    ↓
1. markets.status = 'approved'
2. point_transactions INSERT (생성자에게 +100P)
    ↓
마켓이 활성화됨 ✅
```

### **마켓 거부 플로우**
```
사용자가 마켓 생성
    ↓
markets.status = 'pending'
    ↓
관리자가 부적절하다고 판단
    ↓
[거부] 버튼 클릭 + 사유 입력
    ↓
POST /api/admin/markets/reject
    ↓
1. markets.status = 'cancelled'
2. markets.result_description = "거부 사유"
3. point_transactions INSERT (생성자에게 +1000P 환불)
    ↓
마켓 취소됨, 생성자에게 환불 완료 ❌
```

### **결과 확정 & 정산 플로우**
```
마켓 마감 시간 도래
    ↓
관리자가 /admin/settle 페이지 접속
    ↓
마감된 마켓 목록 표시
    ↓
관리자가 결과 선택 (Yes/No/취소)
    ↓
[결과 확정 및 정산] 버튼 클릭
    ↓
POST /api/admin/markets/settle
    ↓
1. markets.result = 'yes' | 'no' | 'cancelled'
2. markets.is_closed = true
3. markets.status = 'closed'
4. settle_market_predictions(market_id) 호출
    ↓
settle_market_predictions() 함수 실행:
    ↓
    1. 모든 predictions 조회
    2. 각 예측의 정답 여부 판정
    3. 보상 계산 (총 풀의 90% ÷ 정답자 수)
    4. predictions.is_correct = true/false
    5. predictions.is_settled = true
    6. predictions.points_reward = 계산된 보상
    7. user_points.locked_points 해제
    8. 정답자 통계 업데이트
    9. point_transactions INSERT (정답자에게 보상)
    ↓
정산 완료! 정답자들이 포인트 획득 🎉
```

---

## 🧪 테스트 방법

### **1. 관리자 계정 설정**

```bash
# .env.local 파일 수정
ADMIN_EMAILS=your-email@gmail.com

# 개발 서버 재시작
npm run dev
```

### **2. 관리자 로그인**

1. 브라우저: `http://localhost:3000/auth`
2. Google/Kakao 로그인 (ADMIN_EMAILS에 등록된 이메일로)
3. 로그인 성공

### **3. 관리자 대시보드 접속**

```
http://localhost:3000/admin
```

**확인 사항:**
- ✅ 통계 탭: 전체 통계 표시
- ✅ 승인 대기 탭: 승인 대기 마켓 목록

### **4. 테스트 마켓 생성 (일반 사용자)**

```sql
-- Supabase SQL Editor에서 실행

-- 테스트 사용자 생성 (이미 있다면 스킵)
SELECT initialize_user_points('test-user-id', NULL);

-- 테스트 마켓 생성
INSERT INTO markets (
    market_type, creator_id, title, description, 
    category_slug, option_yes, option_no, 
    closes_at, status
) VALUES (
    'general',
    'test-user-id',
    '테스트 마켓: 내일 비가 올까?',
    '기상청 예보를 기준으로 판단합니다.',
    'society',
    'Yes (비가 온다)',
    'No (비가 오지 않는다)',
    NOW() + INTERVAL '1 day',
    'pending'
);
```

### **5. 마켓 승인 테스트**

1. `/admin` → 승인 대기 탭
2. 생성된 마켓 확인
3. [승인] 버튼 클릭
4. 성공 메시지 확인
5. 마켓이 목록에서 사라짐

**검증:**
```sql
-- 마켓 상태 확인
SELECT id, title, status FROM markets WHERE title LIKE '%테스트 마켓%';
-- status가 'approved'여야 함

-- 생성자 포인트 확인
SELECT * FROM point_transactions 
WHERE transaction_type = 'creator_bonus' 
ORDER BY created_at DESC LIMIT 1;
-- amount가 100이어야 함
```

### **6. 결과 확정 테스트**

```sql
-- 마감 시간을 과거로 변경 (테스트용)
UPDATE markets 
SET closes_at = NOW() - INTERVAL '1 hour'
WHERE title LIKE '%테스트 마켓%';
```

1. `/admin/settle` 페이지 접속
2. 마감된 마켓 확인
3. Yes/No 선택
4. [결과 확정 및 정산] 버튼 클릭
5. 성공 메시지 확인

**검증:**
```sql
-- 마켓 결과 확인
SELECT id, title, result, is_closed, status 
FROM markets 
WHERE title LIKE '%테스트 마켓%';
-- result가 'yes' 또는 'no', is_closed가 true, status가 'closed'

-- 예측 정산 확인
SELECT * FROM predictions 
WHERE market_id = 'market-id-here';
-- is_settled가 true, is_correct가 판정됨, points_reward가 계산됨
```

---

## ⚠️ 주의사항

### **1. 관리자 이메일 관리**
```
- 환경변수로 관리하므로 보안 유지
- 프로덕션에서는 Vercel/Supabase 환경변수에 설정
- 절대 Git에 커밋하지 말 것!
```

### **2. 결과 확정 불가역성**
```
- 결과 확정 후에는 되돌릴 수 없음
- 신중하게 판단 후 실행
- 잘못 확정한 경우 데이터베이스에서 수동 수정 필요
```

### **3. 정산 실패 시**
```
- settle_market_predictions() 함수 오류 확인
- Supabase SQL Editor에서 직접 호출 가능:
  SELECT settle_market_predictions('market-id-here');
```

---

## 🎨 UI 미리보기

### **관리자 대시보드**
```
┌─────────────────────────────────────────┐
│  관리자 대시보드 ⚙️                      │
│  마켓 관리 및 통계 확인                  │
└─────────────────────────────────────────┘

[통계] [승인 대기 (5)] [결과 확정]

┌──────────┐ ┌──────────┐ ┌──────────┐
│  마켓    │ │  사용자  │ │  예측    │
│  📋 100  │ │  👥 1234 │ │  ✅ 5678 │
│          │ │          │ │          │
│ 대기: 5  │ │ 신규: 45 │ │          │
│ 활성: 50 │ │          │ │          │
└──────────┘ └──────────┘ └──────────┘
```

### **승인 대기 탭**
```
┌─────────────────────────────────────────┐
│ 💰 economy  •  2025-10-20              │
│                                         │
│ 비트코인이 연말까지 $100,000 돌파?     │
│ 현재 약 $60,000입니다...               │
│                                         │
│ 생성자: user@example.com               │
│ 마감: 2025-12-31                       │
│                                         │
│  [✅ 승인]      [❌ 거부]              │
└─────────────────────────────────────────┘
```

---

## 🚀 다음 단계

Phase 4 완료! 이제 다음 중 선택하세요:

### **Option 1: Phase 5 (게이미피케이션)**
```
- 출석 체크 UI
- 광고 시청 보상
- 리더보드 페이지
- 리워드 상점
```

### **Option 2: Phase 2 (스포츠 마켓 자동화)**
```
- Edge Function: 경기 → 마켓 자동 생성
- 경기 결과 → 자동 정산
- 스포츠 탭 통합
```

### **Option 3: 추가 개선**
```
- 마켓 수정 기능
- 댓글/토론 시스템
- 알림 시스템
- 관리자 로그
```

**Phase 4 완료! 🎊**

