# 데이터베이스 설정 가이드

## 🚀 Supabase 데이터베이스 설정 순서

### 1️⃣ 기본 테이블 생성 (순서대로 실행)

Supabase Dashboard → SQL Editor에서 다음 순서로 실행하세요:

```
1. migrations/01_create_market_categories_table.sql
2. migrations/02_create_markets_table.sql
3. migrations/03_create_user_points_table.sql
4. migrations/04_create_point_transactions_table.sql
5. migrations/05_modify_predictions_table.sql
6. migrations/06_create_helper_functions.sql
```

### 2️⃣ 포인트 경제 구조 적용

```
7. migrations/07_add_point_types.sql
```

이 마이그레이션은:
- RP/PP/WP 포인트 타입 추가
- 예측 주식 가격 시스템 (1주 = 100P)
- 포인트별 트랜잭션 처리 로직

### 3️⃣ 샘플 데이터 삽입

```
8. seeds/01_insert_categories_and_sample_markets.sql
```

이 시드는:
- 6개 카테고리 삽입 (정치/경제/연예/스포츠/사회/기술)
- 각 카테고리별 샘플 마켓 1개씩 생성

---

## 📊 포인트 경제 구조

### 포인트 타입

| 타입 | 이름 | 획득 방법 | 사용처 | 환전 |
|------|------|-----------|--------|------|
| **RP** | Reward Point | 로그인, 광고, 미션 | 예측 참여 | ❌ |
| **PP** | Premium Point | 결제 | 예측 참여, 마켓 개설 | ❌ |
| **WP** | Winning Point | 예측 적중 | 리워드몰 교환 | ❌ |

### 예측 주식 시스템

- **1 예측 주식 = 100P**
- YES/NO 가격: 0~100P (가격 = 확률)
- 정답 시: 주식당 100P 지급
- 오답 시: 0P (소각)

**예시:**
```
마켓: "비트코인 $150,000 돌파?"
YES 가격: 38P (38% 확률)
NO 가격: 62P (62% 확률)

유저 A: YES 10주 구매 (380P 지출)
→ 결과 YES: 1000P 획득 (+620P 이익)
→ 결과 NO: 0P (380P 손실)
```

---

## 🧪 테스트 시나리오

### 시나리오 1: 신규 유저 가입

1. 회원가입 시 자동으로 `user_points` 레코드 생성
2. 초기 RP 1000P 지급
3. PP 0P, WP 0P

### 시나리오 2: 예측 참여

1. 유저가 마켓 선택 (예: "비트코인 돌파?" YES 선택)
2. 주식 수 선택 (예: 5주)
3. 필요 포인트 계산 (YES 가격 38P × 5주 = 190P)
4. RP 또는 PP에서 차감 (우선순위: RP → PP)
5. `predictions` 테이블에 기록
6. 포인트 잠금 처리

### 시나리오 3: 마켓 결과 확정 (Admin)

1. Admin이 마켓 결과 선택 (YES/NO/취소)
2. 모든 예측 조회
3. 정답자:
   - 주식 수 × 100P를 WP로 지급
   - 사용한 RP/PP는 소각
4. 오답자:
   - 사용한 RP/PP 소각
5. 취소:
   - 모든 유저에게 RP/PP 환불

---

## 🔍 확인 쿼리

### 카테고리 및 마켓 조회
```sql
SELECT 
    m.id,
    m.title,
    mc.name as category,
    mc.icon,
    m.yes_price || 'P' as yes_price,
    m.no_price || 'P' as no_price,
    m.total_participants,
    m.status
FROM markets m
JOIN market_categories mc ON m.category_slug = mc.slug
ORDER BY mc.display_order;
```

### 유저 포인트 현황
```sql
SELECT 
    user_id,
    rp_points as "RP",
    pp_points as "PP",
    wp_points as "WP",
    (rp_points + pp_points) as "사용가능",
    total_predictions as "예측횟수",
    win_rate as "승률%"
FROM user_points;
```

### 포인트 트랜잭션 내역
```sql
SELECT 
    user_id,
    point_type,
    transaction_type,
    amount,
    balance_before,
    balance_after,
    description,
    created_at
FROM point_transactions
ORDER BY created_at DESC
LIMIT 20;
```

---

## ⚠️ 주의사항

1. **마이그레이션 순서를 반드시 지켜주세요** (의존성 있음)
2. **프로덕션 환경**에서는 백업 후 실행
3. `07_add_point_types.sql`은 기존 데이터를 마이그레이션하므로 신중히 실행
4. 환전 불가 정책을 반드시 준수 (법적 이슈)

---

## 📞 문제 발생 시

1. Supabase SQL Editor에서 에러 메시지 확인
2. 테이블 존재 여부 확인: `\dt` (psql) 또는 Table Editor
3. 제약조건 충돌 시 기존 데이터 확인


