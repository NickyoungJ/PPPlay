-- 축구 경기 전용 테이블 생성
-- EPL, MLS, Primera 등 다양한 리그 지원

-- 기존 soccer_games 테이블이 있다면 삭제 (주의: 데이터 손실)
-- DROP TABLE IF EXISTS soccer_games;

-- soccer_games 테이블 생성
CREATE TABLE soccer_games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 팀 정보
    home_team VARCHAR(100) NOT NULL,
    away_team VARCHAR(100) NOT NULL,
    
    -- 경기 시간
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- 점수 정보
    home_score INTEGER,
    away_score INTEGER,
    
    -- 경기 결과
    result VARCHAR(20) CHECK (result IN ('home_win', 'away_win', 'draw')),
    
    -- 경기 상태
    is_closed BOOLEAN DEFAULT false NOT NULL,
    
    -- 스포츠 정보
    sport_id INTEGER DEFAULT 2 NOT NULL, -- 축구 ID
    sport_name VARCHAR(50) DEFAULT 'soccer' NOT NULL,
    
    -- 경기장 정보
    stadium VARCHAR(200),
    
    -- 리그 정보
    league_name VARCHAR(100) NOT NULL, -- 'EPL', 'MLS', 'Primera Liga' 등
    league_type VARCHAR(50) NOT NULL,  -- 'epl', 'mls', 'primera' 등
    
    -- 추가 경기 정보
    round_info VARCHAR(100), -- '32라운드', '플레이오프' 등
    match_status VARCHAR(50), -- '종료', '전반전', 'LIVE' 등
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 크롤링 정보
    crawled_from VARCHAR(200) DEFAULT 'naver_sports',
    crawled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_soccer_games_start_time ON soccer_games(start_time);
CREATE INDEX idx_soccer_games_teams ON soccer_games(home_team, away_team);
CREATE INDEX idx_soccer_games_league ON soccer_games(league_name, league_type);
CREATE INDEX idx_soccer_games_status ON soccer_games(is_closed);

-- 날짜별 쿼리를 위한 부분 인덱스
CREATE INDEX idx_soccer_games_date_range ON soccer_games(start_time) 
WHERE start_time >= '2025-01-01' AND start_time < '2026-01-01';

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_soccer_games_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 업데이트 트리거 생성
CREATE TRIGGER trigger_update_soccer_games_updated_at
    BEFORE UPDATE ON soccer_games
    FOR EACH ROW
    EXECUTE FUNCTION update_soccer_games_updated_at();

-- RLS (Row Level Security) 정책 설정 (배구에서 비활성화했으므로 여기서도 비활성화)
-- ALTER TABLE soccer_games ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽을 수 있도록 설정
-- CREATE POLICY "Anyone can view soccer games" ON soccer_games
--     FOR SELECT USING (true);

-- 인증된 사용자만 삽입/업데이트/삭제 가능
-- CREATE POLICY "Authenticated users can insert soccer games" ON soccer_games
--     FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- CREATE POLICY "Authenticated users can update soccer games" ON soccer_games
--     FOR UPDATE USING (auth.role() = 'authenticated');

-- CREATE POLICY "Authenticated users can delete soccer games" ON soccer_games
--     FOR DELETE USING (auth.role() = 'authenticated');

-- 테이블 정보 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'soccer_games' 
ORDER BY ordinal_position;

COMMENT ON TABLE soccer_games IS '축구 경기 정보 테이블 - EPL, MLS, Primera 등 다양한 리그 지원';
COMMENT ON COLUMN soccer_games.home_score IS '홈팀 득점';
COMMENT ON COLUMN soccer_games.away_score IS '원정팀 득점';
COMMENT ON COLUMN soccer_games.league_type IS 'epl: EPL, mls: MLS, primera: Primera Liga 등';
COMMENT ON COLUMN soccer_games.match_status IS '경기 상태: 종료, 전반전, 후반전, LIVE 등';
