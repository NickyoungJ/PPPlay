# 🗃️ Database Schema & Migrations

PPPlay (폴리마켓) 프로젝트의 데이터베이스 스키마 및 마이그레이션 파일들을 관리합니다.

## 📁 폴더 구조

```
database/
├── migrations/          # 테이블 생성 및 스키마 변경 SQL 파일들
│   ├── 01_create_market_categories_table.sql      # 마켓 카테고리
│   ├── 02_create_markets_table.sql                # 통합 마켓 테이블
│   ├── 03_create_user_points_table.sql            # 사용자 포인트 관리
│   ├── 04_create_point_transactions_table.sql     # 포인트 트랜잭션
│   ├── 05_modify_predictions_table.sql            # 예측 테이블 (수정)
│   ├── 06_create_helper_functions.sql             # 헬퍼 함수들
│   ├── create_soccer_games_table.sql              # 축구 경기 (기존)
│   ├── create_soccer_teams_table.sql              # 축구 팀 (기존)
│   ├── create_volleyball_games_table.sql          # 배구 경기 (기존)
│   └── create_volleyball_teams_table.sql          # 배구 팀 (기존)
├── seeds/              # 초기 데이터 및 테스트 데이터 삽입 SQL 파일들
└── README.md           # 이 파일
```

## 🏗️ 데이터베이스 구조

### 📊 **핵심 테이블**

#### 1. `market_categories` - 마켓 카테고리
- 정치, 경제, 연예, 스포츠 등 카테고리 관리
- 아이콘, 설명, 표시 순서 포함

#### 2. `markets` - 통합 마켓 테이블
- **market_type**: `sports` (스포츠 경기) / `general` (사용자 생성)
- 스포츠 마켓: `game_id`로 기존 경기 테이블 연결
- 일반 마켓: 사용자가 생성한 이슈/예측 마켓
- Yes/No 투표, 참여 통계, 결과 확정 포함

#### 3. `predictions` - 사용자 예측
- `market_id` 기반 예측 (스포츠 + 일반 통합)
- Yes/No 선택 (스포츠: Yes=홈팀, No=원정팀)
- 포인트 사용/보상, 정답 여부, 정산 상태

#### 4. `user_points` - 사용자 포인트 관리
- 보유/사용가능/잠긴 포인트
- 예측 통계 (총 횟수, 정답 횟수, 승률, 연속 정답)
- 레벨/경험치/티어 시스템
- 출석, 추천인 코드

#### 5. `point_transactions` - 포인트 트랜잭션
- 모든 포인트 획득/사용 내역 기록
- 출석, 광고, 친구 초대, 예측 참여/보상 등
- 트랜잭션 타입별 추적

### 🏀 **스포츠 테이블 (기존 유지)**

#### `games` - 야구(KBO) 경기
- 기존 야구 경기 데이터
- `markets` 테이블의 `game_id`로 연결

#### `soccer_games` - 축구(EPL, MLS 등) 경기
- 리그별 축구 경기 데이터
- `markets` 테이블의 `game_id`로 연결

#### `volleyball_games` - 배구(V-리그) 경기
- 남자부/여자부 배구 경기 데이터
- `markets` 테이블의 `game_id`로 연결

#### `*_teams` - 팀 정보 테이블
- `KBO_teams`, `soccer_teams`, `volleyball_teams`
- 팀 로고, 색상, 이름 등

---

## 🚀 사용 방법

### **1단계: Supabase SQL Editor에서 실행**
1. Supabase 프로젝트 대시보드 접속
2. SQL Editor 메뉴 선택
3. 아래 순서대로 SQL 파일 내용을 복사하여 실행

### **2단계: 실행 순서 (중요!)**

```bash
# 1. 카테고리 테이블 (가장 먼저)
01_create_market_categories_table.sql

# 2. 마켓 테이블 (카테고리 참조)
02_create_markets_table.sql

# 3. 사용자 포인트 테이블
03_create_user_points_table.sql

# 4. 포인트 트랜잭션 테이블
04_create_point_transactions_table.sql

# 5. 예측 테이블 수정 (기존 삭제 후 재생성)
05_modify_predictions_table.sql

# 6. 헬퍼 함수들
06_create_helper_functions.sql

# 7. 스포츠 관련 테이블 (이미 있다면 스킵)
create_soccer_games_table.sql
create_soccer_teams_table.sql
create_volleyball_games_table.sql
create_volleyball_teams_table.sql
```

---

## 🔧 주요 함수

### **사용자 관련**
```sql
-- 신규 회원 포인트 초기화
SELECT initialize_user_points('user-uuid', '추천코드');

-- 일일 출석 체크
SELECT check_daily_login('user-uuid');

-- 광고 시청 보상
SELECT reward_ad_view('user-uuid', 'video');

-- 사용자 통계 조회
SELECT get_user_statistics('user-uuid');
```

### **마켓 관련**
```sql
-- 활성 마켓 조회 (카테고리별)
SELECT * FROM get_active_markets('sports', 20, 0);
SELECT * FROM get_active_markets('politics', 20, 0);

-- 마켓 통계 조회
SELECT get_market_statistics('market-uuid');

-- 마켓 만료 자동 마감
SELECT auto_close_expired_markets();
```

### **예측 관련**
```sql
-- 사용자 예측 내역
SELECT * FROM get_user_predictions('user-uuid', 'pending', 20, 0);

-- 예측 정산 (개별)
SELECT settle_prediction('prediction-uuid');

-- 마켓 전체 예측 정산
SELECT settle_market_predictions('market-uuid');
```

### **리더보드**
```sql
-- 포인트 순위
SELECT * FROM get_leaderboard('points', 100);

-- 승률 순위
SELECT * FROM get_leaderboard('win_rate', 100);

-- 연속 정답 순위
SELECT * FROM get_leaderboard('streak', 100);
```

---

## 🔐 Row Level Security (RLS) 설정

### **markets 테이블**
```sql
-- 모든 사용자 조회 가능
CREATE POLICY "Anyone can view active markets" ON markets
    FOR SELECT USING (status = 'active' AND is_closed = false);

-- 인증된 사용자만 일반 마켓 생성 가능
CREATE POLICY "Authenticated users can create general markets" ON markets
    FOR INSERT WITH CHECK (auth.uid() = creator_id AND market_type = 'general');
```

### **predictions 테이블**
```sql
-- 본인 예측만 조회
CREATE POLICY "Users can view own predictions" ON predictions
    FOR SELECT USING (auth.uid() = user_id);

-- 본인 예측만 생성
CREATE POLICY "Users can create own predictions" ON predictions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### **user_points 테이블**
```sql
-- 본인 포인트만 조회
CREATE POLICY "Users can view own points" ON user_points
    FOR SELECT USING (auth.uid() = user_id);
```

---

## 📈 데이터 흐름

### **1. 스포츠 마켓 자동 생성 흐름**
```
경기 크롤링 → games/soccer_games/volleyball_games 저장
              ↓
        Edge Function 트리거
              ↓
        markets 테이블에 자동 생성
        (market_type='sports', game_id 연결)
```

### **2. 예측 참여 흐름**
```
사용자 예측 제출 → predictions 테이블 INSERT
                  ↓
            트리거 자동 실행:
            - user_points.locked_points 증가
            - markets 통계 업데이트
            - point_transactions 차감 기록
```

### **3. 결과 확정 & 정산 흐름**
```
관리자/자동 결과 확정 → markets.result 업데이트
                      ↓
              settle_market_predictions() 호출
                      ↓
              각 예측 정산:
              - 정답 여부 판정
              - 보상 계산 (총 풀의 90% 분배)
              - locked_points 해제
              - 통계 업데이트
              - point_transactions 보상 기록
```

---

## ⚠️ 주의사항

1. **마이그레이션 순서 엄수**: 외래키 참조 관계로 인해 반드시 순서대로 실행
2. **기존 predictions 테이블**: `05_modify_predictions_table.sql`은 기존 테이블을 삭제하고 재생성합니다
3. **프로덕션 환경**: 백업 필수! `DROP TABLE` 구문 주의
4. **RLS 정책**: 테이블 생성 후 반드시 RLS 활성화 및 정책 설정
5. **트리거 의존성**: 트리거가 많으므로 테스트 환경에서 충분히 테스트 후 프로덕션 적용

---

## 🧪 테스트 데이터 삽입 (개발용)

```sql
-- 테스트 사용자 포인트 초기화
SELECT initialize_user_points('test-user-uuid-1', NULL);
SELECT initialize_user_points('test-user-uuid-2', 'ABCD1234');

-- 테스트 마켓 생성 (일반)
INSERT INTO markets (
    market_type, title, description, category_slug,
    option_yes, option_no, closes_at, status
) VALUES (
    'general', 
    '비트코인이 연말까지 $100,000 돌파할까?',
    '2025년 12월 31일까지 비트코인 가격이 $100,000 이상이 될지 예측하세요.',
    'economy',
    'Yes (돌파한다)',
    'No (돌파하지 않는다)',
    '2025-12-31 23:59:59+09',
    'approved'
);

-- 테스트 예측 생성
INSERT INTO predictions (
    user_id, market_id, predicted_option, points_spent
) VALUES (
    'test-user-uuid-1',
    (SELECT id FROM markets WHERE title LIKE '%비트코인%'),
    'yes',
    50
);
```

---

## 📝 변경 이력

- **2025-10-20**: 폴리마켓 구조로 전면 개편
  - markets, user_points, point_transactions 테이블 추가
  - predictions 테이블 구조 변경
  - 스포츠 테이블은 유지하면서 markets와 연동
  - 자동화 함수 및 트리거 추가

- **2025-09-23**: 배구 테이블 생성 (volleyball_games, volleyball_teams)
- **2025-09-27**: 축구 테이블 생성 (soccer_games, soccer_teams)

---

## 🆘 문제 해결

### Q1. 외래키 오류가 발생합니다
→ 마이그레이션 순서를 확인하세요. 참조되는 테이블이 먼저 생성되어야 합니다.

### Q2. 트리거가 작동하지 않습니다
→ 함수가 먼저 생성되었는지 확인하세요. 함수 → 트리거 순서로 실행해야 합니다.

### Q3. 포인트가 차감되지 않습니다
→ `point_transactions` 테이블의 `status`가 'completed'인지 확인하세요.

### Q4. 예측 정산이 안 됩니다
→ `markets.result`가 먼저 확정되었는지 확인 후 `settle_market_predictions()` 호출하세요.

---

## 📞 문의

데이터베이스 관련 문의사항은 이슈를 등록해주세요.
