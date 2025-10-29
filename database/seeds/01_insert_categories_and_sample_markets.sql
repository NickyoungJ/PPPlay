-- 카테고리 데이터 삽입
-- 정치, 경제, 연예, 스포츠, 사회, 기술

INSERT INTO market_categories (name, slug, description, icon, display_order) VALUES
('정치', 'politics', '국내외 정치 이슈에 대한 예측', '🏛️', 1),
('경제', 'economy', '경제 지표, 주가, 환율 등 경제 관련 예측', '💼', 2),
('연예', 'entertainment', '영화, 드라마, 음악 등 연예계 이슈 예측', '🎭', 3),
('스포츠', 'sports', '스포츠 경기 결과 및 선수 기록 예측', '⚽', 4),
('사회', 'society', '사회 이슈, 트렌드, 날씨 등 일상 예측', '🌍', 5),
('기술', 'tech', 'IT, 과학기술, 신제품 출시 등 기술 관련 예측', '🔬', 6)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    display_order = EXCLUDED.display_order;

-- 샘플 마켓 데이터 (각 카테고리별 1개씩)

-- 1. 정치 카테고리
INSERT INTO markets (
    market_type, 
    title, 
    description, 
    category_slug,
    option_yes,
    option_no,
    closes_at,
    status,
    min_points,
    max_points,
    yes_price,
    no_price,
    created_at
) VALUES (
    'general',
    '2025년 상반기 내 전기차 보조금이 증액될까?',
    '정부의 전기차 보조금 정책 변화를 예측해보세요. 2025년 6월 30일까지 전기차 구매 보조금이 현재 대비 증액되면 YES, 그렇지 않으면 NO입니다.',
    'politics',
    '증액된다',
    '증액되지 않는다',
    '2025-06-30 23:59:59+09',
    'active',
    10,
    1000,
    45,  -- YES 초기 가격 45P (45% 확률)
    55,  -- NO 초기 가격 55P (55% 확률)
    NOW()
);

-- 2. 경제 카테고리
INSERT INTO markets (
    market_type, 
    title, 
    description, 
    category_slug,
    option_yes,
    option_no,
    closes_at,
    status,
    min_points,
    max_points,
    yes_price,
    no_price,
    created_at
) VALUES (
    'general',
    '비트코인이 2025년 말까지 $150,000를 돌파할까?',
    '비트코인(BTC)의 연말 가격을 예측해보세요. 2025년 12월 31일 23시 59분(UTC) 기준으로 $150,000 이상이면 YES입니다.',
    'economy',
    '돌파한다',
    '돌파하지 못한다',
    '2025-12-31 23:59:59+09',
    'active',
    10,
    1000,
    38,  -- YES 초기 가격 38P
    62,  -- NO 초기 가격 62P
    NOW()
);

-- 3. 연예 카테고리
INSERT INTO markets (
    market_type, 
    title, 
    description, 
    category_slug,
    option_yes,
    option_no,
    closes_at,
    status,
    min_points,
    max_points,
    yes_price,
    no_price,
    created_at
) VALUES (
    'general',
    '아이유의 신곡이 발매 후 1주일 내 멜론 1위를 차지할까?',
    '아이유의 다음 신곡(싱글/앨범 타이틀)이 발매일로부터 7일 이내에 멜론 일간차트 1위를 달성하면 YES입니다.',
    'entertainment',
    '1위 달성',
    '1위 미달성',
    '2025-12-31 23:59:59+09',
    'active',
    10,
    1000,
    72,  -- YES 초기 가격 72P (높은 확률)
    28,  -- NO 초기 가격 28P
    NOW()
);

-- 4. 스포츠 카테고리
INSERT INTO markets (
    market_type, 
    title, 
    description, 
    category_slug,
    option_yes,
    option_no,
    closes_at,
    status,
    min_points,
    max_points,
    yes_price,
    no_price,
    created_at
) VALUES (
    'general',
    '손흥민이 2024-25 시즌 EPL에서 20골 이상을 기록할까?',
    '손흥민 선수가 2024-25 EPL 시즌(리그 경기만)에서 20골 이상을 득점하면 YES입니다. 어시스트는 포함되지 않습니다.',
    'sports',
    '20골 이상',
    '20골 미만',
    '2025-05-25 23:59:59+09',
    'active',
    10,
    1000,
    42,  -- YES 초기 가격 42P
    58,  -- NO 초기 가격 58P
    NOW()
);

-- 5. 사회 카테고리
INSERT INTO markets (
    market_type, 
    title, 
    description, 
    category_slug,
    option_yes,
    option_no,
    closes_at,
    status,
    min_points,
    max_points,
    yes_price,
    no_price,
    created_at
) VALUES (
    'general',
    '2025년 여름, 서울에 폭염특보가 30일 이상 발령될까?',
    '2025년 6월 1일부터 8월 31일까지 서울에 폭염주의보 또는 폭염경보가 총 30일 이상 발령되면 YES입니다.',
    'society',
    '30일 이상',
    '30일 미만',
    '2025-08-31 23:59:59+09',
    'active',
    10,
    1000,
    55,  -- YES 초기 가격 55P
    45,  -- NO 초기 가격 45P
    NOW()
);

-- 6. 기술 카테고리
INSERT INTO markets (
    market_type, 
    title, 
    description, 
    category_slug,
    option_yes,
    option_no,
    closes_at,
    status,
    min_points,
    max_points,
    yes_price,
    no_price,
    created_at
) VALUES (
    'general',
    'OpenAI가 2025년 내에 GPT-5를 공식 출시할까?',
    'OpenAI가 2025년 12월 31일까지 GPT-5 또는 이에 준하는 차세대 모델을 공식 발표 및 출시하면 YES입니다.',
    'tech',
    '출시한다',
    '출시하지 않는다',
    '2025-12-31 23:59:59+09',
    'active',
    10,
    1000,
    63,  -- YES 초기 가격 63P
    37,  -- NO 초기 가격 37P
    NOW()
);

-- 마켓 통계 초기화 (0으로 시작)
UPDATE markets 
SET total_participants = 0,
    yes_count = 0,
    no_count = 0,
    total_points_pool = 0
WHERE status = 'active';

-- 확인용 쿼리
SELECT 
    m.id,
    m.title,
    m.category_slug,
    mc.name as category_name,
    mc.icon,
    m.yes_price,
    m.no_price,
    m.status,
    m.closes_at
FROM markets m
JOIN market_categories mc ON m.category_slug = mc.slug
WHERE m.status = 'active'
ORDER BY mc.display_order;


