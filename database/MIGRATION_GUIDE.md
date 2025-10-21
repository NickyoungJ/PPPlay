# 🚀 Phase 1 마이그레이션 가이드

## 📋 체크리스트

Phase 1 데이터베이스 마이그레이션을 위한 단계별 가이드입니다.

---

## ✅ 사전 준비

- [ ] Supabase 대시보드 접속 확인
- [ ] SQL Editor 접근 권한 확인
- [ ] 기존 데이터 백업 완료 (중요!)
- [ ] 개발 환경에서 먼저 테스트 권장

---

## 📝 마이그레이션 단계

### **1단계: 카테고리 테이블 생성**
```bash
파일: 01_create_market_categories_table.sql
```

**실행 내용:**
- `market_categories` 테이블 생성
- 초기 카테고리 데이터 삽입 (전체/스포츠/정치/경제/연예/사회/IT)

**검증:**
```sql
SELECT * FROM market_categories ORDER BY display_order;
-- 7개의 카테고리가 표시되어야 함
```

**상태:** ⬜ 대기중 → 🟦 진행중 → ✅ 완료

---

### **2단계: 마켓 테이블 생성**
```bash
파일: 02_create_markets_table.sql
```

**실행 내용:**
- `markets` 테이블 생성 (통합 마켓)
- 인덱스 생성
- 자동 마감 함수 생성

**검증:**
```sql
-- 테이블 구조 확인
\d markets

-- 인덱스 확인
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'markets';
```

**상태:** ⬜ 대기중 → 🟦 진행중 → ✅ 완료

---

### **3단계: 사용자 포인트 테이블 생성**
```bash
파일: 03_create_user_points_table.sql
```

**실행 내용:**
- `user_points` 테이블 생성
- 자동 계산 트리거 생성 (승률, 레벨업, 티어, 추천코드)
- 인덱스 생성

**검증:**
```sql
-- 테이블 확인
\d user_points

-- 트리거 확인
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'user_points';
```

**상태:** ⬜ 대기중 → 🟦 진행중 → ✅ 완료

---

### **4단계: 포인트 트랜잭션 테이블 생성**
```bash
파일: 04_create_point_transactions_table.sql
```

**실행 내용:**
- `point_transactions` 테이블 생성
- 자동 포인트 처리 트리거 생성
- 일일 출석 함수 생성
- 인덱스 생성

**검증:**
```sql
-- 테이블 확인
\d point_transactions

-- 함수 확인
\df check_daily_login
```

**상태:** ⬜ 대기중 → 🟦 진행중 → ✅ 완료

---

### **5단계: 예측 테이블 수정**
```bash
파일: 05_modify_predictions_table.sql
```

**⚠️ 주의: 기존 predictions 테이블을 삭제하고 재생성합니다!**

**실행 내용:**
- 기존 `predictions` 테이블 삭제 (DROP)
- 새로운 구조로 재생성 (market_id 기반)
- 예측 정산 함수 생성
- 인덱스 생성

**검증:**
```sql
-- 테이블 구조 확인
\d predictions

-- 정산 함수 확인
\df settle_prediction
\df settle_market_predictions
```

**상태:** ⬜ 대기중 → 🟦 진행중 → ✅ 완료

---

### **6단계: 헬퍼 함수 생성**
```bash
파일: 06_create_helper_functions.sql
```

**실행 내용:**
- 사용자 초기화 함수
- 마켓 조회 함수
- 사용자 예측 조회 함수
- 리더보드 함수
- 통계 조회 함수
- 광고 보상 함수

**검증:**
```sql
-- 생성된 함수 목록 확인
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'initialize_user_points',
    'get_active_markets',
    'get_user_predictions',
    'get_leaderboard',
    'get_market_statistics',
    'get_user_statistics',
    'reward_ad_view'
  );
```

**상태:** ⬜ 대기중 → 🟦 진행중 → ✅ 완료

---

## 🧪 테스트

### **기본 기능 테스트**

```sql
-- 1. 카테고리 조회
SELECT * FROM market_categories WHERE is_active = true;

-- 2. 테스트 사용자 생성
SELECT initialize_user_points('00000000-0000-0000-0000-000000000001', NULL);

-- 3. 사용자 포인트 확인
SELECT * FROM user_points WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- 4. 출석 체크 테스트
SELECT check_daily_login('00000000-0000-0000-0000-000000000001');

-- 5. 포인트 트랜잭션 확인
SELECT * FROM point_transactions 
WHERE user_id = '00000000-0000-0000-0000-000000000001'
ORDER BY created_at DESC;

-- 6. 테스트 마켓 생성
INSERT INTO markets (
    market_type, title, description, category_slug,
    option_yes, option_no, closes_at, status
) VALUES (
    'general',
    '테스트 마켓: AI가 2025년 노벨상을 받을까?',
    '2025년 노벨상 수상자 중 AI 연구자가 포함될 것인가?',
    'tech',
    'Yes',
    'No',
    '2025-12-31 23:59:59+09',
    'approved'
) RETURNING id;

-- 7. 마켓 조회 테스트
SELECT * FROM get_active_markets('tech', 10, 0);

-- 8. 예측 생성 테스트
INSERT INTO predictions (
    user_id, market_id, predicted_option, points_spent
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    (SELECT id FROM markets WHERE title LIKE '%AI가 2025년%'),
    'yes',
    50
) RETURNING *;

-- 9. 사용자 통계 확인
SELECT get_user_statistics('00000000-0000-0000-0000-000000000001');

-- 10. 리더보드 테스트
SELECT * FROM get_leaderboard('points', 10);
```

---

## 🔒 RLS (Row Level Security) 설정

마이그레이션 완료 후 반드시 RLS 정책을 설정하세요.

### **markets 테이블**
```sql
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;

-- 활성 마켓은 누구나 조회 가능
CREATE POLICY "Anyone can view active markets" ON markets
    FOR SELECT 
    USING (status IN ('approved', 'active') AND is_closed = false);

-- 인증된 사용자는 일반 마켓 생성 가능
CREATE POLICY "Authenticated users can create general markets" ON markets
    FOR INSERT 
    WITH CHECK (
        auth.uid() = creator_id 
        AND market_type = 'general'
    );

-- 본인이 만든 마켓만 수정 가능
CREATE POLICY "Users can update own markets" ON markets
    FOR UPDATE 
    USING (auth.uid() = creator_id);
```

### **predictions 테이블**
```sql
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- 본인 예측만 조회
CREATE POLICY "Users can view own predictions" ON predictions
    FOR SELECT 
    USING (auth.uid() = user_id);

-- 본인 예측만 생성
CREATE POLICY "Users can create own predictions" ON predictions
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
```

### **user_points 테이블**
```sql
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;

-- 본인 포인트만 조회
CREATE POLICY "Users can view own points" ON user_points
    FOR SELECT 
    USING (auth.uid() = user_id);
```

### **point_transactions 테이블**
```sql
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

-- 본인 트랜잭션만 조회
CREATE POLICY "Users can view own transactions" ON point_transactions
    FOR SELECT 
    USING (auth.uid() = user_id);
```

---

## 🐛 문제 해결

### **오류 1: "relation does not exist"**
**원인:** 참조하는 테이블이 아직 생성되지 않음  
**해결:** 마이그레이션 순서를 확인하고 이전 단계부터 다시 실행

### **오류 2: "function does not exist"**
**원인:** 트리거에서 사용하는 함수가 아직 생성되지 않음  
**해결:** 함수를 먼저 생성한 후 트리거 생성

### **오류 3: "duplicate key value violates unique constraint"**
**원인:** 이미 존재하는 데이터 중복  
**해결:** 기존 데이터 확인 후 `DROP TABLE IF EXISTS` 사용

### **오류 4: "insufficient privilege"**
**원인:** 권한 부족  
**해결:** Supabase 대시보드에서 SQL Editor로 실행하거나 관리자 권한 확인

---

## 📊 마이그레이션 체크리스트

```
Phase 1: 데이터베이스 확장
├─ [ ] 1. market_categories 테이블 생성
├─ [ ] 2. markets 테이블 생성
├─ [ ] 3. user_points 테이블 생성
├─ [ ] 4. point_transactions 테이블 생성
├─ [ ] 5. predictions 테이블 수정
├─ [ ] 6. 헬퍼 함수 생성
├─ [ ] 7. RLS 정책 설정
├─ [ ] 8. 기본 기능 테스트
└─ [ ] 9. 프로덕션 배포 (백업 후)
```

---

## 🎉 완료 후 확인사항

- [ ] 모든 테이블이 정상 생성됨
- [ ] 인덱스가 올바르게 생성됨
- [ ] 트리거/함수가 정상 작동함
- [ ] RLS 정책이 적용됨
- [ ] 테스트 데이터로 동작 확인 완료
- [ ] 기존 스포츠 테이블 정상 작동 확인

**완료되면 Phase 2 (스포츠 마켓 자동화)로 진행하세요!** 🚀

