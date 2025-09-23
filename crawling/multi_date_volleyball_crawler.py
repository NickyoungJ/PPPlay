#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import time
import json
import csv
import re
import os
from datetime import datetime, timedelta
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup

def crawl_naver_volleyball_date(target_date):
    """네이버 스포츠 특정 날짜 배구 일정 크롤링"""
    
    print(f"🏐 네이버 스포츠 {target_date} 배구 크롤링 시작")
    print("-" * 50)
    
    # Chrome 설정
    options = Options()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1')
    
    driver = None
    games = []
    
    try:
        driver = webdriver.Chrome(options=options)
        driver.set_page_load_timeout(30)
        
        # 네이버 스포츠 배구 접속
        url = f'https://m.sports.naver.com/volleyball/schedule/index?date={target_date}'
        print(f"📡 접속: {url}")
        
        driver.get(url)
        time.sleep(5)
        
        # 페이지 로딩 대기
        try:
            WebDriverWait(driver, 15).until(
                lambda driver: driver.execute_script("return document.readyState") == "complete"
            )
        except:
            print("⚠️ 페이지 로딩 타임아웃")
        
        # 추가 로딩 대기
        time.sleep(3)
        
        # 현재 페이지 소스 확인
        page_source = driver.page_source
        soup = BeautifulSoup(page_source, 'html.parser')
        
        # 경기 없음 메시지 확인
        no_game_messages = [
            "경기가 없습니다",
            "일정이 없습니다", 
            "예정된 경기가 없습니다",
            "No games scheduled",
            "해당 날짜에 경기가 없습니다"
        ]
        
        page_text = soup.get_text()
        for msg in no_game_messages:
            if msg in page_text:
                print(f"📋 {target_date}에는 배구 경기가 없습니다: {msg}")
                return []
        
        # 배구 경기 리스트 찾기
        game_elements = soup.select('li.MatchBox_match_item__WiPhj')
        
        if not game_elements:
            print("❌ 경기 요소를 찾을 수 없습니다.")
            return []
        
        print(f"📊 총 {len(game_elements)}개 경기 발견")
        
        # 각 경기 정보 추출
        for idx, game_element in enumerate(game_elements):
            try:
                game_data = extract_volleyball_game_info(game_element, target_date, idx + 1)
                if game_data:
                    games.append(game_data)
                    status = "종료" if game_data['is_closed'] else "예정"
                    score_info = ""
                    if game_data['home_score'] is not None and game_data['away_score'] is not None:
                        score_info = f" ({game_data['away_score']}:{game_data['home_score']})"
                    print(f"✅ 경기 {idx + 1}: {game_data['away_team']} vs {game_data['home_team']} | {status}{score_info}")
                else:
                    print(f"❌ 경기 {idx + 1}: 정보 추출 실패")
                    
            except Exception as e:
                print(f"❌ 경기 {idx + 1} 처리 중 오류: {e}")
                continue
        
        print(f"✅ {target_date} 크롤링 완료: {len(games)}개 경기")
        return games
        
    except Exception as e:
        print(f"❌ {target_date} 크롤링 중 오류: {e}")
        return []
        
    finally:
        if driver:
            driver.quit()

def extract_volleyball_game_info(game_element, target_date, game_num):
    """배구 경기 정보 추출"""
    
    try:
        # 시간 정보 추출
        time_element = game_element.select_one('.MatchBox_time__Zt5-d')
        if time_element:
            time_text = time_element.get_text().strip()
            time_match = re.search(r'(\d{1,2}):(\d{2})', time_text)
            if time_match:
                game_time = f"{time_match.group(1).zfill(2)}:{time_match.group(2)}"
            else:
                game_time = "19:00"
        else:
            game_time = "19:00"
        
        # 경기 상태 확인
        status_element = game_element.select_one('.MatchBox_status__xU6\\+d')
        is_closed = False
        if status_element:
            status_text = status_element.get_text().strip()
            if status_text in ['종료', 'final', '완료']:
                is_closed = True
            elif '세트' in status_text or 'LIVE' in game_element.get_text():
                is_closed = False
        
        # 팀 정보 추출
        team_elements = game_element.select('.MatchBoxHeadToHeadArea_team_item__9ZknX')
        
        if len(team_elements) < 2:
            return None
        
        # 첫 번째 팀 (홈팀)
        home_team_element = team_elements[0].select_one('.MatchBoxHeadToHeadArea_team__l2ZxP')
        home_score_element = team_elements[0].select_one('.MatchBoxHeadToHeadArea_score__TChmp')
        
        # 두 번째 팀 (원정팀)
        away_team_element = team_elements[1].select_one('.MatchBoxHeadToHeadArea_team__l2ZxP')
        away_score_element = team_elements[1].select_one('.MatchBoxHeadToHeadArea_score__TChmp')
        
        if not home_team_element or not away_team_element:
            return None
        
        home_team = home_team_element.get_text().strip()
        away_team = away_team_element.get_text().strip()
        
        # 점수 정보 추출
        home_score = None
        away_score = None
        result = None
        
        if home_score_element and away_score_element:
            try:
                home_score = int(home_score_element.get_text().strip())
                away_score = int(away_score_element.get_text().strip())
                
                # 결과 판정
                if home_score > away_score:
                    result = "home_win"
                elif away_score > home_score:
                    result = "away_win"
                else:
                    result = "draw"
                    
            except (ValueError, AttributeError):
                pass
        
        # 승자 클래스 확인으로 결과 보정
        if team_elements[0].get('class') and 'type_winner' in ' '.join(team_elements[0].get('class', [])):
            result = "home_win"
        elif team_elements[1].get('class') and 'type_winner' in ' '.join(team_elements[1].get('class', [])):
            result = "away_win"
        
        start_time = f"{target_date}T{game_time}:00+09:00"
        
        game_data = {
            'home_team': home_team,
            'away_team': away_team,
            'start_time': start_time,
            'home_score': home_score,
            'away_score': away_score,
            'result': result,
            'is_closed': is_closed,
            'sport_id': 4,
            'sport_name': 'volleyball',
            'stadium': None
        }
        
        return game_data
        
    except Exception as e:
        print(f"  ❌ 경기 {game_num} 정보 추출 중 오류: {e}")
        return None

def crawl_multiple_dates(start_date, end_date):
    """여러 날짜의 배구 경기 크롤링"""
    
    print(f"🏐 배구 다중 날짜 크롤링 시작: {start_date} ~ {end_date}")
    print("=" * 60)
    
    all_games = []
    
    # 날짜 범위 생성
    start = datetime.strptime(start_date, '%Y-%m-%d')
    end = datetime.strptime(end_date, '%Y-%m-%d')
    
    current_date = start
    while current_date <= end:
        date_str = current_date.strftime('%Y-%m-%d')
        
        # 각 날짜별 크롤링
        games = crawl_naver_volleyball_date(date_str)
        
        if games:
            all_games.extend(games)
            print(f"📅 {date_str}: {len(games)}개 경기 수집")
        else:
            print(f"📅 {date_str}: 경기 없음")
        
        # 다음 날짜로
        current_date += timedelta(days=1)
        
        # 서버 부하 방지를 위한 대기
        time.sleep(2)
    
    print("\n" + "=" * 60)
    print(f"🎉 전체 크롤링 완료!")
    print(f"✅ 총 {len(all_games)}개 배구 경기 수집")
    
    return all_games

def save_volleyball_games_to_csv(games, filename_prefix):
    """배구 경기 데이터를 CSV 파일로 저장"""
    
    if not games:
        print("❌ 저장할 경기 데이터가 없습니다.")
        return None
    
    filename = f"{filename_prefix}.csv"
    
    try:
        with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = [
                'home_team', 'away_team', 'start_time', 
                'home_score', 'away_score', 'result', 'is_closed',
                'sport_id', 'sport_name', 'stadium'
            ]
            
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            
            for game in games:
                writer.writerow(game)
        
        print(f"💾 CSV 파일 저장 완료: {filename}")
        return filename
        
    except Exception as e:
        print(f"❌ CSV 저장 중 오류: {e}")
        return None

def main():
    """메인 실행 함수"""
    
    # 크롤링할 날짜 범위 설정
    start_date = "2025-09-24"
    end_date = "2025-09-26"
    
    print("🏐 네이버 스포츠 배구 다중 날짜 크롤러")
    print(f"📅 크롤링 기간: {start_date} ~ {end_date}")
    print("=" * 60)
    
    # 배구 경기 크롤링
    all_games = crawl_multiple_dates(start_date, end_date)
    
    if all_games:
        # CSV 파일로 저장
        filename_prefix = f"volleyball_games_{start_date.replace('-', '_')}_to_{end_date.replace('-', '_')}"
        csv_file = save_volleyball_games_to_csv(all_games, filename_prefix)
        
        # 결과 요약 출력
        print("\n📊 크롤링 결과 요약:")
        print("=" * 50)
        
        # 날짜별 그룹화
        games_by_date = {}
        for game in all_games:
            date = game['start_time'][:10]
            if date not in games_by_date:
                games_by_date[date] = []
            games_by_date[date].append(game)
        
        for date in sorted(games_by_date.keys()):
            print(f"\n📅 {date} ({len(games_by_date[date])}개 경기):")
            for i, game in enumerate(games_by_date[date], 1):
                status = "종료" if game['is_closed'] else "예정"
                score_info = ""
                if game['home_score'] is not None and game['away_score'] is not None:
                    score_info = f" ({game['away_score']}:{game['home_score']})"
                
                print(f"  {i}. {game['away_team']} vs {game['home_team']} | {game['start_time'][11:16]} | {status}{score_info}")
        
        print(f"\n✅ 총 {len(all_games)}개 배구 경기 크롤링 완료!")
        if csv_file:
            print(f"📁 저장된 파일: {csv_file}")
            
        return csv_file
    else:
        print(f"❌ {start_date} ~ {end_date} 기간에는 배구 경기가 없거나 크롤링에 실패했습니다.")
        return None

if __name__ == "__main__":
    main()
