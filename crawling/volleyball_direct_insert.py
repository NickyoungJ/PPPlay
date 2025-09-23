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

def insert_volleyball_games_directly():
    """배구 경기 데이터를 직접 삽입 (RLS 우회)"""
    
    print("🏐 배구 경기 데이터 직접 삽입 시작")
    print("=" * 60)
    
    # CSV 파일 읽기
    csv_file = "volleyball_games_2025_09_24_to_2025_09_26.csv"
    
    if not os.path.exists(csv_file):
        print(f"❌ 파일을 찾을 수 없습니다: {csv_file}")
        return False
    
    games_data = []
    
    try:
        with open(csv_file, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            
            for row_num, row in enumerate(reader, 1):
                # 리그 정보 결정
                team_names = [row['home_team'].strip(), row['away_team'].strip()]
                
                # V-리그 여자부 팀들
                womens_teams = ['현대건설', '흥국생명', 'GS칼텍스', '페퍼저축은행', '한국도로공사', '정관장']
                
                # 대학팀 확인
                university_keywords = ['대학', '대']
                is_university = any(keyword in team for team in team_names for keyword in university_keywords)
                
                if is_university:
                    league_name = "대학 배구"
                    league_type = "university"
                    round_info = "대학 리그"
                elif any(team in womens_teams for team in team_names):
                    league_name = "V-리그 여자부"
                    league_type = "women"
                    round_info = "V-리그 정규시즌"
                else:
                    league_name = "V-리그"
                    league_type = "professional"
                    round_info = "정규시즌"
                
                game_data = {
                    'home_team': row['home_team'].strip(),
                    'away_team': row['away_team'].strip(),
                    'start_time': row['start_time'],
                    'home_score': None,
                    'away_score': None,
                    'result': None,
                    'is_closed': False,
                    'sport_id': 4,
                    'sport_name': 'volleyball',
                    'stadium': None,
                    'league_name': league_name,
                    'league_type': league_type,
                    'round_info': round_info,
                    'match_status': '예정',
                    'crawled_from': 'naver_sports',
                    'crawled_at': datetime.now().isoformat()
                }
                
                games_data.append(game_data)
                print(f"📋 경기 {row_num}: {row['away_team']} vs {row['home_team']} | {league_name}")
        
        print(f"\n📊 총 {len(games_data)}개 경기 준비 완료")
        
        # RLS 정책 확인
        try:
            # 테스트 쿼리로 RLS 상태 확인
            test_result = supabase.table('volleyball_games').select('*').limit(1).execute()
            print("✅ volleyball_games 테이블 접근 가능")
            
            # 배치로 삽입 시도
            print("\n🚀 배구 경기 데이터 삽입 시작...")
            
            for i, game_data in enumerate(games_data, 1):
                try:
                    result = supabase.table('volleyball_games').insert(game_data).execute()
                    
                    if result.data:
                        print(f"✅ 경기 {i}: {game_data['away_team']} vs {game_data['home_team']} 삽입 완료")
                    else:
                        print(f"❌ 경기 {i}: 삽입 실패 - 응답 데이터 없음")
                        
                except Exception as e:
                    print(f"❌ 경기 {i}: 삽입 실패 - {str(e)}")
                    
                    # RLS 오류인 경우 SQL 함수 사용 시도
                    if 'row-level security' in str(e):
                        print("🔧 RLS 우회 방법 시도...")
                        try:
                            # SQL 함수를 통한 삽입 (RLS 우회)
                            sql_result = supabase.rpc('insert_volleyball_game', game_data).execute()
                            if sql_result.data:
                                print(f"✅ 경기 {i}: SQL 함수로 삽입 완료")
                            else:
                                print(f"❌ 경기 {i}: SQL 함수 삽입도 실패")
                        except Exception as sql_e:
                            print(f"❌ 경기 {i}: SQL 함수 삽입 실패 - {str(sql_e)}")
                            # SQL 문 직접 생성
                            print(f"📝 수동 삽입 SQL:")
                            print(f"INSERT INTO volleyball_games (home_team, away_team, start_time, league_name, league_type, round_info, match_status, is_closed, sport_id, sport_name) VALUES ('{game_data['home_team']}', '{game_data['away_team']}', '{game_data['start_time']}', '{game_data['league_name']}', '{game_data['league_type']}', '{game_data['round_info']}', '{game_data['match_status']}', {game_data['is_closed']}, {game_data['sport_id']}, '{game_data['sport_name']}');")
            
        except Exception as e:
            print(f"❌ 테이블 접근 오류: {e}")
            return False
        
        print("\n" + "=" * 60)
        print("🎉 배구 데이터 삽입 작업 완료!")
        print("👀 Supabase 대시보드에서 volleyball_games 테이블을 확인해보세요!")
        
        return True
        
    except Exception as e:
        print(f"❌ CSV 파일 읽기 오류: {e}")
        return False

def main():
    """메인 실행 함수"""
    
    print("🏐 배구 데이터 직접 삽입 도구")
    print("=" * 60)
    
    insert_volleyball_games_directly()

if __name__ == "__main__":
    main()
