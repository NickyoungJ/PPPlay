-- 9월 24일~26일 배구 경기 데이터 삽입 SQL
-- Supabase SQL Editor에서 직접 실행하세요

-- 기존 RLS 정책 임시 비활성화 (관리자만 가능)
-- ALTER TABLE volleyball_games DISABLE ROW LEVEL SECURITY;

-- 배구 경기 데이터 삽입
INSERT INTO volleyball_games (
    home_team, away_team, start_time, 
    league_name, league_type, round_info, 
    match_status, is_closed, sport_id, sport_name,
    crawled_from, crawled_at
) VALUES 
-- 9월 24일 (화요일) 경기
('IBK기업은행', '한국도로공사', '2025-09-24T19:00:00+09:00', 'V-리그 여자부', 'women', 'V-리그 정규시즌', '예정', false, 4, 'volleyball', 'naver_sports', NOW()),
('홍익대', '중부대', '2025-09-24T14:00:00+09:00', '대학 배구', 'university', '대학 리그', '예정', false, 4, 'volleyball', 'naver_sports', NOW()),
('인하대', '한양대', '2025-09-24T14:00:00+09:00', '대학 배구', 'university', '대학 리그', '예정', false, 4, 'volleyball', 'naver_sports', NOW()),

-- 9월 25일 (수요일) 경기
('페퍼저축은행', '현대건설', '2025-09-25T15:30:00+09:00', 'V-리그 여자부', 'women', 'V-리그 정규시즌', '예정', false, 4, 'volleyball', 'naver_sports', NOW()),
('GS칼텍스', '흥국생명', '2025-09-25T19:00:00+09:00', 'V-리그 여자부', 'women', 'V-리그 정규시즌', '예정', false, 4, 'volleyball', 'naver_sports', NOW()),

-- 9월 26일 (목요일) 경기
('정관장', '한국도로공사', '2025-09-26T19:00:00+09:00', 'V-리그 여자부', 'women', 'V-리그 정규시즌', '예정', false, 4, 'volleyball', 'naver_sports', NOW()),
('경기대', '성균관대', '2025-09-26T14:00:00+09:00', '대학 배구', 'university', '대학 리그', '예정', false, 4, 'volleyball', 'naver_sports', NOW());

-- RLS 정책 다시 활성화 (관리자만 가능)
-- ALTER TABLE volleyball_games ENABLE ROW LEVEL SECURITY;

-- 삽입된 데이터 확인
SELECT 
    id,
    home_team,
    away_team,
    start_time,
    league_name,
    league_type,
    match_status,
    created_at
FROM volleyball_games 
WHERE DATE(start_time) BETWEEN '2025-09-24' AND '2025-09-26'
ORDER BY start_time;

-- 삽입 결과 요약
SELECT 
    DATE(start_time) as game_date,
    COUNT(*) as game_count,
    league_type
FROM volleyball_games 
WHERE DATE(start_time) BETWEEN '2025-09-24' AND '2025-09-26'
GROUP BY DATE(start_time), league_type
ORDER BY game_date, league_type;
