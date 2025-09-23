import { useState } from 'react';
import { NextPage } from 'next';

interface KBOGame {
  date: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  stadium: string;
  status: string;
  homeScore?: number;
  awayScore?: number;
  result?: '1' | '0' | '2';
}

interface CrawlResponse {
  success: boolean;
  date: string;
  games: KBOGame[];
  total: number;
  error?: string;
}

const TestCrawling: NextPage = () => {
  const [date, setDate] = useState('2025-08-31');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CrawlResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCrawl = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/crawl/kbo?date=${date}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '크롤링 실패');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  };

  const getResultText = (result?: '1' | '0' | '2') => {
    switch (result) {
      case '1': return '홈팀 승';
      case '2': return '원정팀 승';
      case '0': return '무승부';
      default: return '-';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '종료': return 'text-green-600';
      case '진행중': return 'text-blue-600';
      case '예정': return 'text-gray-600';
      case '연기': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">KBO 일정 크롤링 테스트</h1>

      <div className="mb-6 p-4 bg-white rounded-lg shadow">
        <div className="flex gap-4 items-end">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              날짜 선택
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleCrawl}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? '크롤링 중...' : '크롤링 시작'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          <strong>오류:</strong> {error}
        </div>
      )}

      {result && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              {result.date} KBO 경기 일정 ({result.total}경기)
            </h2>
          </div>
          
          {result.games.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              해당 날짜에 경기가 없습니다.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {result.games.map((game, index) => (
                <div key={index} className="px-6 py-4">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <span className="text-sm text-gray-500">{game.time}</span>
                        <span className={`text-sm font-medium ${getStatusColor(game.status)}`}>
                          {game.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-8">
                        <div className="text-center">
                          <div className="font-medium text-gray-900">{game.awayTeam}</div>
                          <div className="text-sm text-gray-500">원정</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">
                            {game.awayScore !== undefined ? game.awayScore : '-'}
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-lg font-medium text-gray-600">VS</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">
                            {game.homeScore !== undefined ? game.homeScore : '-'}
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="font-medium text-gray-900">{game.homeTeam}</div>
                          <div className="text-sm text-gray-500">홈</div>
                        </div>
                      </div>
                      
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                        <span>📍 {game.stadium}</span>
                        {game.result && (
                          <span className="font-medium text-blue-600">
                            결과: {getResultText(game.result)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">사용법:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>1. 원하는 날짜를 선택하세요 (예: 2025-08-31)</li>
          <li>2. "크롤링 시작" 버튼을 클릭하세요</li>
          <li>3. 네이버 스포츠에서 해당 날짜의 KBO 경기 정보를 가져옵니다</li>
          <li>4. 경기 결과가 있는 경우 점수와 승부 결과도 표시됩니다</li>
        </ul>
      </div>
    </div>
  );
};

export default TestCrawling;

