#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import csv
import glob
from datetime import datetime, timedelta
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('../.env.local')

url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

def get_sport_id(sport_name):
    try:
        response = supabase.table('sports').select('id').eq('name', sport_name).single().execute()
        if response.data:
            return response.data['id']
    except Exception as e:
        print(f"스포츠 ID 조회 오류: {e}")
    return None

def insert_game_data(game_data):
    sport_id = get_sport_id(game_data['sport'])
    if not sport_id:
        print(f"❌ 스포츠 ID를 찾을 수 없습니다: {game_data['sport']}")
        return False

    # start_time을 ISO 8601 형식으로 변환
    kst_time_str = f"{game_data['date']} {game_data['time']}"
    kst_datetime = datetime.strptime(kst_time_str, '%Y-%m-%d %H:%M')
    utc_datetime = kst_datetime - timedelta(hours=9) # KST to UTC
    start_time_iso = utc_datetime.isoformat() + "+00:00"

    data_to_insert = {
        "sport_id": sport_id,
        "home_team": game_data['homeTeam'],
        "away_team": game_data['awayTeam'],
        "start_time": start_time_iso,
        "end_time": None,
        "result": game_data['result'],
        "is_closed": game_data['status'] == '종료',
        "home_score": int(game_data['homeScore']) if game_data['homeScore'] and game_data['homeScore'].isdigit() else None,
        "away_score": int(game_data['awayScore']) if game_data['awayScore'] and game_data['awayScore'].isdigit() else None,
        "stadium": game_data['stadium'] if game_data['stadium'] else None,
    }

    try:
        response = supabase.table('games').insert([data_to_insert]).execute()
        if response.data:
            return True
        else:
            print(f"❌ 삽입 실패: {game_data['homeTeam']} vs {game_data['awayTeam']} - {response.error}")
            return False
    except Exception as e:
        print(f"❌ 예외 발생 중 삽입: {game_data['homeTeam']} vs {game_data['awayTeam']} - {e}")
        return False

def process_csv_files():
    """9월 22일~30일 CSV 파일들을 모두 처리"""
    print("🏟️ 9월 22일~30일 KBO 경기 데이터 일괄 삽입 시작")
    print("=" * 60)
    
    # 해당 날짜 범위의 CSV 파일들 찾기
    csv_files = []
    for date_num in range(22, 31):  # 22일부터 30일까지
        pattern = f"naver_2025-09-{date_num:02d}_*.csv"
        files = glob.glob(pattern)
        csv_files.extend(files)
    
    csv_files.sort()  # 날짜 순으로 정렬
    
    if not csv_files:
        print("❌ 처리할 CSV 파일을 찾을 수 없습니다.")
        return
    
    print(f"📁 발견된 CSV 파일: {len(csv_files)}개")
    for file in csv_files:
        print(f"  - {file}")
    print()
    
    total_games = 0
    total_success = 0
    
    for csv_file in csv_files:
        print(f"📄 처리 중: {csv_file}")
        
        try:
            with open(csv_file, mode='r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                games_in_file = 0
                success_in_file = 0
                
                for row in reader:
                    games_in_file += 1
                    game_data = {
                        'date': row['date'],
                        'homeTeam': row['homeTeam'],
                        'awayTeam': row['awayTeam'],
                        'homeScore': row['homeScore'],
                        'awayScore': row['awayScore'],
                        'result': row['result'],
                        'status': row['status'],
                        'time': row['time'],
                        'stadium': row['stadium'],
                        'sport': '야구'  # KBO 크롤러이므로 고정
                    }
                    
                    if insert_game_data(game_data):
                        success_in_file += 1
                        print(f"  ✅ {game_data['awayTeam']} vs {game_data['homeTeam']} ({game_data['date']} {game_data['time']})")
                    else:
                        print(f"  ❌ {game_data['awayTeam']} vs {game_data['homeTeam']} ({game_data['date']} {game_data['time']})")
                
                total_games += games_in_file
                total_success += success_in_file
                print(f"  📊 {csv_file}: {success_in_file}/{games_in_file} 성공")
                
        except Exception as e:
            print(f"  ❌ 파일 처리 실패: {e}")
        
        print()
    
    print("🎉 일괄 삽입 완료!")
    print(f"📊 총 경기: {total_games}개")
    print(f"✅ 성공: {total_success}개")
    print(f"❌ 실패: {total_games - total_success}개")
    print("=" * 60)

if __name__ == "__main__":
    process_csv_files()
