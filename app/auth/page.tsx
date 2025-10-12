'use client'

import { useState, useEffect } from 'react'
import { supabaseClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { FcGoogle } from 'react-icons/fc'
import { SiKakao } from 'react-icons/si'
import Link from 'next/link'

export default function AuthPage() {
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // URL에서 오류 메시지 확인
    const errorParam = searchParams.get('error')
    if (errorParam) {
      setError(decodeURIComponent(errorParam))
    }

    // 이미 로그인된 사용자는 메인 페이지로 리다이렉트
    const checkUser = async () => {
      const { data: { user } } = await supabaseClient.auth.getUser()
      if (user) {
        router.push('/games')
      }
    }
    checkUser()
  }, [router, searchParams])

  const signInWithGoogle = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔐 Starting Google OAuth...')
      console.log('🔐 Redirect URL:', `${window.location.origin}/auth/callback`)
      
      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })
      
      console.log('🔐 OAuth signInWithOAuth result:', { data, error })
      
      console.log('🔐 OAuth Response:', { data, error })
      
      if (error) throw error
    } catch (error) {
      console.error('❌ Google 로그인 오류:', error)
      setError(`Google 로그인 실패: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const signInWithKakao = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔐 Starting Kakao OAuth...')
      console.log('🔐 Redirect URL:', `${window.location.origin}/auth/callback`)
      console.log('🔐 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      
      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            scope: 'profile_nickname account_email'  // 닉네임과 이메일 요청
          }
        }
      })
      
      console.log('🔐 Kakao OAuth Response:', { data, error })
      console.log('🔐 OAuth URL:', data?.url)
      
      if (error) throw error
    } catch (error) {
      console.error('❌ Kakao 로그인 오류:', error)
      setError(`Kakao 로그인 실패: ${error.message}`)
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

            {/* 오류 메시지 */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-red-300 text-sm">
                    {error === 'no_code' && '인증 코드가 없습니다. 다시 시도해주세요.'}
                    {error === 'server_error' && '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'}
                    {error.includes('authentication_failed') && '인증에 실패했습니다. 다시 시도해주세요.'}
                    {!['no_code', 'server_error'].includes(error) && !error.includes('authentication_failed') && error}
                  </p>
                  <button
                    onClick={() => setError(null)}
                    className="ml-auto text-red-400 hover:text-red-300"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

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

              {/* 카카오 로그인 */}
              <button
                onClick={signInWithKakao}
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-3 border border-slate-600 rounded-lg shadow-sm bg-[#FEE500] hover:bg-[#FCDD00] focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SiKakao className="h-5 w-5 mr-3 text-black" />
                <span className="text-black font-medium">
                  카카오로 {isSignUp ? '회원가입' : '로그인'}
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
