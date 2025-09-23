-- 배구 팀 정보 테이블 생성
-- V-리그 남자부/여자부 팀 정보 관리

-- volleyball_teams 테이블 생성
CREATE TABLE volleyball_teams (
    id SERIAL PRIMARY KEY,
    
    -- 팀 기본 정보
    name VARCHAR(100) NOT NULL UNIQUE, -- 팀명 (흥국생명, 현대건설 등)
    short_name VARCHAR(50), -- 축약명
    full_name VARCHAR(200), -- 정식 팀명
    english_name VARCHAR(200), -- 영문 팀명
    
    -- 리그 정보
    league_type VARCHAR(50) NOT NULL, -- 'men', 'women', 'university'
    division VARCHAR(50), -- '1부', '2부' 등
    
    -- 팀 이미지/색상
    logo_url TEXT, -- 팀 로고 URL
    primary_color VARCHAR(7), -- 대표 색상 (HEX)
    secondary_color VARCHAR(7), -- 보조 색상 (HEX)
    
    -- 팀 정보
    home_stadium VARCHAR(200), -- 홈 경기장
    founded_year INTEGER, -- 창단년도
    coach_name VARCHAR(100), -- 감독명
    
    -- 연락처 정보
    website VARCHAR(500), -- 공식 웹사이트
    social_media JSONB, -- SNS 정보 (JSON 형태)
    
    -- 상태
    is_active BOOLEAN DEFAULT true NOT NULL,
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_volleyball_teams_name ON volleyball_teams(name);
CREATE INDEX idx_volleyball_teams_league ON volleyball_teams(league_type);
CREATE INDEX idx_volleyball_teams_active ON volleyball_teams(is_active);

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_volleyball_teams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 업데이트 트리거 생성
CREATE TRIGGER trigger_update_volleyball_teams_updated_at
    BEFORE UPDATE ON volleyball_teams
    FOR EACH ROW
    EXECUTE FUNCTION update_volleyball_teams_updated_at();

-- RLS 정책 설정
ALTER TABLE volleyball_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view volleyball teams" ON volleyball_teams
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage volleyball teams" ON volleyball_teams
    FOR ALL USING (auth.role() = 'authenticated');

-- V-리그 여자부 팀 데이터 삽입 (크롤링에서 발견된 팀들)
INSERT INTO volleyball_teams (
    name, short_name, league_type, primary_color, is_active
) VALUES 
('흥국생명', '흥국생명', 'women', '#FF6B6B', true),
('페퍼저축은행', '페퍼저축은행', 'women', '#4ECDC4', true),
('현대건설', '현대건설', 'women', '#45B7D1', true),
('GS칼텍스', 'GS칼텍스', 'women', '#96CEB4', true),
('한국도로공사', '도로공사', 'women', '#FFEAA7', true),
('IBK기업은행', 'IBK기업은행', 'women', '#DDA0DD', true),
('정관장', '정관장', 'women', '#98D8C8', true);

-- V-리그 남자부 주요 팀들도 추가
INSERT INTO volleyball_teams (
    name, short_name, league_type, primary_color, is_active
) VALUES 
('대한항공', '대한항공', 'men', '#0066CC', true),
('삼성화재', '삼성화재', 'men', '#1E90FF', true),
('한국전력', '한국전력', 'men', '#FFD700', true),
('현대캐피탈', '현대캐피탈', 'men', '#32CD32', true),
('KB손해보험', 'KB손해보험', 'men', '#FF4500', true),
('우리카드', '우리카드', 'men', '#8A2BE2', true),
('OK금융그룹', 'OK금융그룹', 'men', '#20B2AA', true);

-- volleyball_games 테이블과 연결하기 위한 외래키 추가
ALTER TABLE volleyball_games 
ADD COLUMN home_team_id INTEGER REFERENCES volleyball_teams(id),
ADD COLUMN away_team_id INTEGER REFERENCES volleyball_teams(id);

-- 기존 데이터의 팀 ID 업데이트
UPDATE volleyball_games 
SET home_team_id = vt.id 
FROM volleyball_teams vt 
WHERE volleyball_games.home_team = vt.name;

UPDATE volleyball_games 
SET away_team_id = vt.id 
FROM volleyball_teams vt 
WHERE volleyball_games.away_team = vt.name;

-- 팀 정보와 함께 경기 조회하는 뷰 생성
CREATE VIEW volleyball_games_with_teams AS
SELECT 
    vg.*,
    ht.name as home_team_name,
    ht.short_name as home_team_short,
    ht.logo_url as home_team_logo,
    ht.primary_color as home_team_color,
    at.name as away_team_name,
    at.short_name as away_team_short,
    at.logo_url as away_team_logo,
    at.primary_color as away_team_color
FROM volleyball_games vg
LEFT JOIN volleyball_teams ht ON vg.home_team_id = ht.id
LEFT JOIN volleyball_teams at ON vg.away_team_id = at.id;

-- 생성된 데이터 확인
SELECT * FROM volleyball_teams ORDER BY league_type, name;
SELECT * FROM volleyball_games_with_teams ORDER BY start_time;
