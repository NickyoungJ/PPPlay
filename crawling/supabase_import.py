#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import csv
import sys
from datetime import datetime
from typing import List, Dict, Any

# Supabase 클라이언트 import
try:
    from supabase import create_client, Client
except ImportError:
    print("❌ supabase 패키지가 설치되지 않았습니다.")
    print("다음 명령어로 설치해주세요: pip install supabase")
    sys.exit(1)

# 환경 변수 로드
try:
    from dotenv import load_dotenv
    load_dotenv('../.env.local')
except ImportError:
    print("❌ python-dotenv 패키지가 설치되지 않았습니다.")
    print("다음 명령어로 설치해주세요: pip install python-dotenv")
    sys.exit(1)

# Supabase 설정
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Supabase 환경 변수가 설정되지 않았습니다.")
    print("NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 확인해주세요.")
    sys.exit(1)

# Supabase 클라이언트 생성
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def load_csv_data(file_path: str) -> List[Dict[str, Any]]:
    """CSV 파일에서 데이터를 로드합니다."""
    games = []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            
            for row in reader:
                # 데이터 변환
                game_data = {
                    'sport_id': 1,  # 야구 = 1
                    'home_team': row['homeTeam'],
                    'away_team': row['awayTeam'],
                    'start_time': f"{row['date']}T{row['time']}:00+09:00",  # ISO 8601 형식
                    'home_score': int(row['homeScore']) if row['homeScore'] else None,
                    'away_score': int(row['awayScore']) if row['awayScore'] else None,
                    'result': row['result'] if row['result'] else None,
                    'is_closed': row['status'] == '종료',
                    'stadium': row['stadium'],
                    'created_at': datetime.now().isoformat(),
                    'updated_at': datetime.now().isoformat()
                }
                
                games.append(game_data)
                
        print(f"✅ {len(games)}개의 경기 데이터를 로드했습니다.")
        return games
        
    except FileNotFoundError:
        print(f"❌ 파일을 찾을 수 없습니다: {file_path}")
        return []
    except Exception as e:
        print(f"❌ CSV 로드 중 오류 발생: {e}")
        return []

def insert_games_to_supabase(games: List[Dict[str, Any]]) -> bool:
    """게임 데이터를 Supabase에 삽입합니다."""
    try:
        # 기존 데이터 중복 확인 및 삽입
        success_count = 0
        duplicate_count = 0
        error_count = 0
        
        for game in games:
            try:
                # 중복 확인 (같은 날짜, 같은 팀 매치업)
                existing = supabase.table('games').select('id').eq('home_team', game['home_team']).eq('away_team', game['away_team']).eq('start_time', game['start_time']).execute()
                
                if existing.data:
                    print(f"⚠️  중복 데이터: {game['away_team']} vs {game['home_team']} ({game['start_time'][:10]})")
                    duplicate_count += 1
                    continue
                
                # 데이터 삽입
                result = supabase.table('games').insert(game).execute()
                
                if result.data:
                    print(f"✅ 삽입 성공: {game['away_team']} vs {game['home_team']} ({game['start_time'][:10]})")
                    success_count += 1
                else:
                    print(f"❌ 삽입 실패: {game['away_team']} vs {game['home_team']}")
                    error_count += 1
                    
            except Exception as e:
                print(f"❌ 개별 삽입 오류: {game['away_team']} vs {game['home_team']} - {e}")
                error_count += 1
        
        print("\n" + "="*60)
        print(f"📊 삽입 결과:")
        print(f"   ✅ 성공: {success_count}개")
        print(f"   ⚠️  중복: {duplicate_count}개")
        print(f"   ❌ 실패: {error_count}개")
        print("="*60)
        
        return success_count > 0
        
    except Exception as e:
        print(f"❌ Supabase 삽입 중 오류 발생: {e}")
        return False

def main():
    """메인 실행 함수"""
    print("🏟️ 야구 데이터 Supabase 업로드 시작")
    print("=" * 60)
    
    # CSV 파일 경로 찾기
    csv_files = [f for f in os.listdir('.') if f.endswith('.csv') and 'naver' in f]
    
    if not csv_files:
        print("❌ CSV 파일을 찾을 수 없습니다.")
        return
    
    # 가장 최근 파일 선택
    csv_file = sorted(csv_files)[-1]
    print(f"📁 사용할 파일: {csv_file}")
    
    # 데이터 로드
    games = load_csv_data(csv_file)
    
    if not games:
        print("❌ 로드할 데이터가 없습니다.")
        return
    
    # Supabase에 삽입
    success = insert_games_to_supabase(games)
    
    if success:
        print("\n🎉 데이터 업로드가 완료되었습니다!")
        print("웹 앱에서 경기 데이터를 확인해보세요: http://localhost:3000/games")
    else:
        print("\n❌ 데이터 업로드에 실패했습니다.")

if __name__ == "__main__":
    main()
