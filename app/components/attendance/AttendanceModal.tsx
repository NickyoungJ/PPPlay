'use client';

import { useState, useEffect } from 'react';
import { FaCalendarCheck, FaTimes, FaSpinner, FaGift, FaFire } from 'react-icons/fa';
import { showAttendanceSuccess, showError } from '@/utils/toast';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AttendanceModal({ isOpen, onClose, onSuccess }: AttendanceModalProps) {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<{
    checkedIn: boolean;
    consecutiveDays: number;
    totalDays: number;
    todayPoints: number;
  } | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    pointsEarned: number;
    consecutiveDays: number;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setResult(null);
    }
  }, [isOpen]);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/attendance');
      const data = await response.json();
      
      if (data.success) {
        setStatus(data);
      }
    } catch (error) {
      console.error('출석 상태 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setChecking(true);
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        setResult({
          success: true,
          message: data.message,
          pointsEarned: data.pointsEarned,
          consecutiveDays: data.consecutiveDays,
        });
        setStatus(prev => prev ? { ...prev, checkedIn: true } : null);
        
        // 포인트 업데이트 이벤트 발생
        window.dispatchEvent(new Event('pointsUpdated'));
        
        // 토스트 알림
        showAttendanceSuccess(data.pointsEarned, data.consecutiveDays);
        
        if (onSuccess) onSuccess();
      } else {
        setResult({
          success: false,
          message: data.error,
          pointsEarned: 0,
          consecutiveDays: status?.consecutiveDays || 0,
        });
        showError(data.error);
      }
    } catch (error) {
      console.error('출석 체크 오류:', error);
      setResult({
        success: false,
        message: '서버 오류가 발생했습니다.',
        pointsEarned: 0,
        consecutiveDays: 0,
      });
      showError('서버 오류가 발생했습니다.');
    } finally {
      setChecking(false);
    }
  };

  if (!isOpen) return null;

  // 이번 주 출석 현황 (7일)
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
  const today = new Date().getDay();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 모달 */}
      <div className="relative bg-background border border-primary/20 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-foreground/50 hover:text-foreground transition-colors"
        >
          <FaTimes className="text-xl" />
        </button>

        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCalendarCheck className="text-4xl text-white" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">출석 체크</h2>
          <p className="text-foreground/60 mt-1">매일 출석하고 포인트를 받으세요!</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <FaSpinner className="animate-spin text-3xl text-primary" />
          </div>
        ) : result ? (
          /* 결과 화면 */
          <div className="text-center">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
              result.success 
                ? 'bg-gradient-to-br from-green-400 to-emerald-600' 
                : 'bg-gradient-to-br from-red-400 to-rose-600'
            }`}>
              {result.success ? (
                <FaGift className="text-5xl text-white" />
              ) : (
                <FaTimes className="text-5xl text-white" />
              )}
            </div>
            
            <h3 className={`text-xl font-bold mb-2 ${
              result.success ? 'text-green-500' : 'text-red-500'
            }`}>
              {result.success ? '출석 완료!' : '출석 실패'}
            </h3>
            
            <p className="text-foreground/70 mb-4">{result.message}</p>
            
            {result.success && (
              <div className="bg-primary/10 rounded-2xl p-4 mb-6">
                <div className="text-3xl font-bold text-primary">
                  +{result.pointsEarned}P
                </div>
                <div className="text-sm text-foreground/60 mt-1 flex items-center justify-center gap-2">
                  <FaFire className="text-orange-500" />
                  <span>{result.consecutiveDays}일 연속 출석!</span>
                </div>
              </div>
            )}
            
            <button
              onClick={onClose}
              className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl font-bold hover:opacity-90 transition-opacity"
            >
              확인
            </button>
          </div>
        ) : (
          /* 출석 체크 화면 */
          <>
            {/* 연속 출석 현황 */}
            <div className="bg-primary/5 rounded-2xl p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FaFire className="text-orange-500 text-xl" />
                  <span className="font-bold text-foreground">연속 출석</span>
                </div>
                <span className="text-2xl font-bold text-primary">
                  {status?.consecutiveDays || 0}일
                </span>
              </div>
              
              {/* 주간 출석 표시 */}
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day, index) => {
                  const isToday = index === today;
                  const isPast = index < today;
                  const isChecked = status?.checkedIn && isToday;
                  
                  return (
                    <div key={day} className="text-center">
                      <div className="text-xs text-foreground/50 mb-1">{day}</div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-sm font-bold ${
                        isChecked 
                          ? 'bg-gradient-to-br from-primary to-secondary text-white'
                          : isToday
                            ? 'bg-primary/20 text-primary border-2 border-primary'
                            : isPast
                              ? 'bg-foreground/10 text-foreground/30'
                              : 'bg-foreground/5 text-foreground/20'
                      }`}>
                        {isChecked ? '✓' : index + 1}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 보상 안내 */}
            <div className="space-y-2 mb-6 text-sm">
              <div className="flex items-center justify-between text-foreground/70">
                <span>📅 일일 출석</span>
                <span className="font-bold text-primary">+100P</span>
              </div>
              <div className="flex items-center justify-between text-foreground/70">
                <span>🔥 3일 연속 보너스</span>
                <span className="font-bold text-orange-500">+50P</span>
              </div>
              <div className="flex items-center justify-between text-foreground/70">
                <span>🎁 7일 연속 보너스</span>
                <span className="font-bold text-purple-500">+500P</span>
              </div>
            </div>

            {/* 출석 버튼 */}
            {status?.checkedIn ? (
              <button
                disabled
                className="w-full py-4 bg-foreground/20 text-foreground/50 rounded-2xl font-bold cursor-not-allowed"
              >
                ✓ 오늘 출석 완료
              </button>
            ) : (
              <button
                onClick={handleCheckIn}
                disabled={checking}
                className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {checking ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    <span>출석 중...</span>
                  </>
                ) : (
                  <>
                    <FaCalendarCheck />
                    <span>출석 체크하기</span>
                  </>
                )}
              </button>
            )}

            {/* 총 출석 일수 */}
            <div className="text-center mt-4 text-sm text-foreground/50">
              총 {status?.totalDays || 0}일 출석
            </div>
          </>
        )}
      </div>
    </div>
  );
}

