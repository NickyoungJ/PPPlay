'use client';

import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 px-4 md:px-8 py-12">
        <div className="max-w-5xl mx-auto">
          {/* 페이지 헤더 */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                상점 🏪
              </span>
            </h1>
            <p className="text-foreground/70 text-lg">
              포인트로 다양한 리워드를 구매하세요
            </p>
          </div>

          <div className="space-y-8">
            {/* 상점 안내 */}
            <section className="bg-background/40 backdrop-blur-xl border border-primary/20 rounded-3xl p-8">
              <h2 className="text-2xl font-bold text-foreground/90 mb-6 flex items-center gap-3">
                💎 포인트 상점 (준비 중)
                <span className="ml-2 text-sm text-foreground/50">(곧 오픈 예정)</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 상점 아이템 예시 */}
                {[
                  { icon: '🎁', name: '스타벅스 기프티콘', points: 5000, description: '아메리카노 Tall 사이즈' },
                  { icon: '🎟️', name: '영화 예매권', points: 12000, description: 'CGV/롯데시네마 2D 영화' },
                  { icon: '🍔', name: '맥도날드 세트', points: 8000, description: '빅맥 세트 기프티콘' },
                  { icon: '🎮', name: '게임 포인트', points: 10000, description: '10,000원 상당 게임 캐시' },
                  { icon: '📱', name: '모바일 쿠폰', points: 3000, description: '편의점 3,000원 상품권' },
                  { icon: '🍕', name: '피자 할인권', points: 15000, description: '피자 50% 할인 쿠폰' },
                ].map((item, index) => (
                  <div key={index} className="bg-background/60 border border-primary/10 rounded-2xl p-6 hover:bg-background/80 hover:border-primary/30 transition-all cursor-not-allowed opacity-60">
                    <div className="flex items-start gap-4">
                      <div className="text-5xl">{item.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-bold text-foreground/90 text-lg mb-1">{item.name}</h3>
                        <p className="text-sm text-foreground/60 mb-3">{item.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-accent font-bold text-lg">{item.points.toLocaleString()}P</span>
                          <button 
                            disabled
                            className="bg-primary/30 text-foreground/50 px-4 py-2 rounded-xl font-medium cursor-not-allowed"
                          >
                            준비 중
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 포인트 획득 방법 안내 */}
            <section className="bg-background/40 backdrop-blur-xl border border-secondary/20 rounded-3xl p-8">
              <h2 className="text-2xl font-bold text-foreground/90 mb-6 flex items-center gap-3">
                💡 포인트 획득 방법
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-primary/10 border border-primary/30 rounded-2xl p-6 text-center">
                  <div className="text-4xl mb-3">🗳️</div>
                  <h3 className="font-bold text-foreground/90 text-lg mb-2">투표 참여</h3>
                  <p className="text-foreground/60 text-sm mb-3">
                    마켓에 투표하면 자동으로
                  </p>
                  <div className="text-primary font-bold text-2xl">+5P</div>
                </div>

                <div className="bg-accent/10 border border-accent/30 rounded-2xl p-6 text-center">
                  <div className="text-4xl mb-3">✅</div>
                  <h3 className="font-bold text-foreground/90 text-lg mb-2">예측 적중</h3>
                  <p className="text-foreground/60 text-sm mb-3">
                    정답을 맞추면 추가 보상
                  </p>
                  <div className="text-accent font-bold text-2xl">+20P</div>
                </div>

                <div className="bg-secondary/10 border border-secondary/30 rounded-2xl p-6 text-center">
                  <div className="text-4xl mb-3">🎁</div>
                  <h3 className="font-bold text-foreground/90 text-lg mb-2">일일 보너스</h3>
                  <p className="text-foreground/60 text-sm mb-3">
                    매일 첫 투표 시 추가 지급
                  </p>
                  <div className="text-secondary font-bold text-2xl">+10P</div>
                </div>
              </div>
            </section>

            {/* 안내 메시지 */}
            <div className="text-center p-8 bg-accent/10 border border-accent/20 rounded-3xl">
              <div className="text-5xl mb-4">🚧</div>
              <p className="text-foreground/80 mb-2 text-lg font-semibold">
                상점 기능 준비 중입니다
              </p>
              <p className="text-sm text-foreground/60">
                곧 다양한 리워드를 만나보실 수 있습니다. 지금부터 포인트를 모아보세요! 💪
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
