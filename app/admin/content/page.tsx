'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { FaArrowLeft, FaTrash, FaSearch, FaComments, FaStore, FaSpinner, FaUndo } from 'react-icons/fa';
import { supabaseClient } from '@/utils/supabase/client';
import toast from 'react-hot-toast';

interface Comment {
  id: string;
  content: string;
  market_id: string;
  user_id: string;
  nickname: string;
  is_deleted: boolean;
  created_at: string;
}

interface Market {
  id: string;
  title: string;
  description: string;
  status: string;
  creator_id: string;
  created_at: string;
}

type TabType = 'comments' | 'markets';

export default function AdminContentPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('comments');
  const [comments, setComments] = useState<Comment[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 댓글 목록 조회
  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/comments');
      const data = await response.json();

      if (data.success) {
        setComments(data.comments);
      } else {
        toast.error(data.error || '댓글 조회에 실패했습니다.');
      }
    } catch (error) {
      toast.error('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 마켓 목록 조회
  const fetchMarkets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabaseClient
        .from('markets')
        .select('id, title, description, status, creator_id, created_at')
        .in('status', ['approved', 'active', 'pending'])
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        toast.error('마켓 조회에 실패했습니다.');
      } else {
        setMarkets(data || []);
      }
    } catch (error) {
      toast.error('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'comments') {
      fetchComments();
    } else {
      fetchMarkets();
    }
  }, [activeTab]);

  // 댓글 삭제
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('이 댓글을 삭제하시겠습니까?')) return;

    setDeletingId(commentId);
    try {
      const response = await fetch(`/api/admin/comments?id=${commentId}`, {
        method: 'DELETE'
      });
      const data = await response.json();

      if (data.success) {
        toast.success('댓글이 삭제되었습니다.');
        setComments(prev => prev.filter(c => c.id !== commentId));
      } else {
        toast.error(data.error || '댓글 삭제에 실패했습니다.');
      }
    } catch (error) {
      toast.error('서버 오류가 발생했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  // 마켓 삭제
  const handleDeleteMarket = async (marketId: string, marketTitle: string) => {
    const reason = prompt(`마켓 "${marketTitle}" 삭제 사유를 입력하세요:`, '운영정책 위반');
    if (!reason) return;

    setDeletingId(marketId);
    try {
      const response = await fetch(`/api/admin/markets/delete?id=${marketId}&reason=${encodeURIComponent(reason)}`, {
        method: 'DELETE'
      });
      const data = await response.json();

      if (data.success) {
        toast.success('마켓이 삭제되었습니다.');
        setMarkets(prev => prev.filter(m => m.id !== marketId));
      } else {
        toast.error(data.error || '마켓 삭제에 실패했습니다.');
      }
    } catch (error) {
      toast.error('서버 오류가 발생했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  // 검색 필터링
  const filteredComments = comments.filter(c => 
    c.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.nickname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMarkets = markets.filter(m =>
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.description && m.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // 시간 포맷
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 px-4 md:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center gap-2 text-foreground/70 hover:text-primary transition-colors mb-4"
            >
              <FaArrowLeft />
              <span>관리자 대시보드로</span>
            </button>
            <h1 className="text-3xl font-bold text-foreground">콘텐츠 관리</h1>
            <p className="text-foreground/60 mt-2">부적절한 댓글 및 마켓을 관리합니다.</p>
          </div>

          {/* 탭 */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('comments')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'comments'
                  ? 'bg-primary text-white'
                  : 'bg-background/60 text-foreground/70 hover:bg-primary/10'
              }`}
            >
              <FaComments />
              <span>댓글 관리</span>
            </button>
            <button
              onClick={() => setActiveTab('markets')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'markets'
                  ? 'bg-primary text-white'
                  : 'bg-background/60 text-foreground/70 hover:bg-primary/10'
              }`}
            >
              <FaStore />
              <span>마켓 관리</span>
            </button>
          </div>

          {/* 검색 */}
          <div className="relative mb-6">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={activeTab === 'comments' ? '댓글 내용 또는 닉네임 검색...' : '마켓 제목 검색...'}
              className="w-full pl-12 pr-4 py-3 bg-background/60 border border-primary/20 rounded-xl text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary/50"
            />
          </div>

          {/* 콘텐츠 */}
          <div className="bg-background/40 backdrop-blur-xl border border-primary/20 rounded-3xl overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <FaSpinner className="animate-spin text-3xl text-primary" />
              </div>
            ) : activeTab === 'comments' ? (
              /* 댓글 목록 */
              <div className="divide-y divide-primary/10">
                {filteredComments.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="text-4xl mb-3">💬</div>
                    <p className="text-foreground/50">댓글이 없습니다.</p>
                  </div>
                ) : (
                  filteredComments.map((comment) => (
                    <div
                      key={comment.id}
                      className={`p-4 hover:bg-primary/5 transition-colors ${
                        comment.is_deleted ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-foreground">{comment.nickname}</span>
                            <span className="text-xs text-foreground/40">{formatDate(comment.created_at)}</span>
                            {comment.is_deleted && (
                              <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full">삭제됨</span>
                            )}
                          </div>
                          <p className="text-foreground/80 break-words">{comment.content}</p>
                        </div>
                        {!comment.is_deleted && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            disabled={deletingId === comment.id}
                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
                          >
                            {deletingId === comment.id ? (
                              <FaSpinner className="animate-spin" />
                            ) : (
                              <FaTrash />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* 마켓 목록 */
              <div className="divide-y divide-primary/10">
                {filteredMarkets.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="text-4xl mb-3">📊</div>
                    <p className="text-foreground/50">마켓이 없습니다.</p>
                  </div>
                ) : (
                  filteredMarkets.map((market) => (
                    <div
                      key={market.id}
                      className="p-4 hover:bg-primary/5 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                              market.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                              market.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {market.status === 'approved' ? '승인됨' :
                               market.status === 'pending' ? '대기중' : market.status}
                            </span>
                            <span className="text-xs text-foreground/40">{formatDate(market.created_at)}</span>
                          </div>
                          <h3 className="font-semibold text-foreground mb-1">{market.title}</h3>
                          {market.description && (
                            <p className="text-sm text-foreground/60 line-clamp-2">{market.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteMarket(market.id, market.title)}
                          disabled={deletingId === market.id}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
                        >
                          {deletingId === market.id ? (
                            <FaSpinner className="animate-spin" />
                          ) : (
                            <FaTrash />
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* 안내 문구 */}
          <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <p className="text-yellow-400 text-sm">
              ⚠️ 삭제된 콘텐츠는 복구가 어려울 수 있습니다. 신중하게 결정해주세요.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

