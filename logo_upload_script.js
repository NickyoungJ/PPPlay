// KBO 팀 로고 업로드 스크립트 (JavaScript)
// 이 스크립트를 브라우저 콘솔에서 실행하거나 Next.js 프로젝트에서 사용

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mtuzltnvgokupkjprsdt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10dXpsdG52Z29rdXBranByc2R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNDA4NTksImV4cCI6MjA3MzgxNjg1OX0.0ejN0Am_AvQQZHfDEvpOvg92rircM6SHKIrDw7iD1YI'

const supabase = createClient(supabaseUrl, supabaseKey)

// 로고 파일 업로드 함수
async function uploadTeamLogo(file, teamName) {
  try {
    const fileName = `${teamName.toLowerCase()}-logo.png`
    
    const { data, error } = await supabase.storage
      .from('KBO_teamlogo')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true // 같은 파일명이 있으면 덮어쓰기
      })

    if (error) {
      console.error('업로드 에러:', error)
      return null
    }

    // 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from('KBO_teamlogo')
      .getPublicUrl(fileName)

    console.log(`${teamName} 로고 업로드 완료:`, urlData.publicUrl)
    return urlData.publicUrl

  } catch (error) {
    console.error('업로드 실패:', error)
    return null
  }
}

// KBO_team 테이블에 로고 URL 업데이트
async function updateTeamLogoUrl(teamName, logoUrl) {
  const { data, error } = await supabase
    .from('KBO_team')
    .update({ logo_url: logoUrl })
    .eq('name', teamName)

  if (error) {
    console.error(`${teamName} 로고 URL 업데이트 실패:`, error)
  } else {
    console.log(`${teamName} 로고 URL 업데이트 완료`)
  }
}

// 사용 예시
async function uploadAllLogos() {
  const teams = ['KIA', '삼성', 'LG', '두산', 'KT', 'SSG', '롯데', '한화', 'NC', '키움']
  
  for (const team of teams) {
    // 파일 선택 input을 통해 로고 파일을 선택하고 업로드
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = 'image/*'
    
    fileInput.onchange = async (e) => {
      const file = e.target.files[0]
      if (file) {
        const logoUrl = await uploadTeamLogo(file, team)
        if (logoUrl) {
          await updateTeamLogoUrl(team, logoUrl)
        }
      }
    }
    
    fileInput.click()
  }
}

// 실행
// uploadAllLogos()
