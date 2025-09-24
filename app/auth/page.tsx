'use client'

import { useState, useEffect } from 'react'
import { supabaseClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { FcGoogle } from 'react-icons/fc'
import { SiNaver } from 'react-icons/si'
import Link from 'next/link'

export default function AuthPage() {
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // 이미 로그인된 사용자는 메인 페이지로 리다이렉트
    const checkUser = async () => {
      const { data: { user } } = await supabaseClient.auth.getUser()
      if (user) {
        router.push('/games')
      }
    }
    checkUser()
  }, [router])

  const signInWithGoogle = async () => {
    try {
      setLoading(true)
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('Google 로그인 오류:', error)
      alert('Google 로그인에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  const signInWithNaver = async () => {
    try {
      setLoading(true)
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'naver',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('네이버 로그인 오류:', error)
      alert('네이버 로그인에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* 로고 및 헤더 */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              PPPlay
            </h1>
          </Link>
          <p className="mt-2 text-gray-300">
            {isSignUp ? '새로운 계정을 만들어보세요' : '계정에 로그인하세요'}
          </p>
        </div>

        {/* 인증 카드 */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 shadow-2xl">
          <div className="space-y-6">
            {/* 탭 전환 */}
            <div className="flex bg-slate-700/50 rounded-lg p-1">
              <button
                onClick={() => setIsSignUp(false)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  !isSignUp
                    ? 'bg-pink-600 text-white shadow-sm'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                로그인
              </button>
              <button
                onClick={() => setIsSignUp(true)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  isSignUp
                    ? 'bg-pink-600 text-white shadow-sm'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                회원가입
              </button>
            </div>

            {/* 소셜 로그인 버튼들 */}
            <div className="space-y-4">
              {/* Google 로그인 */}
              <button
                onClick={signInWithGoogle}
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-3 border border-slate-600 rounded-lg shadow-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FcGoogle className="h-5 w-5 mr-3" />
                <span className="text-gray-900 font-medium">
                  Google로 {isSignUp ? '회원가입' : '로그인'}
                </span>
              </button>

              {/* 네이버 로그인 */}
              <button
                onClick={signInWithNaver}
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-3 border border-slate-600 rounded-lg shadow-sm bg-[#03C75A] hover:bg-[#02b351] focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SiNaver className="h-5 w-5 mr-3 text-white" />
                <span className="text-white font-medium">
                  네이버로 {isSignUp ? '회원가입' : '로그인'}
                </span>
              </button>
            </div>

            {/* 로딩 상태 */}
            {loading && (
              <div className="text-center">
                <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-pink-600">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  인증 중...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 이용약관 및 개인정보처리방침 */}
        <div className="text-center text-sm text-gray-400">
          {isSignUp && (
            <p className="mb-2">
              회원가입 시{' '}
              <Link href="/terms" className="text-pink-400 hover:text-pink-300">
                이용약관
              </Link>
              {' '}및{' '}
              <Link href="/privacy" className="text-pink-400 hover:text-pink-300">
                개인정보처리방침
              </Link>
              에 동의하게 됩니다.
            </p>
          )}
          <Link href="/" className="text-pink-400 hover:text-pink-300">
            ← 메인으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  )
}
