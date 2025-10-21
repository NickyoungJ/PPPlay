'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { useAuth } from '../../hooks/useAuth';
import { FaArrowLeft, FaSpinner } from 'react-icons/fa';

export default function CreateMarketPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_slug: 'economy',
    option_yes: '',
    option_no: '',
    closes_at: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 인증 확인
  if (!isAuthenticated) {
    router.push('/auth');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 폼 검증
      if (!formData.title.trim()) {
        setError('제목을 입력해주세요.');
        setLoading(false);
        return;
      }

      if (!formData.option_yes.trim() || !formData.option_no.trim()) {
        setError('Yes/No 옵션을 모두 입력해주세요.');
        setLoading(false);
        return;
      }

      if (!formData.closes_at) {
        setError('마감 시간을 선택해주세요.');
        setLoading(false);
        return;
      }

      // API 호출
      const response = await fetch('/api/markets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        alert('마켓이 생성되었습니다! 관리자 승인 후 활성화됩니다.');
        router.push('/markets');
      } else {
        setError(data.error || '마켓 생성에 실패했습니다.');
      }
    } catch (err) {
      console.error('마켓 생성 오류:', err);
      setError('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // 최소 날짜 (현재 시간 + 1시간)
  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 px-4 md:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          {/* 뒤로 가기 */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-foreground/70 hover:text-primary transition-colors mb-8 font-medium"
          >
            <FaArrowLeft />
            <span>돌아가기</span>
          </button>

          {/* 페이지 헤더 */}
          <div className="mb-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                마켓 만들기
              </span>
            </h1>
            <p className="text-foreground/70 text-lg">
              새로운 예측 마켓을 만들어보세요 (1000P 소모)
            </p>
          </div>

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="bg-background/40 backdrop-blur-xl border border-primary/20 rounded-3xl p-8 space-y-6">
            {/* 제목 */}
            <div>
              <label className="block text-sm font-semibold text-foreground/90 mb-3">
                마켓 제목 *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="예: 비트코인이 연말까지 $100,000 돌파할까?"
                className="w-full px-5 py-4 bg-background/60 border border-primary/30 rounded-2xl focus:ring-2 focus:ring-primary/50 focus:border-primary text-foreground placeholder-foreground/40 transition-all"
                maxLength={200}
                required
              />
              <p className="text-sm text-foreground/50 mt-2">
                {formData.title.length}/200
              </p>
            </div>

            {/* 설명 */}
            <div>
              <label className="block text-sm font-semibold text-foreground/90 mb-3">
                설명 (선택)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="마켓에 대한 자세한 설명을 입력하세요..."
                rows={4}
                className="w-full px-5 py-4 bg-background/60 border border-primary/30 rounded-2xl focus:ring-2 focus:ring-primary/50 focus:border-primary text-foreground placeholder-foreground/40 resize-none transition-all"
                maxLength={1000}
              />
              <p className="text-sm text-foreground/50 mt-2">
                {formData.description.length}/1000
              </p>
            </div>

            {/* 카테고리 */}
            <div>
              <label className="block text-sm font-semibold text-foreground/90 mb-3">
                카테고리 *
              </label>
              <select
                name="category_slug"
                value={formData.category_slug}
                onChange={handleChange}
                className="w-full px-5 py-4 bg-background/60 border border-primary/30 rounded-2xl focus:ring-2 focus:ring-primary/50 focus:border-primary text-foreground transition-all"
                required
              >
                <option value="politics">🏛️ 정치</option>
                <option value="economy">💰 경제</option>
                <option value="entertainment">🎬 연예</option>
                <option value="society">🌐 사회</option>
                <option value="tech">💻 IT/기술</option>
              </select>
            </div>

            {/* Yes/No 옵션 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-foreground/90 mb-3">
                  Yes 옵션 *
                </label>
                <input
                  type="text"
                  name="option_yes"
                  value={formData.option_yes}
                  onChange={handleChange}
                  placeholder="돌파한다"
                  className="w-full px-5 py-4 bg-primary/10 border border-primary/30 rounded-2xl focus:ring-2 focus:ring-primary/50 focus:border-primary text-foreground placeholder-foreground/40 transition-all"
                  maxLength={100}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground/90 mb-3">
                  No 옵션 *
                </label>
                <input
                  type="text"
                  name="option_no"
                  value={formData.option_no}
                  onChange={handleChange}
                  placeholder="돌파하지 않는다"
                  className="w-full px-5 py-4 bg-secondary/10 border border-secondary/30 rounded-2xl focus:ring-2 focus:ring-secondary/50 focus:border-secondary text-foreground placeholder-foreground/40 transition-all"
                  maxLength={100}
                  required
                />
              </div>
            </div>

            {/* 마감 시간 */}
            <div>
              <label className="block text-sm font-semibold text-foreground/90 mb-3">
                마감 시간 *
              </label>
              <input
                type="datetime-local"
                name="closes_at"
                value={formData.closes_at}
                onChange={handleChange}
                min={getMinDateTime()}
                className="w-full px-5 py-4 bg-background/60 border border-primary/30 rounded-2xl focus:ring-2 focus:ring-primary/50 focus:border-primary text-foreground transition-all"
                required
              />
              <p className="text-sm text-foreground/50 mt-2">
                최소 1시간 이후로 설정해주세요
              </p>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-2xl">
                <p className="text-destructive text-sm font-medium">{error}</p>
              </div>
            )}

            {/* 안내 */}
            <div className="p-5 bg-primary/5 border border-primary/20 rounded-2xl">
              <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                <span>📌</span>
                <span>안내사항</span>
              </h4>
              <ul className="text-sm text-foreground/70 space-y-2">
                <li>• 마켓 생성 시 1000 포인트가 차감됩니다</li>
                <li>• 관리자 승인 후 마켓이 활성화됩니다</li>
                <li>• 마감 시간은 최소 1시간 이후로 설정해주세요</li>
                <li>• 부적절한 내용은 승인되지 않을 수 있습니다</li>
              </ul>
            </div>

            {/* 제출 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-8 py-5 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white rounded-2xl transition-all font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-primary/20"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin text-xl" />
                  <span>생성 중...</span>
                </>
              ) : (
                <span>마켓 생성하기 (1000P)</span>
              )}
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
