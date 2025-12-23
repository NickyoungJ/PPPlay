'use client';

import { useState, useEffect } from 'react';
import { FaSpinner, FaThumbsUp, FaThumbsDown, FaChevronDown } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Activity {
  id: string;
  type: 'vote';
  selected_option: 'YES' | 'NO';
  created_at: string;
  user: {
    nickname: string;
    avatar_url: string | null;
  };
}

interface ActivitySectionProps {
  marketId: string;
}

const ITEMS_PER_PAGE = 20;

export default function ActivitySection({ marketId }: ActivitySectionProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);

  // 액티비티 조회
  const fetchActivities = async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      }

      const currentOffset = loadMore ? offset : 0;
      const response = await fetch(
        `/api/markets/${marketId}/activity?limit=${ITEMS_PER_PAGE}&offset=${currentOffset}`
      );
      const data = await response.json();

      if (data.success) {
        if (loadMore) {
          setActivities(prev => [...prev, ...data.activities]);
        } else {
          setActivities(data.activities);
        }
        setTotal(data.total);
        setOffset(currentOffset + ITEMS_PER_PAGE);
      }
    } catch (error) {
      console.error('액티비티 조회 오류:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [marketId]);

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
    <div className="space-y-4">
      {/* 총 투표 수 */}
      <div className="flex items-center justify-between px-2">
        <span className="text-sm text-foreground/60">총 {total}개의 투표</span>
      </div>

      {/* 액티비티 목록 */}
      <div className="space-y-2">
        {activities.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📊</div>
            <p className="text-foreground/50">아직 투표 기록이 없습니다.</p>
            <p className="text-foreground/40 text-sm">첫 번째 투표를 해보세요!</p>
          </div>
        ) : (
          activities.map((activity, index) => (
            <div
              key={activity.id}
              className="flex items-center gap-3 p-3 bg-background/40 border border-primary/10 rounded-xl opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${index * 0.03}s` }}
            >
              {/* 투표 아이콘 */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  activity.selected_option === 'YES'
                    ? 'bg-green-500/20'
                    : 'bg-red-500/20'
                }`}
              >
                {activity.selected_option === 'YES' ? (
                  <FaThumbsUp className="text-green-500" />
                ) : (
                  <FaThumbsDown className="text-red-500" />
                )}
              </div>

              {/* 내용 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground/90">{activity.user.nickname}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      activity.selected_option === 'YES'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {activity.selected_option}
                  </span>
                </div>
                <span className="text-xs text-foreground/40">{formatTime(activity.created_at)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 더 보기 버튼 */}
      {activities.length < total && (
        <button
          onClick={() => fetchActivities(true)}
          disabled={loadingMore}
          className="w-full py-3 flex items-center justify-center gap-2 bg-background/40 border border-primary/20 rounded-xl text-foreground/70 hover:bg-primary/10 hover:text-primary transition-all disabled:opacity-50"
        >
          {loadingMore ? (
            <FaSpinner className="animate-spin" />
          ) : (
            <>
              <span>더 보기</span>
              <FaChevronDown />
            </>
          )}
        </button>
      )}
    </div>
  );
}

