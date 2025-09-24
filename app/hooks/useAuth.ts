'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabaseClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // 초기 세션 확인
    const getInitialSession = async () => {
      const { data: { session } } = await supabaseClient.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // 인증 상태 변화 감지
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)

        // 로그인 성공 시 게임 페이지로 이동
        if (event === 'SIGNED_IN' && session?.user) {
          router.push('/games')
        }

        // 로그아웃 시 메인 페이지로 이동
        if (event === 'SIGNED_OUT') {
          router.push('/')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router])

  const signOut = async () => {
    try {
      const { error } = await supabaseClient.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('로그아웃 오류:', error)
      alert('로그아웃에 실패했습니다.')
    }
  }

  return {
    user,
    loading,
    signOut,
    isAuthenticated: !!user
  }
}
