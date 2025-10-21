# ✅ Phase 1 완료 - 데이터베이스 확장

## 🎯 완료된 작업

Phase 1에서 폴리마켓 구조를 위한 데이터베이스 테이블과 함수들을 생성했습니다.

---

## 📦 생성된 파일 목록

### **신규 생성 (폴리마켓)**
1. ✅ `01_create_market_categories_table.sql` - 마켓 카테고리 (정치/경제/연예/스포츠)
2. ✅ `02_create_markets_table.sql` - 통합 마켓 테이블 (스포츠 + 일반)
3. ✅ `03_create_user_points_table.sql` - 사용자 포인트 관리
4. ✅ `04_create_point_transactions_table.sql` - 포인트 트랜잭션
5. ✅ `05_modify_predictions_table.sql` - 예측 테이블 재구성
6. ✅ `06_create_helper_functions.sql` - 헬퍼 함수들

### **기존 유지 (스포츠)**
- ✅ `create_soccer_games_table.sql` - 축구 경기
- ✅ `create_soccer_teams_table.sql` - 축구 팀
- ✅ `create_volleyball_games_table.sql` - 배구 경기
- ✅ `create_volleyball_teams_table.sql` - 배구 팀
- ✅ 기존 `games`, `KBO_teams` 테이블 (이미 Supabase에 존재)

---

## 🗄️ 데이터베이스 구조

```
┌─────────────────────────────────────────────────────────┐
│                    폴리마켓 구조                         │
└─────────────────────────────────────────────────────────┘

    market_categories (카테고리)
            ↓
        markets (통합 마켓)
       ↙          ↘
  [스포츠]      [일반]
game_id →      creator_id
games/          사용자 생성
soccer_games/
volleyball_games
            ↓
      predictions (예측)
            ↓
   point_transactions (트랜잭션)
            ↓
      user_points (포인트)
```

---

## 🚀 다음 단계: Supabase에서 실행

### **실행 순서 (매우 중요!)**

Supabase Dashboard → SQL Editor에서 다음 순서대로 실행하세요:

```bash
1️⃣ 01_create_market_categories_table.sql
2️⃣ 02_create_markets_table.sql
3️⃣ 03_create_user_points_table.sql
4️⃣ 04_create_point_transactions_table.sql
5️⃣ 05_modify_predictions_table.sql  ⚠️ 기존 predictions 삭제됨!
6️⃣ 06_create_helper_functions.sql
```

### **⚠️ 주의사항**
- 5번 파일은 기존 `predictions` 테이블을 삭제하고 재생성합니다
- 기존 예측 데이터가 있다면 먼저 백업하세요!
- 개발 환경에서 먼저 테스트 후 프로덕션에 적용하세요

---

## 📊 주요 기능

### **1. 마켓 시스템**
- ✅ 스포츠 마켓 (기존 경기 연동)
- ✅ 일반 마켓 (사용자 생성)
- ✅ Yes/No 투표
- ✅ 참여 통계 (참여자 수, 포인트 풀, Yes/No 비율)

### **2. 포인트 시스템**
- ✅ 보유/사용가능/잠긴 포인트 관리
- ✅ 트랜잭션 내역 추적
- ✅ 출석 체크 (일일 보상 + 연속 보너스)
- ✅ 광고 시청 보상 (일일 10회 제한)
- ✅ 친구 초대 보상

### **3. 예측 시스템**
- ✅ 마켓별 예측 참여
- ✅ 자동 정산 (결과 확정 후)
- ✅ 보상 계산 (정답자가 포인트 풀의 90% 분배)
- ✅ 승률/연속 정답 통계

### **4. 게이미피케이션**
- ✅ 레벨/경험치 시스템 (자동 레벨업)
- ✅ 티어 시스템 (Bronze → Diamond)
- ✅ 연속 정답 추적
- ✅ 리더보드 (포인트/승률/연속 정답)

---

## 🔧 주요 함수

### **사용자 관련**
```sql
-- 신규 회원 초기화
SELECT initialize_user_points('user-uuid', '추천코드');

-- 일일 출석
SELECT check_daily_login('user-uuid');

-- 광고 보상
SELECT reward_ad_view('user-uuid', 'video');

-- 통계 조회
SELECT get_user_statistics('user-uuid');
```

### **마켓 관련**
```sql
-- 활성 마켓 조회
SELECT * FROM get_active_markets('sports', 20, 0);

-- 마켓 통계
SELECT get_market_statistics('market-uuid');

-- 자동 마감
SELECT auto_close_expired_markets();
```

### **예측 관련**
```sql
-- 사용자 예측 조회
SELECT * FROM get_user_predictions('user-uuid', 'pending', 20, 0);

-- 예측 정산
SELECT settle_prediction('prediction-uuid');
SELECT settle_market_predictions('market-uuid');
```

### **리더보드**
```sql
SELECT * FROM get_leaderboard('points', 100);    -- 포인트 순위
SELECT * FROM get_leaderboard('win_rate', 100);  -- 승률 순위
SELECT * FROM get_leaderboard('streak', 100);    -- 연속 정답 순위
```

---

## 🧪 테스트 방법

### **1. 기본 테스트**
```sql
-- 카테고리 확인
SELECT * FROM market_categories;

-- 테스트 사용자 생성
SELECT initialize_user_points('test-user-id', NULL);

-- 포인트 확인
SELECT * FROM user_points WHERE user_id = 'test-user-id';
```

### **2. 마켓 생성 테스트**
```sql
INSERT INTO markets (
    market_type, title, category_slug,
    option_yes, option_no, closes_at, status
) VALUES (
    'general', '테스트 마켓', 'tech',
    'Yes', 'No', '2025-12-31 23:59:59+09', 'approved'
);
```

### **3. 예측 참여 테스트**
```sql
INSERT INTO predictions (
    user_id, market_id, predicted_option, points_spent
) VALUES (
    'test-user-id',
    (SELECT id FROM markets WHERE title = '테스트 마켓'),
    'yes', 50
);
```

---

## 📈 다음 Phase 미리보기

### **Phase 2: 스포츠 마켓 자동화 (1일)**
- Edge Function: 경기 → 마켓 자동 생성
- 경기 결과 → 마켓 결과 자동 반영
- 스케줄러 설정 (매일 자동 실행)

### **Phase 3: 일반 마켓 UI (2-3일)**
- 카테고리 탭 컴포넌트
- 마켓 리스트/상세 페이지
- Yes/No 투표 UI
- 마켓 생성 폼

### **Phase 4: 포인트 시스템 UI (2일)**
- 포인트 대시보드
- 출석 체크 모달
- 리더보드 페이지
- 리워드 상점

---

## ✅ 완료 체크리스트

Phase 1 완료를 위해 다음을 확인하세요:

- [ ] 모든 SQL 파일 Supabase에서 실행 완료
- [ ] 에러 없이 테이블 생성 완료
- [ ] 기본 테스트 통과
- [ ] RLS 정책 설정 완료
- [ ] 기존 스포츠 테이블 정상 작동 확인

**모두 완료되면 Phase 2로 진행하세요!** 🎉

