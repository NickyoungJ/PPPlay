-- 배구 경기 전용 테이블 생성
-- 크롤링 결과 구조에 맞춰 설계

-- 기존 volleyball_games 테이블이 있다면 삭제 (주의: 데이터 손실)
-- DROP TABLE IF EXISTS volleyball_games;

-- volleyball_games 테이블 생성
CREATE TABLE volleyball_games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 팀 정보
    home_team VARCHAR(100) NOT NULL,
    away_team VARCHAR(100) NOT NULL,
    
    -- 경기 시간
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- 점수 정보 (배구는 세트 스코어)
    home_score INTEGER,
    away_score INTEGER,
    
    -- 경기 결과
    result VARCHAR(20) CHECK (result IN ('home_win', 'away_win', 'draw')),
    
    -- 경기 상태
    is_closed BOOLEAN DEFAULT false NOT NULL,
    
    -- 스포츠 정보
    sport_id INTEGER DEFAULT 4 NOT NULL, -- 배구 ID
    sport_name VARCHAR(50) DEFAULT 'volleyball' NOT NULL,
    
    -- 경기장 정보
    stadium VARCHAR(200),
    
    -- 리그 정보 (V-리그 남자부/여자부 구분)
    league_name VARCHAR(100),
    league_type VARCHAR(50), -- 'men', 'women', 'university' 등
    
    -- 추가 경기 정보
    round_info VARCHAR(100), -- '컵대회 조별리그 A조' 등
    match_status VARCHAR(50), -- '종료', '2세트', 'LIVE' 등
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 크롤링 정보
    crawled_from VARCHAR(200) DEFAULT 'naver_sports',
    crawled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_volleyball_games_start_time ON volleyball_games(start_time);
CREATE INDEX idx_volleyball_games_teams ON volleyball_games(home_team, away_team);
CREATE INDEX idx_volleyball_games_league ON volleyball_games(league_name, league_type);
CREATE INDEX idx_volleyball_games_status ON volleyball_games(is_closed);
-- DATE 함수 대신 날짜 범위로 쿼리하는 것을 권장하므로 해당 인덱스 제거
-- CREATE INDEX idx_volleyball_games_date ON volleyball_games(DATE(start_time));

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_volleyball_games_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 업데이트 트리거 생성
CREATE TRIGGER trigger_update_volleyball_games_updated_at
    BEFORE UPDATE ON volleyball_games
    FOR EACH ROW
    EXECUTE FUNCTION update_volleyball_games_updated_at();

-- RLS (Row Level Security) 정책 설정
ALTER TABLE volleyball_games ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽을 수 있도록 설정
CREATE POLICY "Anyone can view volleyball games" ON volleyball_games
    FOR SELECT USING (true);

-- 인증된 사용자만 삽입/업데이트/삭제 가능
CREATE POLICY "Authenticated users can insert volleyball games" ON volleyball_games
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update volleyball games" ON volleyball_games
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete volleyball games" ON volleyball_games
    FOR DELETE USING (auth.role() = 'authenticated');

-- 샘플 데이터 삽입 (크롤링된 2025-09-23 데이터)
INSERT INTO volleyball_games (
    home_team, away_team, start_time, home_score, away_score, 
    result, is_closed, league_name, league_type, round_info, match_status
) VALUES 
(
    '흥국생명', 
    '페퍼저축은행', 
    '2025-09-23T15:30:00+09:00', 
    3, 
    1, 
    'home_win', 
    true,
    'V-리그 여자부',
    'women',
    '컵대회 조별리그 A조',
    '종료'
),
(
    '현대건설', 
    'GS칼텍스', 
    '2025-09-23T19:00:00+09:00', 
    1, 
    0, 
    'home_win', 
    false,
    'V-리그 여자부',
    'women', 
    '컵대회 조별리그 A조',
    '2세트'
);

-- 테이블 정보 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'volleyball_games' 
ORDER BY ordinal_position;

-- 생성된 데이터 확인
SELECT * FROM volleyball_games ORDER BY start_time;
