'use client';

import { useState, useEffect, useRef } from 'react';
import { FaTimes, FaUser, FaCheck, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface NicknameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNickname: string | null;
  onUpdate: (nickname: string | null) => void;
}

export default function NicknameModal({ isOpen, onClose, currentNickname, onUpdate }: NicknameModalProps) {
  const [nickname, setNickname] = useState(currentNickname || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setNickname(currentNickname || '');
      setError('');
      // 모달 열릴 때 입력창에 포커스
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, currentNickname]);

  // 실시간 유효성 검사
  const validateNickname = (value: string): string => {
    if (!value.trim()) return ''; // 빈 값은 허용 (닉네임 삭제)
    
    if (value.length < 2) return '최소 2자 이상 입력해주세요.';
    if (value.length > 12) return '최대 12자까지 입력 가능합니다.';
    
    const nicknameRegex = /^[가-힣a-zA-Z0-9_]+$/;
    if (!nicknameRegex.test(value)) return '한글, 영문, 숫자, 언더스코어만 사용 가능합니다.';
    
    const forbiddenWords = ['admin', '관리자', '운영자', '시스템', 'system', 'ppplay'];
    if (forbiddenWords.some(word => value.toLowerCase().includes(word))) {
      return '사용할 수 없는 닉네임입니다.';
    }
    
    return '';
  };

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNickname(value);
    setError(validateNickname(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedNickname = nickname.trim();
    const validationError = validateNickname(trimmedNickname);
    
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: trimmedNickname || null })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        onUpdate(data.nickname);
        onClose();
      } else {
        setError(data.error || '닉네임 설정에 실패했습니다.');
      }
    } catch {
      setError('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 백드롭 */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* 모달 */}
      <div className="relative bg-background border border-primary/30 rounded-2xl w-full max-w-md p-6 animate-scale-in shadow-2xl shadow-primary/20">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <FaUser className="text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">닉네임 설정</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-foreground/50 hover:text-foreground hover:bg-foreground/10 rounded-lg transition-all"
          >
            <FaTimes />
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 닉네임 입력 */}
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">
              닉네임
            </label>
            <input
              ref={inputRef}
              type="text"
              value={nickname}
              onChange={handleNicknameChange}
              placeholder="닉네임을 입력하세요"
              maxLength={12}
              disabled={loading}
              className={`w-full px-4 py-3 bg-background/60 border rounded-xl text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 transition-all ${
                error 
                  ? 'border-red-500/50 focus:ring-red-500/30' 
                  : 'border-primary/20 focus:border-primary/50 focus:ring-primary/20'
              }`}
            />
            
            {/* 글자 수 & 에러 메시지 */}
            <div className="flex items-center justify-between mt-2">
              <span className={`text-xs ${error ? 'text-red-500' : 'text-foreground/40'}`}>
                {error || '2-12자, 한글/영문/숫자/언더스코어'}
              </span>
              <span className="text-xs text-foreground/40">
                {nickname.length}/12
              </span>
            </div>
          </div>

          {/* 안내 */}
          <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl">
            <p className="text-sm text-foreground/60">
              💡 닉네임은 댓글, 랭킹, 활동 내역에 표시됩니다.
              <br />
              설정하지 않으면 &apos;익명&apos;으로 표시됩니다.
            </p>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 bg-foreground/10 text-foreground rounded-xl font-medium hover:bg-foreground/20 transition-all disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading || !!error}
              className="flex-1 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <FaCheck />
                  저장
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

