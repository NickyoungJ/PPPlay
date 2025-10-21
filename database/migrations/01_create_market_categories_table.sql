-- 마켓 카테고리 테이블 생성
-- 정치, 경제, 연예, 스포츠 등 카테고리 관리

CREATE TABLE market_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    icon VARCHAR(50), -- 아이콘 (emoji 또는 icon name)
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_market_categories_slug ON market_categories(slug);
CREATE INDEX idx_market_categories_active ON market_categories(is_active);
CREATE INDEX idx_market_categories_order ON market_categories(display_order);

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_market_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 업데이트 트리거 생성
CREATE TRIGGER trigger_update_market_categories_updated_at
    BEFORE UPDATE ON market_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_market_categories_updated_at();

-- 초기 카테고리 데이터 삽입
INSERT INTO market_categories (name, slug, icon, description, display_order) VALUES
    ('전체', 'all', '🌟', '모든 마켓 보기', 0),
    ('스포츠', 'sports', '⚽', '스포츠 경기 예측', 1),
    ('정치', 'politics', '🏛️', '정치 이슈 예측', 2),
    ('경제', 'economy', '💰', '경제/금융 이슈 예측', 3),
    ('연예', 'entertainment', '🎬', '연예/문화 이슈 예측', 4),
    ('사회', 'society', '🌐', '사회 이슈 예측', 5),
    ('IT/기술', 'tech', '💻', 'IT/기술 트렌드 예측', 6);

-- 코멘트 추가
COMMENT ON TABLE market_categories IS '마켓 카테고리 (정치/경제/연예/스포츠 등)';
COMMENT ON COLUMN market_categories.slug IS 'URL friendly 식별자';
COMMENT ON COLUMN market_categories.display_order IS '화면 표시 순서 (낮을수록 앞)';

