-- 통합 마켓 테이블 생성
-- 스포츠 마켓(기존 경기 연결) + 일반 마켓(사용자 생성) 통합 관리

CREATE TABLE markets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 마켓 타입 구분
    market_type VARCHAR(20) NOT NULL CHECK (market_type IN ('sports', 'general')),
    
    -- 스포츠 마켓인 경우 기존 경기와 연결
    game_id UUID, -- games 테이블 참조 (market_type='sports'일 때만 사용)
    sport_type VARCHAR(50), -- 'baseball', 'soccer', 'volleyball' 등
    
    -- 마켓 기본 정보
    title VARCHAR(200) NOT NULL,
    description TEXT,
    image_url TEXT, -- 마켓 대표 이미지
    
    -- 카테고리
    category_id INTEGER REFERENCES market_categories(id),
    category_slug VARCHAR(50), -- 'politics', 'economy', 'entertainment', 'sports'
    
    -- 마켓 상태
    status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'approved', 'active', 'closed', 'cancelled')),
    
    -- 예측 옵션
    option_yes VARCHAR(100) NOT NULL, -- 일반: "Yes", 스포츠: "홈팀명"
    option_no VARCHAR(100) NOT NULL,  -- 일반: "No", 스포츠: "원정팀명"
    
    -- 참여 현황
    total_participants INTEGER DEFAULT 0,
    total_points_pool INTEGER DEFAULT 0,
    yes_count INTEGER DEFAULT 0,
    no_count INTEGER DEFAULT 0,
    yes_points INTEGER DEFAULT 0,
    no_points INTEGER DEFAULT 0,
    
    -- 결과
    result VARCHAR(10) CHECK (result IN ('yes', 'no', 'cancelled')),
    result_confirmed_at TIMESTAMP WITH TIME ZONE,
    result_confirmed_by UUID, -- auth.users 참조
    result_description TEXT, -- 결과 상세 설명
    
    -- 마감 정보
    closes_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_closed BOOLEAN DEFAULT false,
    
    -- 생성자 정보 (일반 마켓만)
    creator_id UUID, -- auth.users 참조
    creator_reward INTEGER DEFAULT 0, -- 개설자 보너스 포인트
    
    -- 최소 참여 포인트
    min_points INTEGER DEFAULT 10,
    max_points INTEGER DEFAULT 1000,
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 조회수/인기도
    view_count INTEGER DEFAULT 0,
    prediction_count INTEGER DEFAULT 0
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_markets_type ON markets(market_type);
CREATE INDEX idx_markets_category ON markets(category_slug);
CREATE INDEX idx_markets_status ON markets(status);
CREATE INDEX idx_markets_closes_at ON markets(closes_at);
CREATE INDEX idx_markets_is_closed ON markets(is_closed);
CREATE INDEX idx_markets_game_id ON markets(game_id) WHERE market_type = 'sports';
CREATE INDEX idx_markets_creator ON markets(creator_id) WHERE market_type = 'general';
CREATE INDEX idx_markets_created_at ON markets(created_at DESC);
CREATE INDEX idx_markets_popularity ON markets(prediction_count DESC);

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_markets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 업데이트 트리거 생성
CREATE TRIGGER trigger_update_markets_updated_at
    BEFORE UPDATE ON markets
    FOR EACH ROW
    EXECUTE FUNCTION update_markets_updated_at();

-- 자동 마감 처리 함수
CREATE OR REPLACE FUNCTION auto_close_expired_markets()
RETURNS void AS $$
BEGIN
    UPDATE markets
    SET is_closed = true,
        status = 'closed'
    WHERE closes_at < NOW()
      AND is_closed = false
      AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- 코멘트 추가
COMMENT ON TABLE markets IS '통합 마켓 테이블 (스포츠 + 일반 이슈)';
COMMENT ON COLUMN markets.market_type IS '마켓 타입: sports(스포츠 경기), general(사용자 생성)';
COMMENT ON COLUMN markets.game_id IS '스포츠 마켓일 경우 games 테이블 외래키';
COMMENT ON COLUMN markets.status IS '마켓 상태: pending(검수중), approved(승인), active(진행중), closed(종료), cancelled(취소)';
COMMENT ON COLUMN markets.option_yes IS 'Yes 옵션 또는 홈팀명';
COMMENT ON COLUMN markets.option_no IS 'No 옵션 또는 원정팀명';

