# 🎯 폴리마켓 스타일 예측 플랫폼 구현 완료

## ✅ 완료된 작업

### 1️⃣ 포인트 경제 구조 구현 (RP/PP/WP)

#### 데이터베이스 스키마
- ✅ `user_points` 테이블에 RP/PP/WP 컬럼 추가
- ✅ `point_transactions` 테이블에 `point_type` 추가
- ✅ 주식 시스템 구현 (1주 = 100P)
- ✅ YES/NO 가격 동적 계산 (0-100P)

**파일:** `database/migrations/07_add_point_types.sql`

#### 포인트 타입별 특징

| 타입 | 이름 | 획득 | 사용 | 환전 |
|------|------|------|------|------|
| **RP** | Reward Point | 로그인/광고/미션 | 예측 참여 | ❌ |
| **PP** | Premium Point | 결제 | 예측/마켓개설 | ❌ |
| **WP** | Winning Point | 예측 적중 | 리워드몰 교환 | ❌ |

---

### 2️⃣ 카테고리 및 샘플 마켓 데이터

#### 카테고리 (6개)
- 🏛️ 정치
- 💼 경제
- 🎭 연예
- ⚽ 스포츠
- 🌍 사회
- 🔬 기술

#### 샘플 마켓 (각 카테고리별 1개)
1. **정치**: "2025년 상반기 내 전기차 보조금이 증액될까?" (YES 45P / NO 55P)
2. **경제**: "비트코인이 2025년 말까지 $150,000를 돌파할까?" (YES 38P / NO 62P)
3. **연예**: "아이유의 신곡이 발매 후 1주일 내 멜론 1위를 차지할까?" (YES 72P / NO 28P)
4. **스포츠**: "손흥민이 2024-25 시즌 EPL에서 20골 이상을 기록할까?" (YES 42P / NO 58P)
5. **사회**: "2025년 여름, 서울에 폭염특보가 30일 이상 발령될까?" (YES 55P / NO 45P)
6. **기술**: "OpenAI가 2025년 내에 GPT-5를 공식 출시할까?" (YES 63P / NO 37P)

**파일:** `database/seeds/01_insert_categories_and_sample_markets.sql`

---

### 3️⃣ 예측 참여 API (주식 시스템)

#### 엔드포인트
```
POST /api/predictions/create
```

#### 요청 Body
```json
{
  "market_id": "uuid",
  "predicted_option": "yes", // or "no"
  "shares": 5,                // 구매할 주식 수 (1-100)
  "point_type": "RP"          // or "PP"
}
```

#### 주요 기능
- ✅ 주식 가격 자동 계산 (YES/NO 가격 × 주식 수)
- ✅ RP 또는 PP 선택 사용
- ✅ 포인트 차감 트랜잭션 생성
- ✅ 마켓 통계 업데이트 (참여자, 주식 수, 가격 재계산)
- ✅ 잠재 수익 계산 (주식당 100P)

#### 응답 예시
```json
{
  "success": true,
  "message": "예측에 참여했습니다!",
  "prediction": {
    "id": "uuid",
    "user_id": "uuid",
    "market_id": "uuid",
    "predicted_option": "yes",
    "points_spent": 190,
    "purchase_price": 38,
    "shares": 5,
    "potential_payout": 500,
    "purchase_info": {
      "shares": 5,
      "price_per_share": 38,
      "total_cost": 190,
      "potential_payout": 500,
      "potential_profit": 310
    }
  },
  "market_stats": {
    "total_participants": 15,
    "yes_count": 8,
    "no_count": 7,
    "yes_shares": 120,
    "no_shares": 95,
    "yes_price": 56,
    "no_price": 44,
    "total_points_pool": 8150
  }
}
```

**파일:** `app/api/predictions/create/route.ts`

---

### 4️⃣ 마켓 통계 업데이트 함수

#### 데이터베이스 함수
```sql
update_market_stats(p_market_id, p_option, p_shares, p_points)
```

#### 기능
- ✅ YES/NO 참여자 수 증가
- ✅ YES/NO 주식 수 증가
- ✅ 총 포인트 풀 증가
- ✅ **가격 자동 재계산** (주식 비율 기반)
  - `YES 가격 = YES 주식 / 총 주식 × 100`
  - `NO 가격 = NO 주식 / 총 주식 × 100`
  - 최소 5P, 최대 95P 제한

**파일:** `database/migrations/08_create_market_settlement_functions.sql`

---

### 5️⃣ Admin 결과 확정 및 정산 시스템

#### 엔드포인트
```
POST /api/admin/markets/settle
```

#### 요청 Body
```json
{
  "market_id": "uuid",
  "result": "yes"  // "yes", "no", "cancelled"
}
```

#### 정산 로직

##### 📗 결과가 YES 또는 NO인 경우

**정답자 (Winners):**
1. 주식당 100P를 **WP**로 지급
2. 사용한 RP/PP는 소각
3. `predictions` 테이블에 `is_correct = true` 기록
4. `user_points` 테이블에 `correct_predictions` 증가
5. 경험치 10점 지급

**오답자 (Losers):**
1. 사용한 RP/PP 소각 (아무것도 하지 않음, 이미 차감됨)
2. `predictions` 테이블에 `is_correct = false` 기록

**예시:**
```
유저 A: YES 5주 구매 (190P 소모)
결과: YES
→ WP 500P 지급 (+310P 순이익)

유저 B: NO 3주 구매 (186P 소모)
결과: YES
→ 186P 소각 (손실)
```

##### 🔵 결과가 CANCELLED인 경우

**모든 참여자:**
1. 사용한 포인트를 **RP**로 전액 환불
2. `predictions` 테이블에 `is_correct = NULL` 기록

#### 데이터베이스 함수
```sql
settle_market(p_market_id, p_result, p_admin_id)
```

#### 반환값
```json
{
  "success": true,
  "market_id": "uuid",
  "result": "yes",
  "winners_count": 8,
  "losers_count": 7,
  "total_wp_issued": 4800,
  "total_points_returned": 0,
  "settled_at": "2025-10-29T12:00:00Z"
}
```

**파일:** 
- `database/migrations/08_create_market_settlement_functions.sql`
- `app/api/admin/markets/settle/route.ts`

---

### 6️⃣ Admin 권한 체크 시스템

#### 엔드포인트
```
GET /api/admin/check
```

#### 환경 변수 설정
`.env.local`:
```bash
ADMIN_EMAILS=admin@ppplay.com,your-email@example.com
```

#### 응답
```json
{
  "success": true,
  "isAdmin": true,
  "user": {
    "id": "uuid",
    "email": "admin@ppplay.com"
  }
}
```

**파일:** `app/api/admin/check/route.ts`

---

## 📋 데이터베이스 마이그레이션 순서

Supabase SQL Editor에서 다음 순서로 실행:

```
1. migrations/01_create_market_categories_table.sql
2. migrations/02_create_markets_table.sql
3. migrations/03_create_user_points_table.sql
4. migrations/04_create_point_transactions_table.sql
5. migrations/05_modify_predictions_table.sql
6. migrations/06_create_helper_functions.sql
7. migrations/07_add_point_types.sql          ⭐ NEW
8. migrations/08_create_market_settlement_functions.sql  ⭐ NEW
9. seeds/01_insert_categories_and_sample_markets.sql  ⭐ NEW
```

---

## 🧪 테스트 시나리오

### 시나리오 1: 신규 유저 가입 및 예측 참여

1. **회원가입**
   ```
   → user_points 자동 생성
   → RP 1000P, PP 0P, WP 0P 지급
   ```

2. **마켓 선택**
   ```
   마켓: "비트코인 $150,000 돌파?"
   YES 가격: 38P
   NO 가격: 62P
   ```

3. **YES 5주 구매**
   ```
   총 비용: 38P × 5 = 190P (RP 사용)
   잠재 수익: 100P × 5 = 500P
   잠재 이익: 500P - 190P = 310P
   ```

4. **포인트 차감**
   ```
   RP: 1000P → 810P
   point_transactions에 -190P 기록
   ```

5. **마켓 통계 업데이트**
   ```
   yes_shares: 0 → 5
   yes_count: 0 → 1
   total_participants: 0 → 1
   total_points_pool: 0 → 190
   yes_price: 50 → 100 (재계산, 100% YES)
   no_price: 50 → 0
   ```

### 시나리오 2: Admin 결과 확정

1. **Admin 로그인**
   ```
   GET /api/admin/check
   → isAdmin: true 확인
   ```

2. **결과 확정 (YES)**
   ```
   POST /api/admin/markets/settle
   {
     "market_id": "uuid",
     "result": "yes"
   }
   ```

3. **정산 실행**
   ```
   정답자 (YES 선택자):
   - WP 500P 지급
   - correct_predictions +1
   - experience_points +10
   
   오답자 (NO 선택자):
   - 포인트 소각 (이미 차감됨)
   ```

4. **최종 포인트**
   ```
   유저 A (YES 5주):
   - RP: 810P (그대로)
   - WP: 0P → 500P (+500P)
   - 순이익: +310P (WP)
   ```

---

## 🚀 다음 단계

### 필수 작업
1. ⚠️ **.env.local의 ADMIN_EMAILS 설정** (본인 이메일 추가)
2. ⚠️ **Supabase에 마이그레이션 실행** (README_SETUP.md 참고)
3. ⚠️ **Vercel 환경 변수 설정** (`ADMIN_EMAILS` 추가)

### 테스트
1. 로컬에서 회원가입 → 초기 RP 1000P 확인
2. 샘플 마켓에 예측 참여 → 포인트 차감 확인
3. Admin 페이지 접속 → 권한 확인
4. 결과 확정 → WP 지급 확인

### UI 개선 (다음 단계)
1. 마켓 상세 페이지에 주식 구매 UI 추가
2. RP/PP/WP 잔액 표시
3. 예측 내역 및 수익 통계
4. 리더보드 (WP 랭킹)
5. 리워드몰 (WP 기프티콘 교환)

---

## 📁 주요 파일 목록

### 데이터베이스
- `database/migrations/07_add_point_types.sql` - RP/PP/WP 시스템
- `database/migrations/08_create_market_settlement_functions.sql` - 정산 로직
- `database/seeds/01_insert_categories_and_sample_markets.sql` - 초기 데이터
- `database/README_SETUP.md` - 설정 가이드

### API
- `app/api/predictions/create/route.ts` - 예측 참여 (주식 시스템)
- `app/api/admin/check/route.ts` - Admin 권한 체크
- `app/api/admin/markets/settle/route.ts` - 결과 확정 및 정산

### 환경 설정
- `.env.local` - 로컬 환경 변수 (ADMIN_EMAILS 추가됨)
- `.env.local.example` - 환경 변수 예시

---

## 💡 핵심 개념 요약

### 주식 시스템
```
1주 = 현재 가격 (YES 또는 NO)
정답 시 = 주식당 100P (WP 지급)
가격 = 확률 (폴리마켓 방식)
```

### 포인트 경제
```
RP (무료) → 예측 참여 → WP (보상) → 리워드몰
PP (유료) → 예측 참여 → WP (보상) → 리워드몰
환전 불가 = 합법성 유지
```

### 정산 공식
```
정답자 수익 = (100P × 주식 수) - 구매 비용
오답자 손실 = 구매 비용 (소각)
```

---

## ✅ 완료 체크리스트

- [x] RP/PP/WP 포인트 시스템 구현
- [x] 주식 시스템 구현 (1주 = 100P)
- [x] 카테고리 6개 생성
- [x] 샘플 마켓 6개 생성
- [x] 예측 참여 API (포인트 차감)
- [x] 마켓 통계 자동 업데이트
- [x] 가격 동적 재계산
- [x] Admin 권한 체크 API
- [x] 결과 확정 및 정산 API
- [x] WP 지급 로직
- [x] 포인트 소각 로직
- [x] 환불 로직 (취소 시)

---

## 🎉 결론

폴리마켓 스타일의 주식 기반 예측 시스템이 완성되었습니다!

- ✅ RP/PP/WP 3종 포인트 경제
- ✅ YES/NO 주식 시스템
- ✅ 동적 가격 계산
- ✅ 완전한 정산 시스템
- ✅ Admin 관리 기능

다음은 Supabase에 마이그레이션을 적용하고 실제 테스트를 진행할 차례입니다! 🚀


