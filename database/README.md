# 🗃️ Database Schema & Migrations

PPPlay 프로젝트의 데이터베이스 스키마 및 마이그레이션 파일들을 관리합니다.

## 📁 폴더 구조

```
database/
├── migrations/          # 테이블 생성 및 스키마 변경 SQL 파일들
│   ├── create_soccer_games_table.sql
│   ├── create_soccer_teams_table.sql
│   ├── create_volleyball_games_table.sql
│   └── create_volleyball_teams_table.sql
├── seeds/              # 초기 데이터 및 테스트 데이터 삽입 SQL 파일들
│   └── insert_volleyball_games_sql.sql
└── README.md           # 이 파일
```

## 🎯 지원 스포츠별 테이블

### ⚾ 야구 (KBO)
- `games` - KBO 경기 데이터
- `KBO_teams` - KBO 팀 정보 (로고, 컬러 포함)

### 🏐 배구 (V-리그)
- `volleyball_games` - 배구 경기 데이터
- `volleyball_teams` - 배구 팀 정보

### ⚽ 축구 (EPL)
- `soccer_games` - 축구 경기 데이터
- `soccer_teams` - 축구 팀 정보

## 🚀 사용 방법

### 1. Supabase SQL Editor에서 실행
1. Supabase 프로젝트 대시보드 접속
2. SQL Editor 메뉴 선택
3. 각 SQL 파일 내용을 복사하여 실행

### 2. 실행 순서
1. **팀 테이블 먼저 생성** (`migrations/` 폴더)
   ```sql
   -- KBO_teams (이미 생성됨)
   -- volleyball_teams
   -- soccer_teams
   ```

2. **경기 테이블 생성** (`migrations/` 폴더)
   ```sql
   -- games (이미 생성됨)
   -- volleyball_games  
   -- soccer_games
   ```

3. **초기 데이터 삽입** (`seeds/` 폴더)
   ```sql
   -- insert_volleyball_games_sql.sql (배구 경기 데이터)
   ```

## ⚠️ 주의사항

- **프로덕션 환경**에서는 `DROP TABLE IF EXISTS` 구문 주의
- **백업 필수**: 중요한 데이터가 있는 경우 백업 후 실행
- **RLS 정책**: 테이블 생성 후 Row Level Security 설정 확인

## 🔄 마이그레이션 히스토리

- `2025-09-23`: 배구 테이블 생성 (volleyball_games, volleyball_teams)
- `2025-09-23`: 축구 테이블 생성 (soccer_games, soccer_teams)
- `2025-09-16`: KBO 야구 테이블 업데이트 (score 컬럼 추가)

## 📝 스키마 변경시 가이드라인

1. **새 마이그레이션 파일 생성**
   - 파일명: `YYYY-MM-DD_description.sql`
   - 예: `2025-09-25_add_user_predictions_table.sql`

2. **변경사항 문서화**
   - 이 README.md 파일 업데이트
   - 커밋 메시지에 변경 내용 명시

3. **테스트 환경에서 먼저 검증**
   - 로컬 Supabase 또는 개발용 프로젝트에서 테스트
   - 프로덕션 적용 전 백업 필수
