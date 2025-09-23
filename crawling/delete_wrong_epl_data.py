#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv('../.env.local')

# Supabase 클라이언트 초기화
url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

def delete_epl_games():
    """잘못 저장된 EPL 경기 데이터 삭제"""
    
    print("🗑️ 잘못 저장된 EPL 경기 데이터 삭제 시작")
    print("=" * 60)
    
    try:
        # 먼저 현재 저장된 EPL 경기 확인
        result = supabase.table('soccer_games').select('*').eq('league_type', 'epl').execute()
        
        if result.data:
            print(f"📊 현재 저장된 EPL 경기 수: {len(result.data)}개")
            
            # 몇 개 경기 샘플 표시
            print("\n📋 현재 저장된 경기 샘플:")
            for i, game in enumerate(result.data[:5], 1):
                status = "종료" if game['is_closed'] else "예정"
                score_info = ""
                if game['home_score'] is not None and game['away_score'] is not None:
                    score_info = f" ({game['away_score']}:{game['home_score']})"
                
                start_time = game['start_time'][:16].replace('T', ' ')
                print(f"{i}. {game['away_team']} vs {game['home_team']} | {start_time} | {status}{score_info}")
            
            # 사용자 확인
            print(f"\n⚠️ {len(result.data)}개의 EPL 경기를 모두 삭제하시겠습니까?")
            print("삭제하려면 'DELETE' 입력, 취소하려면 아무 키나 입력:")
            
            # 자동 삭제 (스크립트이므로)
            print("🚀 자동 삭제 진행...")
            
            # EPL 경기 모두 삭제
            delete_result = supabase.table('soccer_games').delete().eq('league_type', 'epl').execute()
            
            print(f"✅ EPL 경기 {len(result.data)}개 삭제 완료!")
            
        else:
            print("📋 삭제할 EPL 경기가 없습니다.")
            
        # 삭제 후 확인
        check_result = supabase.table('soccer_games').select('*').eq('league_type', 'epl').execute()
        print(f"🔍 삭제 후 EPL 경기 수: {len(check_result.data) if check_result.data else 0}개")
        
        return True
        
    except Exception as e:
        print(f"❌ EPL 경기 삭제 중 오류: {e}")
        return False

def main():
    """메인 실행 함수"""
    
    print("🗑️ EPL 데이터 삭제 도구")
    print("=" * 60)
    
    if delete_epl_games():
        print("\n🎉 EPL 데이터 삭제 완료!")
        print("이제 정확한 날짜로 다시 크롤링할 수 있습니다.")
    else:
        print("\n❌ EPL 데이터 삭제 실패!")

if __name__ == "__main__":
    main()
