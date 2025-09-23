# 🎯 PPPlay - 스포츠 예측 플랫폼

> **현대적인 스포츠 승부 예측 플랫폼**  
> 야구, 배구, 축구 경기를 예측하고 친구들과 경쟁하세요!

## ✨ 주요 기능

### 🏆 지원 스포츠
- **⚾ KBO 야구**: 팀 로고, 실시간 경기 결과, 상세 통계
- **🏐 V-리그 배구**: 남자부/여자부, 대학리그 지원
- **⚽ EPL 축구**: 프리미어리그 경기 예측

### 🎮 핵심 기능
- **쇼핑카트 스타일 예측**: 여러 경기를 한 번에 선택하고 예측
- **실시간 데이터**: 네이버 스포츠 크롤링으로 최신 경기 정보 제공
- **팀 로고 & 컬러**: 각 팀의 공식 로고와 브랜드 컬러 지원
- **모바일 퍼스트**: 반응형 디자인으로 모든 기기에서 최적화

### 🎨 디자인
- **다크 테마**: 현대적이고 세련된 UI/UX
- **핑크/마젠타 브랜딩**: PPPlay만의 독특한 컬러 테마
- **직관적 인터페이스**: 사용하기 쉬운 예측 시스템

## 🛠️ 기술 스택

### Frontend
- **Next.js 15** - React 기반 풀스택 프레임워크
- **TypeScript** - 타입 안정성
- **Tailwind CSS** - 유틸리티 퍼스트 CSS 프레임워크
- **React Icons** - 아이콘 라이브러리

### Backend
- **Supabase** - BaaS (Backend as a Service)
  - 인증 (Authentication)
  - PostgreSQL 데이터베이스
  - 실시간 구독
  - 파일 스토리지

### 데이터 수집
- **Python** - 웹 크롤링
- **Selenium** - 동적 웹페이지 크롤링
- **BeautifulSoup** - HTML 파싱
- **Pandas** - 데이터 처리

## 🚀 시작하기

### 1. 프로젝트 클론
```bash
git clone https://github.com/NickyoungJ/PPPlay.git
cd PPPlay
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
`.env.local` 파일 생성:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어보세요.

## 📊 데이터베이스 구조

### 주요 테이블
- `games` - KBO 야구 경기 데이터
- `volleyball_games` - 배구 경기 데이터
- `soccer_games` - 축구 경기 데이터
- `KBO_teams` - KBO 팀 정보 (로고, 컬러 포함)
- `volleyball_teams` - 배구 팀 정보
- `soccer_teams` - 축구 팀 정보
- `predictions` - 사용자 예측 데이터

## 🕷️ 데이터 크롤링

### Python 크롤링 환경 설정
```bash
cd crawling
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 지원 크롤링
- **KBO 야구**: `naver_2025_0916_crawler.py`
- **V-리그 배구**: `naver_volleyball_crawler_final.py`
- **EPL 축구**: `naver_epl_crawler_fixed.py`

## 🎯 주요 페이지

- **`/`** - 랜딩 페이지 (서비스 소개)
- **`/games`** - 경기 예측 메인 페이지
  - 야구, 배구, 축구 탭
  - 날짜별 경기 필터링
  - 쇼핑카트 스타일 예측 시스템

## 🎨 UI/UX 특징

### 컬러 팔레트
- **Primary**: `#E91E63` (핑크/마젠타)
- **Secondary**: `#9C27B0` (퍼플)
- **Accent**: `#FF5722` (오렌지)
- **Background**: `#0F0F23` (다크 네이비)

### 반응형 디자인
- 모바일 퍼스트 접근법
- 태블릿, 데스크톱 최적화
- 터치 친화적 인터페이스

## 🔧 개발 도구

### 추천 VSCode 확장
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- TypeScript Importer
- Prettier - Code formatter

### 코드 품질
- ESLint 설정
- TypeScript strict 모드
- Prettier 코드 포맷팅

## 📈 성능 최적화

- **Next.js 15 Turbopack** - 빠른 번들링
- **이미지 최적화** - Next.js Image 컴포넌트
- **코드 분할** - 페이지별 자동 분할
- **Supabase 실시간** - 효율적인 데이터 동기화

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.

## 👨‍💻 개발자

- **NickyoungJ** - *Initial work* - [NickyoungJ](https://github.com/NickyoungJ)

---

## 🎉 PPPlay에서 스포츠 예측의 새로운 경험을 시작하세요!

**실시간 데이터 • 현대적 디자인 • 직관적 UX**