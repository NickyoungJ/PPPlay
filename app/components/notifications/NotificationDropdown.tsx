'use client';

import { useState, useEffect, useRef } from 'react';
import { FaBell, FaCheck, FaTrash, FaTimes, FaSpinner } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 알림 목록 조회
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications?limit=10');
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

  // 읽지 않은 알림 개수만 조회 (주기적)
  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications?limit=1');
      const data = await response.json();

      if (data.success) {
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('알림 개수 조회 오류:', error);
    }
  };

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
  const deleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  // 드롭다운 열릴 때 알림 조회
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // 주기적으로 읽지 않은 알림 개수 업데이트 (30초마다)
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 알림 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-primary/10 transition-colors"
        aria-label="알림"
      >
        <FaBell className="text-xl text-foreground/70 hover:text-primary transition-colors" />
        
        {/* 읽지 않은 알림 배지 */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1 animate-pulse-glow">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* 드롭다운 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-background border border-primary/20 rounded-2xl shadow-2xl shadow-primary/10 overflow-hidden z-50 animate-fade-in-scale">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b border-primary/10 bg-gradient-to-r from-primary/5 to-secondary/5">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <FaBell className="text-primary" />
              알림
              {unreadCount > 0 && (
                <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                >
                  <FaCheck className="text-[10px]" />
                  모두 읽음
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-primary/10 rounded-lg transition-colors"
              >
                <FaTimes className="text-foreground/50" />
              </button>
            </div>
          </div>

          {/* 알림 목록 */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <FaSpinner className="animate-spin text-2xl text-primary" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-10 px-4">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-lg animate-pulse-slow" />
                  <div className="relative w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-3xl">🔔</span>
                  </div>
                </div>
                <p className="text-foreground/70 font-medium mb-1">알림이 없습니다</p>
                <p className="text-foreground/50 text-xs">마켓에 참여하면 알림을 받을 수 있어요</p>
              </div>
            ) : (
              <div className="divide-y divide-primary/5">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                    className={`p-4 hover:bg-primary/5 cursor-pointer transition-colors relative group ${
                      !notification.is_read ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* 아이콘 */}
                      <div className="text-2xl flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* 내용 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`font-medium text-sm ${
                            !notification.is_read ? 'text-foreground' : 'text-foreground/70'
                          }`}>
                            {notification.title}
                          </p>
                          
                          {/* 읽지 않음 표시 */}
                          {!notification.is_read && (
                            <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        
                        {notification.message && (
                          <p className="text-xs text-foreground/50 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                        )}
                        
                        <p className="text-xs text-foreground/40 mt-2">
                          {formatTime(notification.created_at)}
                        </p>
                      </div>

                      {/* 삭제 버튼 */}
                      <button
                        onClick={(e) => deleteNotification(notification.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <FaTrash className="text-xs text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 푸터 */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-primary/10 bg-background/50">
              <button
                onClick={() => {
                  setIsOpen(false);
                  window.location.href = '/notifications';
                }}
                className="w-full text-center text-sm text-primary hover:text-primary/80 font-medium transition-colors"
              >
                모든 알림 보기 →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

