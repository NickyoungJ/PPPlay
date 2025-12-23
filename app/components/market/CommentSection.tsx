'use client';

import { useState, useEffect } from 'react';
import { FaUser, FaTrash, FaPaperPlane, FaSpinner } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useAuth } from '@/app/hooks/useAuth';

interface Comment {
  id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  user_id: string;
  user: {
    nickname: string;
    avatar_url: string | null;
  };
}

interface CommentSectionProps {
  marketId: string;
}

export default function CommentSection({ marketId }: CommentSectionProps) {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');

  // 댓글 목록 조회
  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/comments?marketId=${marketId}`);
      const data = await response.json();

      if (data.success) {
        setComments(data.comments);
      }
    } catch (error) {
      console.error('댓글 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [marketId]);

  // 댓글 작성
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    if (!newComment.trim()) {
      toast.error('댓글 내용을 입력해주세요.');
      return;
    }

    if (newComment.length > 500) {
      toast.error('댓글은 500자 이내로 작성해주세요.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketId,
          content: newComment
        })
      });

      const data = await response.json();

      if (data.success) {
        setComments(prev => [...prev, data.comment]);
        setNewComment('');
        toast.success('댓글이 작성되었습니다.');
      } else {
        toast.error(data.error || '댓글 작성에 실패했습니다.');
      }
    } catch (error) {
      toast.error('서버 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 댓글 삭제
  const handleDelete = async (commentId: string) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/comments?id=${commentId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setComments(prev => prev.filter(c => c.id !== commentId));
        toast.success('댓글이 삭제되었습니다.');
      } else {
        toast.error(data.error || '댓글 삭제에 실패했습니다.');
      }
    } catch (error) {
      toast.error('서버 오류가 발생했습니다.');
    }
  };

  // 시간 포맷
  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ko });
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FaSpinner className="animate-spin text-2xl text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 댓글 입력 */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={isAuthenticated ? "댓글을 입력하세요..." : "로그인 후 댓글을 작성할 수 있습니다."}
            disabled={!isAuthenticated || submitting}
            className="w-full p-4 pr-12 bg-background/60 border border-primary/20 rounded-xl text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            rows={3}
            maxLength={500}
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <span className="text-xs text-foreground/40">{newComment.length}/500</span>
            <button
              type="submit"
              disabled={!isAuthenticated || submitting || !newComment.trim()}
              className="p-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaPaperPlane />
              )}
            </button>
          </div>
        </div>
      </form>

      {/* 댓글 목록 */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-foreground/50">아직 댓글이 없습니다.</p>
            <p className="text-foreground/40 text-sm">첫 번째 댓글을 작성해보세요!</p>
          </div>
        ) : (
          comments.map((comment, index) => (
            <div
              key={comment.id}
              className="bg-background/40 border border-primary/10 rounded-xl p-4 opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-start gap-3">
                {/* 아바타 */}
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  {comment.user.avatar_url ? (
                    <img
                      src={comment.user.avatar_url}
                      alt=""
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <FaUser className="text-primary/60" />
                  )}
                </div>

                {/* 내용 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground/90">{comment.user.nickname}</span>
                    <span className="text-xs text-foreground/40">{formatTime(comment.created_at)}</span>
                  </div>
                  <p className="text-foreground/80 whitespace-pre-wrap break-words">{comment.content}</p>
                </div>

                {/* 삭제 버튼 (본인 댓글만) */}
                {user?.id === comment.user_id && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="p-2 text-foreground/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <FaTrash className="text-sm" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

