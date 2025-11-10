# 🔄 마이그레이션 가이드: 주식 시스템 → 투표 시스템

## 📋 개요

이 마이그레이션은 복잡한 주식/베팅 시스템을 **단순한 투표 시스템**으로 전환합니다.

### 주요 변경 사항

| 구분 | 이전 (주식 시스템) | 이후 (투표 시스템) |
|------|-------------------|-------------------|
| **투표 참여** | 주식 수 선택 + 포인트 차감 | YES/NO 선택 + 즉시 +5P |
| **가격** | 동적 가격 (0-100P) | 없음 (비율만 표시) |
| **보상** | 주식 × 100P + 풀 분배 | 고정 +20P (적중 시) |
| **포인트** | RP/PP/WP 3가지 | RP 중심 (단일 포인트) |
| **일일 제한** | 없음 | 하루 10회 제한 |

---

## 🚀 Step 1: Supabase에서 마이그레이션 실행

### 방법 1: Supabase Dashboard (추천)

1. **Supabase 대시보드 접속**
   ```
   https://supabase.com/dashboard
   ```

2. **프로젝트 선택**
   - 프로젝트: `mtuzltnvgokupkjprsdt`

3. **SQL Editor 열기**
   - 좌측 메뉴: `SQL Editor` 클릭
   - 또는 직접 이동: `https://supabase.com/dashboard/project/mtuzltnvgokupkjprsdt/sql/new`

4. **마이그레이션 SQL 실행**
   - `database/migrations/09_simplify_to_poll_market.sql` 파일 내용 복사
   - SQL Editor에 붙여넣기
   - **Run** 버튼 클릭 ▶️

5. **결과 확인**
   ```
   ✅ 마이그레이션 완료!
   복잡한 주식/베팅 시스템 → 단순 투표 시스템 전환 성공
   ```

### 방법 2: Supabase CLI (로컬)

```bash
# Supabase CLI 설치 (없는 경우)
brew install supabase/tap/supabase

# 프로젝트 링크
supabase link --project-ref mtuzltnvgokupkjprsdt

# 마이그레이션 실행
supabase db push

# 또는 직접 SQL 실행
supabase db execute --file database/migrations/09_simplify_to_poll_market.sql
```

---

## 🔍 Step 2: 마이그레이션 검증

### 2-1. 테이블 구조 확인

Supabase Dashboard → Table Editor에서 확인:

#### `markets` 테이블
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'markets'
ORDER BY ordinal_position;
```

**확인 사항:**
- ❌ `yes_price`, `no_price` 컬럼 제거됨
- ❌ `yes_shares`, `no_shares` 컬럼 제거됨
- ❌ `total_points_pool` 컬럼 제거됨
- ✅ `yes_percentage`, `no_percentage` 컬럼 추가됨

#### `predictions` 테이블
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'predictions'
ORDER BY ordinal_position;
```

**확인 사항:**
- ❌ `point_type`, `points_spent` 컬럼 제거됨
- ❌ `purchase_price`, `shares` 컬럼 제거됨
- ✅ `participation_reward`, `accuracy_reward` 컬럼 추가됨

### 2-2. 함수 확인

```sql
-- 새로운 함수들이 생성되었는지 확인
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
      'update_vote_percentage',
      'update_market_stats_for_poll',
      'settle_market_simple',
      'check_daily_vote_limit',
      'increment_daily_vote_count'
  );
```

**예상 결과:**
```
routine_name                    | routine_type | data_type
-------------------------------|--------------|----------
update_vote_percentage         | FUNCTION     | trigger
update_market_stats_for_poll   | FUNCTION     | void
settle_market_simple           | FUNCTION     | jsonb
check_daily_vote_limit         | FUNCTION     | boolean
increment_daily_vote_count     | FUNCTION     | void
```

### 2-3. 기존 데이터 확인

```sql
-- 기존 마켓의 비율이 제대로 계산되었는지 확인
SELECT 
    id,
    title,
    yes_count,
    no_count,
    total_participants,
    yes_percentage,
    no_percentage,
    (yes_percentage + no_percentage) AS total_percentage
FROM markets
WHERE total_participants > 0
LIMIT 5;
```

**확인 사항:**
- `yes_percentage + no_percentage ≈ 100` (소수점 오차 허용)

---

## 🛠️ Step 3: API 코드 수정

마이그레이션 후 다음 API 파일들을 수정해야 합니다:

### 수정 대상 파일

1. ✅ `/app/api/predictions/create/route.ts`
   - 주식 수, 포인트 타입 제거
   - 일일 제한 체크 추가
   - 참여 보상 로직 변경

2. ✅ `/app/api/admin/markets/settle/route.ts`
   - `settle_market_simple` 함수 호출
   - 고정 보상 로직

3. ✅ `/app/markets/[id]/page.tsx`
   - UI: 주식 수 입력 제거
   - UI: 가격 → 비율로 변경
   - 단순 YES/NO 버튼

4. ✅ `/app/components/market/GeneralMarketCard.tsx`
   - 가격 표시 → 비율 표시로 변경

---

## ⚠️ 주의사항

### 1. 기존 데이터 영향

- **기존 예측 데이터는 유지됩니다**
- `participation_reward`, `accuracy_reward` 자동 설정됨
- 정산되지 않은 마켓은 새로운 로직으로 정산됨

### 2. 호환성

- 기존 `point_transactions` 타입은 유지됨 (하위 호환성)
- `user_points`의 RP/PP/WP 컬럼은 유지됨 (향후 제거 가능)

### 3. 롤백 방법

만약 문제가 발생하면:

```sql
-- 마이그레이션 이전 백업 복원
-- (Supabase는 자동 백업 제공)

-- 또는 수동 롤백:
BEGIN;

-- 제거된 컬럼 복원
ALTER TABLE markets
    ADD COLUMN yes_price INTEGER DEFAULT 50,
    ADD COLUMN no_price INTEGER DEFAULT 50;

-- 추가된 컬럼 제거
ALTER TABLE markets
    DROP COLUMN yes_percentage,
    DROP COLUMN no_percentage;

COMMIT;
```

---

## ✅ 완료 체크리스트

- [ ] Supabase에서 마이그레이션 SQL 실행
- [ ] 테이블 구조 확인 (컬럼 제거/추가)
- [ ] 함수 생성 확인 (5개 함수)
- [ ] 기존 데이터 비율 계산 확인
- [ ] API 코드 수정 (4개 파일)
- [ ] 로컬 테스트 (투표 참여 → 보상 확인)
- [ ] Vercel 배포 및 프로덕션 테스트

---

## 🎯 다음 단계

마이그레이션 완료 후:

1. **API 수정** (자동 진행 예정)
2. **UI/UX 수정** (가격 → 비율 표시)
3. **테스트** (로컬 → 프로덕션)
4. **배포** (Vercel)

---

**문의사항이 있으면 언제든지 말씀해주세요!** 🚀
