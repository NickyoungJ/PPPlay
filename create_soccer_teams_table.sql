-- 축구 팀 정보 테이블 생성
-- EPL, MLS, Primera Liga 등 다양한 리그 팀 정보 저장

-- 기존 soccer_teams 테이블이 있다면 삭제 (주의: 데이터 손실)
-- DROP TABLE IF EXISTS soccer_teams;

-- soccer_teams 테이블 생성
CREATE TABLE soccer_teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    
    -- 리그 정보
    league_name VARCHAR(100) NOT NULL, -- 'EPL', 'MLS', 'Primera Liga'
    league_type VARCHAR(50) NOT NULL,  -- 'epl', 'mls', 'primera'
    
    -- 팀 정보
    full_name VARCHAR(200),
    short_name VARCHAR(50),
    nickname VARCHAR(100),
    
    -- 시각적 정보
    logo_url TEXT,
    primary_color VARCHAR(7),   -- HEX 색상 코드
    secondary_color VARCHAR(7), -- HEX 색상 코드
    
    -- 위치 정보
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'England',
    home_stadium VARCHAR(200),
    
    -- 팀 상세 정보
    founded_year INTEGER,
    manager VARCHAR(100),
    
    -- 상태 정보
    is_active BOOLEAN DEFAULT true,
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_soccer_teams_name ON soccer_teams(name);
CREATE INDEX idx_soccer_teams_league ON soccer_teams(league_name, league_type);
CREATE INDEX idx_soccer_teams_active ON soccer_teams(is_active);

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_soccer_teams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 업데이트 트리거 생성
CREATE TRIGGER trigger_update_soccer_teams_updated_at
    BEFORE UPDATE ON soccer_teams
    FOR EACH ROW
    EXECUTE FUNCTION update_soccer_teams_updated_at();

-- EPL 팀 데이터 삽입 (크롤링된 팀명 기준)
INSERT INTO soccer_teams (
    name, league_name, league_type, full_name, short_name, 
    city, country, primary_color, secondary_color, is_active
) VALUES 
-- 빅6 클럽
('맨시티', 'EPL', 'epl', 'Manchester City', 'Man City', 'Manchester', 'England', '#6CABDD', '#1C2C5B', true),
('맨유', 'EPL', 'epl', 'Manchester United', 'Man Utd', 'Manchester', 'England', '#DA020E', '#FBE122', true),
('리버풀', 'EPL', 'epl', 'Liverpool', 'Liverpool', 'Liverpool', 'England', '#C8102E', '#00B2A9', true),
('첼시', 'EPL', 'epl', 'Chelsea', 'Chelsea', 'London', 'England', '#034694', '#6A7FDB', true),
('아스널', 'EPL', 'epl', 'Arsenal', 'Arsenal', 'London', 'England', '#EF0107', '#023474', true),
('토트넘', 'EPL', 'epl', 'Tottenham Hotspur', 'Spurs', 'London', 'England', '#132257', '#FFFFFF', true),

-- 런던 클럽들
('웨스트햄', 'EPL', 'epl', 'West Ham United', 'West Ham', 'London', 'England', '#7A263A', '#1BB1E7', true),
('브렌트퍼드', 'EPL', 'epl', 'Brentford', 'Brentford', 'London', 'England', '#E30613', '#FFD100', true),
('풀럼', 'EPL', 'epl', 'Fulham', 'Fulham', 'London', 'England', '#000000', '#FFFFFF', true),
('팰리스', 'EPL', 'epl', 'Crystal Palace', 'Palace', 'London', 'England', '#1B458F', '#A7A5A6', true),

-- 기타 프리미어리그 팀들
('뉴캐슬', 'EPL', 'epl', 'Newcastle United', 'Newcastle', 'Newcastle', 'England', '#241F20', '#FFFFFF', true),
('애스턴 빌라', 'EPL', 'epl', 'Aston Villa', 'Villa', 'Birmingham', 'England', '#95BFE5', '#670E36', true),
('에버턴', 'EPL', 'epl', 'Everton', 'Everton', 'Liverpool', 'England', '#003399', '#FFFFFF', true),
('브라이턴', 'EPL', 'epl', 'Brighton & Hove Albion', 'Brighton', 'Brighton', 'England', '#0057B8', '#FFCD00', true),
('본머스', 'EPL', 'epl', 'AFC Bournemouth', 'Bournemouth', 'Bournemouth', 'England', '#DA020E', '#000000', true),
('울버햄튼', 'EPL', 'epl', 'Wolverhampton Wanderers', 'Wolves', 'Wolverhampton', 'England', '#FDB913', '#231F20', true),
('노팅엄', 'EPL', 'epl', 'Nottingham Forest', 'Forest', 'Nottingham', 'England', '#DD0000', '#FFFFFF', true),
('번리', 'EPL', 'epl', 'Burnley', 'Burnley', 'Burnley', 'England', '#6C1D45', '#99D6EA', true),
('리즈', 'EPL', 'epl', 'Leeds United', 'Leeds', 'Leeds', 'England', '#FFFFFF', '#1D428A', true),
('선덜랜드', 'EPL', 'epl', 'Sunderland', 'Sunderland', 'Sunderland', 'England', '#EB172B', '#211E1F', true);

-- 삽입된 데이터 확인
SELECT 
    id,
    name,
    league_name,
    league_type,
    full_name,
    city,
    primary_color,
    is_active
FROM soccer_teams 
WHERE league_type = 'epl'
ORDER BY name;

-- 팀 수 확인
SELECT 
    league_name,
    league_type,
    COUNT(*) as team_count
FROM soccer_teams 
GROUP BY league_name, league_type
ORDER BY league_name;

COMMENT ON TABLE soccer_teams IS '축구 팀 정보 테이블 - EPL, MLS, Primera Liga 등 다양한 리그 팀 정보';
COMMENT ON COLUMN soccer_teams.league_type IS 'epl: EPL, mls: MLS, primera: Primera Liga 등';
COMMENT ON COLUMN soccer_teams.primary_color IS '팀 메인 컬러 (HEX 코드)';
COMMENT ON COLUMN soccer_teams.secondary_color IS '팀 서브 컬러 (HEX 코드)';
