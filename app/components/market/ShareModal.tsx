'use client';

import { useState } from 'react';
import { FaTimes, FaLink, FaCheck } from 'react-icons/fa';
import { RiKakaoTalkFill } from 'react-icons/ri';
import { FaXTwitter } from 'react-icons/fa6';
import toast from 'react-hot-toast';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  market: {
    id: string;
    title: string;
    description?: string;
    yes_percentage: number;
    no_percentage: number;
  };
}

export default function ShareModal({ isOpen, onClose, market }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/markets/${market.id}` 
    : '';

  const shareText = `🎯 ${market.title}\n\nYES ${market.yes_percentage.toFixed(1)}% vs NO ${market.no_percentage.toFixed(1)}%\n\n지금 예측에 참여하세요!`;

  // 링크 복사
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('링크가 복사되었습니다!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('링크 복사에 실패했습니다.');
    }
  };

  // 카카오톡 공유
  const shareKakao = () => {
    if (typeof window !== 'undefined' && (window as any).Kakao) {
      const Kakao = (window as any).Kakao;
      
      if (!Kakao.isInitialized()) {
        // 카카오 SDK 초기화 (실제 앱 키 필요)
        // Kakao.init('YOUR_KAKAO_APP_KEY');
        toast.error('카카오톡 공유 준비 중입니다.');
        return;
      }

      Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: market.title,
          description: market.description || `YES ${market.yes_percentage.toFixed(1)}% vs NO ${market.no_percentage.toFixed(1)}%`,
          imageUrl: 'https://sportsprediction-rho.vercel.app/og-image.png',
          link: {
            mobileWebUrl: shareUrl,
            webUrl: shareUrl,
          },
        },
        buttons: [
          {
            title: '예측 참여하기',
            link: {
              mobileWebUrl: shareUrl,
              webUrl: shareUrl,
            },
          },
        ],
      });
    } else {
      // 카카오 SDK가 없으면 모바일 공유 시도
      const kakaoUrl = `https://story.kakao.com/share?url=${encodeURIComponent(shareUrl)}`;
      window.open(kakaoUrl, '_blank', 'width=600,height=400');
    }
  };

  // X(트위터) 공유
  const shareTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  // 네이티브 공유 (모바일)
  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: market.title,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        // 사용자가 취소한 경우 무시
        if ((error as Error).name !== 'AbortError') {
          toast.error('공유에 실패했습니다.');
        }
      }
    } else {
      copyLink();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-background/95 backdrop-blur-xl border border-primary/20 rounded-2xl sm:rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            공유하기
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-primary/10 rounded-xl transition-colors"
          >
            <FaTimes className="text-foreground/60" />
          </button>
        </div>

        {/* 마켓 미리보기 */}
        <div className="bg-background/60 border border-primary/10 rounded-xl p-4 mb-6">
          <p className="font-medium text-foreground line-clamp-2 mb-2">{market.title}</p>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-primary font-semibold">YES {market.yes_percentage.toFixed(1)}%</span>
            <span className="text-foreground/40">vs</span>
            <span className="text-secondary font-semibold">NO {market.no_percentage.toFixed(1)}%</span>
          </div>
        </div>

        {/* 공유 버튼들 */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {/* 카카오톡 */}
          <button
            onClick={shareKakao}
            className="flex flex-col items-center gap-2 p-4 bg-[#FEE500] hover:bg-[#FDD800] rounded-xl transition-all btn-press"
          >
            <RiKakaoTalkFill className="text-2xl text-[#3C1E1E]" />
            <span className="text-xs font-medium text-[#3C1E1E]">카카오톡</span>
          </button>

          {/* X(트위터) */}
          <button
            onClick={shareTwitter}
            className="flex flex-col items-center gap-2 p-4 bg-black hover:bg-gray-900 rounded-xl transition-all btn-press border border-white/10"
          >
            <FaXTwitter className="text-2xl text-white" />
            <span className="text-xs font-medium text-white">X</span>
          </button>

          {/* 링크 복사 */}
          <button
            onClick={copyLink}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all btn-press ${
              copied 
                ? 'bg-green-500 text-white' 
                : 'bg-primary/10 hover:bg-primary/20 text-primary'
            }`}
          >
            {copied ? (
              <FaCheck className="text-2xl" />
            ) : (
              <FaLink className="text-2xl" />
            )}
            <span className="text-xs font-medium">{copied ? '복사됨!' : '링크 복사'}</span>
          </button>
        </div>

        {/* 모바일 네이티브 공유 */}
        {typeof navigator !== 'undefined' && navigator.share && (
          <button
            onClick={nativeShare}
            className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl hover:opacity-90 transition-all btn-press"
          >
            📤 다른 앱으로 공유하기
          </button>
        )}
      </div>
    </div>
  );
}

