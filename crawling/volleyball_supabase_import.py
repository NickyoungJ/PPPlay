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

# Supabase 클라이언트 초기화 (서비스 키 사용)
url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
service_key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
anon_key: str = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

# 서비스 키가 있으면 사용, 없으면 anon 키 사용
key = service_key if service_key else anon_key
supabase: Client = create_client(url, key)

print(f"🔐 Supabase 연결: {'서비스 키' if service_key else 'Anon 키'} 사용")

def import_volleyball_games_from_csv(csv_file_path):
    """CSV 파일에서 배구 경기 데이터를 읽어서 Supabase에 삽입"""
    
    print(f"🏐 배구 경기 데이터 Supabase 업로드 시작")
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
                    game_data = prepare_volleyball_game_data(row)
                    
                    # Supabase에 삽입
                    result = supabase.table('volleyball_games').insert(game_data).execute()
                    
                    if result.data:
                        print(f"✅ 경기 {row_num}: {row['away_team']} vs {row['home_team']} 업로드 완료")
                        success_count += 1
                    else:
                        print(f"❌ 경기 {row_num}: 업로드 실패 - 응답 데이터 없음")
                        error_count += 1
                        
                except Exception as e:
                    print(f"❌ 경기 {row_num}: {row.get('away_team', 'Unknown')} vs {row.get('home_team', 'Unknown')} - {str(e)}")
                    error_count += 1
                    continue
        
        print("\n" + "=" * 60)
        print(f"🎉 배구 데이터 업로드 완료!")
        print(f"✅ 성공: {success_count}개")
        print(f"❌ 실패: {error_count}개")
        
        return error_count == 0
        
    except Exception as e:
        print(f"❌ CSV 파일 읽기 오류: {e}")
        return False

def prepare_volleyball_game_data(row):
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
    
    # 리그 정보 추출 (팀명으로 구분)
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
        'sport_id': 4,  # 배구
        'sport_name': 'volleyball',
        'stadium': row.get('stadium') if row.get('stadium') and row.get('stadium').strip() else None,
        'league_name': league_name,
        'league_type': league_type,
        'round_info': round_info,
        'match_status': match_status,
        'crawled_from': 'naver_sports',
        'crawled_at': datetime.now().isoformat()
    }
    
    return game_data

def update_team_ids():
    """volleyball_games 테이블의 팀 ID를 volleyball_teams 테이블과 연결"""
    
    print("\n🔗 팀 ID 연결 작업 시작...")
    
    try:
        # 홈팀 ID 업데이트
        home_result = supabase.rpc('update_volleyball_home_team_ids').execute()
        print("✅ 홈팀 ID 업데이트 완료")
        
        # 원정팀 ID 업데이트
        away_result = supabase.rpc('update_volleyball_away_team_ids').execute()
        print("✅ 원정팀 ID 업데이트 완료")
        
    except Exception as e:
        print(f"⚠️ 팀 ID 연결 중 오류 (수동으로 SQL 실행 필요): {e}")

def verify_upload():
    """업로드된 데이터 검증"""
    
    print("\n📊 업로드된 데이터 검증 중...")
    
    try:
        # 전체 배구 경기 수 확인
        result = supabase.table('volleyball_games').select('*', count='exact').execute()
        total_games = len(result.data) if result.data else 0
        
        print(f"📈 총 배구 경기 수: {total_games}개")
        
        if total_games > 0:
            # 최근 경기 5개 표시
            recent_games = supabase.table('volleyball_games').select('*').order('created_at', desc=True).limit(5).execute()
            
            print("\n📋 최근 업로드된 경기:")
            print("-" * 50)
            
            for i, game in enumerate(recent_games.data, 1):
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
    csv_file = "volleyball_games_2025_09_24_to_2025_09_26.csv"
    
    print("🏐 배구 데이터 Supabase 업로드 도구")
    print("=" * 60)
    
    # 1. CSV 파일에서 데이터 업로드
    if import_volleyball_games_from_csv(csv_file):
        print("✅ 데이터 업로드 성공!")
        
        # 2. 팀 ID 연결 (선택사항)
        # update_team_ids()
        
        # 3. 업로드된 데이터 검증
        verify_upload()
        
    else:
        print("❌ 데이터 업로드 실패!")
        return False
    
    print("\n🎉 모든 작업이 완료되었습니다!")
    print("👀 Supabase 대시보드에서 volleyball_games 테이블을 확인해보세요!")

if __name__ == "__main__":
    main()
