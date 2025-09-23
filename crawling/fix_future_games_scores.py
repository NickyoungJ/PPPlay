#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('../.env.local')

url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

def fix_future_games():
    """9월 23일 이후 미래 경기의 잘못된 점수 데이터 수정"""
    print("🔧 미래 경기 점수 데이터 수정 시작")
    print("=" * 50)
    
    try:
        # 9월 23일 이후 경기 조회
        games_result = supabase.table('games').select('*').gte('start_time', '2025-09-23T00:00:00+00:00').execute()
        
        if not games_result.data:
            print("❌ 수정할 경기 데이터가 없습니다.")
            return
        
        print(f"📊 총 {len(games_result.data)}개 경기 발견")
        print()
        
        fixed_count = 0
        
        for game in games_result.data:
            game_id = game['id']
            home_score = game.get('home_score')
            away_score = game.get('away_score')
            is_closed = game.get('is_closed', False)
            
            # 현재 시간과 비교하여 미래 경기인지 확인
            game_time = datetime.fromisoformat(game['start_time'].replace('Z', '+00:00'))
            current_time = datetime.now()
            
            # 미래 경기이거나 잘못된 점수 패턴인 경우
            should_fix = False
            
            # 18:30 -> 30:18 패턴
            if home_score == 18 and away_score == 30:
                should_fix = True
                reason = "18:30 시간이 30:18 점수로 잘못 저장됨"
            
            # 17:00 -> 0:17 패턴  
            elif home_score == 17 and away_score == 0:
                should_fix = True
                reason = "17:00 시간이 0:17 점수로 잘못 저장됨"
            
            # 14:00 -> 0:14 패턴
            elif home_score == 14 and away_score == 0:
                should_fix = True
                reason = "14:00 시간이 0:14 점수로 잘못 저장됨"
            
            if should_fix:
                # 점수를 NULL로, is_closed를 False로 설정
                update_data = {
                    'home_score': None,
                    'away_score': None,
                    'is_closed': False,
                    'result': None
                }
                
                update_result = supabase.table('games').update(update_data).eq('id', game_id).execute()
                
                if update_result.data:
                    date_str = game['start_time'][:10]
                    time_str = game['start_time'][11:16]
                    print(f"✅ {date_str} {time_str} | {game['away_team']} vs {game['home_team']} | {reason}")
                    fixed_count += 1
                else:
                    print(f"❌ 수정 실패: {game['away_team']} vs {game['home_team']}")
        
        print()
        print(f"🎉 수정 완료!")
        print(f"✅ 총 {fixed_count}개 경기 수정")
        print("=" * 50)
        
        # 수정 결과 확인
        print("\n📋 수정 후 상태 확인:")
        verification_result = supabase.table('games').select('*').gte('start_time', '2025-09-23T00:00:00+00:00').order('start_time').execute()
        
        if verification_result.data:
            for game in verification_result.data:
                date_str = game['start_time'][:10]
                time_str = game['start_time'][11:16]
                home_score = game.get('home_score') or 'N/A'
                away_score = game.get('away_score') or 'N/A'
                is_closed = '종료' if game.get('is_closed', False) else '예정'
                
                print(f"{date_str} {time_str} | {game['away_team']} vs {game['home_team']} | {away_score}:{home_score} | {is_closed}")
        
    except Exception as e:
        print(f"❌ 오류 발생: {e}")

if __name__ == "__main__":
    fix_future_games()
