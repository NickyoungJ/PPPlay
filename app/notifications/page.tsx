'use client';

import { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { FaBell, FaCheck, FaTrash, FaCheckDouble } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useAuth } from '@/app/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { NotificationListSkeleton } from '../components/ui/Skeleton';
import { EmptyNotifications } from '../components/ui/EmptyState';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  // 로그인 체크
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, authLoading, router]);

  // 알림 목록 조회
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications?limit=50');
      const data = await response.json();

      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('알림 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);

  // 모든 알림 읽음 처리
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('알림 읽음 처리 오류:', error);
    }
  };

  // 특정 알림 읽음 처리
  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });

      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('알림 읽음 처리 오류:', error);
    }
  };

  // 알림 삭제
  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const deleted = notifications.find(n => n.id === notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        if (deleted && !deleted.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('알림 삭제 오류:', error);
    }
  };

  // 모든 알림 삭제
  const deleteAllNotifications = async () => {
    if (!confirm('모든 알림을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch('/api/notifications?all=true', {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('알림 삭제 오류:', error);
    }
  };

  // 알림 아이콘 가져오기
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'market_result':
        return '🎯';
      case 'points_earned':
        return '💰';
      case 'points_spent':
        return '💸';
      case 'market_approved':
        return '✅';
      case 'market_rejected':
        return '❌';
      case 'attendance_bonus':
        return '📅';
      case 'streak_bonus':
        return '🔥';
      case 'system':
        return '📢';
      default:
        return '🔔';
    }
  };

  // 시간 포맷팅
  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ko });
    } catch {
      return '';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 px-4 md:px-8 py-12">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <div className="h-10 w-32 bg-foreground/10 rounded-lg animate-pulse mb-2" />
              <div className="h-5 w-48 bg-foreground/5 rounded-lg animate-pulse" />
            </div>
            <NotificationListSkeleton count={5} />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 px-4 md:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          {/* 페이지 헤더 */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent flex items-center gap-3">
                  <FaBell className="text-primary" />
                  알림
                </span>
              </h1>
              <p className="text-foreground/60">
                {unreadCount > 0 ? `${unreadCount}개의 읽지 않은 알림` : '모든 알림을 확인했습니다'}
              </p>
            </div>

            {notifications.length > 0 && (
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors text-sm font-medium"
                  >
                    <FaCheckDouble />
                    모두 읽음
                  </button>
                )}
                <button
                  onClick={deleteAllNotifications}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-colors text-sm font-medium"
                >
                  <FaTrash />
                  전체 삭제
                </button>
              </div>
            )}
          </div>

          {/* 알림 목록 */}
          {loading ? (
            <NotificationListSkeleton count={5} />
          ) : notifications.length === 0 ? (
            <div className="bg-background/40 border border-primary/10 rounded-2xl sm:rounded-3xl">
              <EmptyNotifications />
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification, index) => (
                <div
                  key={notification.id}
                  className={`p-5 rounded-2xl border hover-lift opacity-0 animate-fade-in-up ${
                    !notification.is_read
                      ? 'bg-primary/5 border-primary/30 shadow-md'
                      : 'bg-background/40 border-primary/10'
                  }`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex gap-4">
                    {/* 아이콘 */}
                    <div className="text-3xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* 내용 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className={`font-semibold ${
                              !notification.is_read ? 'text-foreground' : 'text-foreground/70'
                            }`}>
                              {notification.title}
                            </p>
                            {!notification.is_read && (
                              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                            )}
                          </div>
                          
                          {notification.message && (
                            <p className="text-sm text-foreground/60 mb-2">
                              {notification.message}
                            </p>
                          )}
                          
                          <p className="text-xs text-foreground/40">
                            {formatTime(notification.created_at)}
                          </p>
                        </div>

                        {/* 액션 버튼 */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification.is_read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
                              title="읽음 처리"
                            >
                              <FaCheck className="text-primary text-sm" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="삭제"
                          >
                            <FaTrash className="text-red-400 text-sm" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 안내 */}
          <div className="mt-10 p-6 bg-primary/5 border border-primary/20 rounded-2xl">
            <h4 className="font-semibold text-foreground mb-3">📌 알림 안내</h4>
            <ul className="text-sm text-foreground/70 space-y-1">
              <li>• 알림은 30일 후 자동으로 삭제됩니다</li>
              <li>• 마켓 결과, 포인트 변동, 출석 보너스 등을 알려드립니다</li>
              <li>• 중요한 알림은 읽지 않은 상태로 유지하세요</li>
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

