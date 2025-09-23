#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import csv
import json
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv('../.env.local')

# Supabase 클라이언트 초기화
url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

print(f"🔐 Supabase 연결: Anon 키 사용")

def import_epl_games_from_csv(csv_file_path):
    """CSV 파일에서 EPL 경기 데이터를 읽어서 Supabase에 삽입"""
    
    print(f"⚽ EPL 경기 데이터 Supabase 업로드 시작")
    print(f"📁 파일: {csv_file_path}")
    print("=" * 60)
    
    if not os.path.exists(csv_file_path):
        print(f"❌ 파일을 찾을 수 없습니다: {csv_file_path}")
        return False
    
    success_count = 0
    error_count = 0
    
    try:
        with open(csv_file_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            
            for row_num, row in enumerate(reader, 1):
                try:
                    # 데이터 전처리
                    game_data = prepare_epl_game_data(row)
                    
                    # Supabase에 삽입
                    result = supabase.table('soccer_games').insert(game_data).execute()
                    
                    if result.data:
                        status = "종료" if game_data['is_closed'] else "예정"
                        score_info = ""
                        if game_data['home_score'] is not None and game_data['away_score'] is not None:
                            score_info = f" ({game_data['away_score']}:{game_data['home_score']})"
                        print(f"✅ 경기 {row_num}: {row['away_team']} vs {row['home_team']} | {status}{score_info} 업로드 완료")
                        success_count += 1
                    else:
                        print(f"❌ 경기 {row_num}: 업로드 실패 - 응답 데이터 없음")
                        error_count += 1
                        
                except Exception as e:
                    print(f"❌ 경기 {row_num}: {row.get('away_team', 'Unknown')} vs {row.get('home_team', 'Unknown')} - {str(e)}")
                    error_count += 1
                    continue
        
        print("\n" + "=" * 60)
        print(f"🎉 EPL 데이터 업로드 완료!")
        print(f"✅ 성공: {success_count}개")
        print(f"❌ 실패: {error_count}개")
        
        return error_count == 0
        
    except Exception as e:
        print(f"❌ CSV 파일 읽기 오류: {e}")
        return False

def prepare_epl_game_data(row):
    """CSV 행 데이터를 Supabase 삽입용 데이터로 변환"""
    
    # 점수 데이터 처리
    home_score = None
    away_score = None
    
    if row['home_score'] and row['home_score'].strip():
        try:
            home_score = int(row['home_score'])
        except ValueError:
            pass
    
    if row['away_score'] and row['away_score'].strip():
        try:
            away_score = int(row['away_score'])
        except ValueError:
            pass
    
    # is_closed 처리
    is_closed = False
    if row['is_closed'].lower() in ['true', '1', 'yes']:
        is_closed = True
    
    # 경기 상태 결정
    match_status = "종료" if is_closed else "예정"
    if not is_closed and home_score is not None and away_score is not None:
        match_status = "진행중"
    
    game_data = {
        'home_team': row['home_team'].strip(),
        'away_team': row['away_team'].strip(),
        'start_time': row['start_time'],
        'home_score': home_score,
        'away_score': away_score,
        'result': row['result'] if row['result'] and row['result'].strip() else None,
        'is_closed': is_closed,
        'sport_id': 2,  # 축구
        'sport_name': 'soccer',
        'stadium': row.get('stadium') if row.get('stadium') and row.get('stadium').strip() else None,
        'league_name': row['league_name'],  # EPL
        'league_type': row['league_type'],  # epl
        'round_info': None,
        'match_status': match_status,
        'crawled_from': 'naver_sports',
        'crawled_at': datetime.now().isoformat()
    }
    
    return game_data

def verify_epl_upload():
    """업로드된 데이터 검증"""
    
    print("\n📊 업로드된 데이터 검증 중...")
    
    try:
        # 전체 축구 경기 수 확인
        result = supabase.table('soccer_games').select('*', count='exact').execute()
        total_games = len(result.data) if result.data else 0
        
        print(f"📈 총 축구 경기 수: {total_games}개")
        
        if total_games > 0:
            # EPL 경기만 확인
            epl_games = supabase.table('soccer_games').select('*').eq('league_type', 'epl').order('created_at', desc=True).limit(10).execute()
            
            print(f"⚽ EPL 경기 수: {len(epl_games.data)}개")
            print("\n📋 최근 업로드된 EPL 경기:")
            print("-" * 50)
            
            for i, game in enumerate(epl_games.data[:5], 1):
                status = "종료" if game['is_closed'] else "예정"
                score_info = ""
                if game['home_score'] is not None and game['away_score'] is not None:
                    score_info = f" ({game['away_score']}:{game['home_score']})"
                
                start_time = game['start_time'][:16].replace('T', ' ')
                print(f"{i}. {game['away_team']} vs {game['home_team']}")
                print(f"   📅 {start_time} | {status}{score_info}")
        
        return True
        
    except Exception as e:
        print(f"❌ 데이터 검증 중 오류: {e}")
        return False

def main():
    """메인 실행 함수"""
    
    # 크롤링된 CSV 파일 경로
    csv_file = "epl_games_2025_09_27_fixed.csv"
    
    print("⚽ EPL 데이터 Supabase 업로드 도구")
    print("=" * 60)
    
    # 1. CSV 파일에서 데이터 업로드
    if import_epl_games_from_csv(csv_file):
        print("✅ 데이터 업로드 성공!")
        
        # 2. 업로드된 데이터 검증
        verify_epl_upload()
        
    else:
        print("❌ 데이터 업로드 실패!")
        return False
    
    print("\n🎉 모든 작업이 완료되었습니다!")
    print("👀 Supabase 대시보드에서 soccer_games 테이블을 확인해보세요!")

if __name__ == "__main__":
    main()
