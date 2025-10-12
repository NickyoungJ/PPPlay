import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error_param = searchParams.get('error')
  const error_description = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/games'

  console.log('🔐 OAuth Callback - Full URL:', request.url)
  console.log('🔐 OAuth Callback - Code:', code ? `Present (${code.substring(0, 10)}...)` : 'Missing')
  console.log('🔐 OAuth Callback - Error Param:', error_param)
  console.log('🔐 OAuth Callback - Error Description:', error_description)
  console.log('🔐 OAuth Callback - All Params:', Object.fromEntries(searchParams.entries()))
  console.log('🔐 OAuth Callback - Headers:', Object.fromEntries(request.headers.entries()))

  // OAuth 에러가 있는 경우
  if (error_param) {
    console.error('❌ OAuth Provider Error:', error_param, error_description)
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(error_param + ': ' + (error_description || 'Unknown error'))}`)
  }

  if (code) {
    try {
      const supabase = createClient()
      console.log('🔐 Attempting to exchange code for session...')
      
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      console.log('🔐 OAuth Exchange Result:', { 
        success: !error, 
        error: error?.message,
        user: data?.user?.email,
        session: data?.session ? 'Present' : 'Missing'
      })
      
      if (!error && data?.user && data?.session) {
        console.log('✅ OAuth Success - User:', data.user.email)
        console.log('✅ OAuth Success - Redirecting to:', next)
        return NextResponse.redirect(`${origin}${next}`)
      } else {
        console.error('❌ OAuth Error:', error?.message || 'No user or session')
        return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(error?.message || 'authentication_failed')}`)
      }
    } catch (err) {
      console.error('❌ OAuth Exception:', err)
      return NextResponse.redirect(`${origin}/auth?error=server_error`)
    }
  }

  console.log('❌ No code parameter found')
  return NextResponse.redirect(`${origin}/auth?error=no_code`)
}
