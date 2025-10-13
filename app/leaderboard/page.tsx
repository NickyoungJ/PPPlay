import Link from 'next/link';

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link href="/" className="text-pink-400 hover:text-pink-300 mb-4 inline-block">
              ← 메인으로 돌아가기
            </Link>
            <h1 className="text-3xl font-bold text-white mb-2">리더보드</h1>
            <p className="text-gray-400">최고의 예측 전문가들을 만나보세요</p>
          </div>

          <div className="space-y-6">
            {/* 전체 랭킹 */}
            <section className="bg-slate-800/50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                🏆 전체 랭킹
                <span className="ml-2 text-sm text-gray-400">(이번 주)</span>
              </h2>
              
              <div className="space-y-4">
                {/* 1위 */}
                <div className="flex items-center p-4 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 rounded-lg border border-yellow-500/30">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center font-bold text-black">
                      1
                    </div>
                    <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                      👑
                    </div>
                    <div>
                      <p className="font-semibold text-white">예측왕</p>
                      <p className="text-sm text-gray-400">정확도: 87.5%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-yellow-400">2,450 pts</p>
                    <p className="text-sm text-gray-400">25승 3패</p>
                  </div>
                </div>

                {/* 2위 */}
                <div className="flex items-center p-4 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center font-bold text-black">
                      2
                    </div>
                    <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                      🥈
                    </div>
                    <div>
                      <p className="font-semibold text-white">스포츠매니아</p>
                      <p className="text-sm text-gray-400">정확도: 82.1%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-300">2,180 pts</p>
                    <p className="text-sm text-gray-400">23승 5패</p>
                  </div>
                </div>

                {/* 3위 */}
                <div className="flex items-center p-4 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center font-bold text-white">
                      3
                    </div>
                    <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                      🥉
                    </div>
                    <div>
                      <p className="font-semibold text-white">야구사랑</p>
                      <p className="text-sm text-gray-400">정확도: 79.3%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-amber-400">1,950 pts</p>
                    <p className="text-sm text-gray-400">19승 5패</p>
                  </div>
                </div>

                {/* 4-10위 */}
                {[
                  { rank: 4, name: '축구광', accuracy: '76.8%', points: '1,720', record: '18승 7패' },
                  { rank: 5, name: '배구마스터', accuracy: '74.2%', points: '1,580', record: '17승 8패' },
                  { rank: 6, name: '승부사', accuracy: '71.9%', points: '1,420', record: '16승 9패' },
                  { rank: 7, name: '예측고수', accuracy: '69.5%', points: '1,280', record: '15승 10패' },
                  { rank: 8, name: '스포츠팬', accuracy: '67.1%', points: '1,150', record: '14승 11패' },
                  { rank: 9, name: '분석가', accuracy: '64.8%', points: '1,020', record: '13승 12패' },
                  { rank: 10, name: '도전자', accuracy: '62.4%', points: '890', record: '12승 13패' },
                ].map((user) => (
                  <div key={user.rank} className="flex items-center p-4 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center font-bold text-white">
                        {user.rank}
                      </div>
                      <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                        👤
                      </div>
                      <div>
                        <p className="font-semibold text-white">{user.name}</p>
                        <p className="text-sm text-gray-400">정확도: {user.accuracy}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-300">{user.points} pts</p>
                      <p className="text-sm text-gray-400">{user.record}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 스포츠별 랭킹 */}
            <section className="bg-slate-800/50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-6">🏅 스포츠별 TOP 3</h2>
              
              <div className="grid md:grid-cols-3 gap-6">
                {/* 야구 */}
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-4 flex items-center">
                    ⚾ 야구 (KBO)
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-yellow-400">🥇</span>
                        <span className="text-white">야구사랑</span>
                      </div>
                      <span className="text-sm text-gray-400">92%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400">🥈</span>
                        <span className="text-white">KBO마니아</span>
                      </div>
                      <span className="text-sm text-gray-400">89%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-amber-600">🥉</span>
                        <span className="text-white">홈런왕</span>
                      </div>
                      <span className="text-sm text-gray-400">85%</span>
                    </div>
                  </div>
                </div>

                {/* 축구 */}
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-4 flex items-center">
                    ⚽ 축구 (EPL)
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-yellow-400">🥇</span>
                        <span className="text-white">축구광</span>
                      </div>
                      <span className="text-sm text-gray-400">88%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400">🥈</span>
                        <span className="text-white">EPL전문가</span>
                      </div>
                      <span className="text-sm text-gray-400">84%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-amber-600">🥉</span>
                        <span className="text-white">프리미어팬</span>
                      </div>
                      <span className="text-sm text-gray-400">81%</span>
                    </div>
                  </div>
                </div>

                {/* 배구 */}
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-4 flex items-center">
                    🏐 배구 (V-League)
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-yellow-400">🥇</span>
                        <span className="text-white">배구마스터</span>
                      </div>
                      <span className="text-sm text-gray-400">90%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400">🥈</span>
                        <span className="text-white">스파이크킹</span>
                      </div>
                      <span className="text-sm text-gray-400">86%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-amber-600">🥉</span>
                        <span className="text-white">V리그팬</span>
                      </div>
                      <span className="text-sm text-gray-400">83%</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 안내 메시지 */}
            <div className="text-center p-6 bg-slate-800/30 rounded-lg">
              <p className="text-gray-400 mb-2">
                🚀 <strong>곧 출시!</strong> 실제 랭킹 시스템이 곧 추가됩니다.
              </p>
              <p className="text-sm text-gray-500">
                위 데이터는 예시이며, 실제 서비스에서는 실시간 랭킹이 제공됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
