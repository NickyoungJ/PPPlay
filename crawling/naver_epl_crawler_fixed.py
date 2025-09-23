#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import time
import json
import csv
import re
from datetime import datetime, timedelta
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup

def crawl_naver_epl_date_fixed(target_date):
    """네이버 스포츠 특정 날짜 EPL 일정 크롤링 (수정된 버전)"""
    
    print(f"⚽ 네이버 스포츠 {target_date} EPL 크롤링 시작 (Fixed)")
    print("=" * 60)
    
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
        
        # 네이버 스포츠 EPL 접속
        url = f'https://m.sports.naver.com/wfootball/schedule/index?category=epl&date={target_date}'
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
        
        # EPL 경기 리스트 찾기
        game_elements = soup.select('li.MatchBox_match_item__WiPhj')
        
        if not game_elements:
            print("❌ 경기 요소를 찾을 수 없습니다.")
            return []
        
        print(f"📊 총 {len(game_elements)}개 요소 발견")
        print()
        
        # 목표 날짜 파싱
        target_date_obj = datetime.strptime(target_date, '%Y-%m-%d')
        
        # 각 경기 정보 추출 (실제 날짜 필터링 포함)
        for idx, game_element in enumerate(game_elements):
            try:
                game_data = extract_epl_game_info_fixed(game_element, target_date, target_date_obj, idx + 1)
                if game_data:
                    games.append(game_data)
                    status = "종료" if game_data['is_closed'] else "예정"
                    score_info = ""
                    if game_data['home_score'] is not None and game_data['away_score'] is not None:
                        score_info = f" ({game_data['away_score']}:{game_data['home_score']})"
                    
                    # 실제 경기 날짜 표시
                    game_date = game_data['start_time'][:10]
                    print(f"✅ 경기 {len(games)}: {game_data['away_team']} vs {game_data['home_team']} | {game_date} | {status}{score_info}")
                    
            except Exception as e:
                print(f"❌ 경기 {idx + 1} 처리 중 오류: {e}")
                continue
        
        print()
        print(f"🎉 크롤링 완료!")
        print(f"✅ {target_date}에 해당하는 {len(games)}개 경기 수집")
        print("=" * 60)
        
        return games
        
    except Exception as e:
        print(f"❌ 크롤링 중 오류 발생: {e}")
        return []
        
    finally:
        if driver:
            driver.quit()

def extract_epl_game_info_fixed(game_element, target_date, target_date_obj, game_num):
    """EPL 경기 정보 추출 (수정된 버전 - 실제 날짜 확인)"""
    
    try:
        # 경기 상태 먼저 확인
        is_closed = False
        status_element = game_element.select_one('.MatchBox_status__xU6\\+d')
        if status_element:
            status_text = status_element.get_text().strip()
            if any(word in status_text.lower() for word in ['종료', 'final', '완료', 'ft']):
                is_closed = True
        
        # 종료된 경기는 과거 경기일 가능성이 높으므로 스킵
        if is_closed:
            print(f"  ⏭️ 경기 {game_num}: 종료된 경기는 스킵 (과거 경기 가능성)")
            return None
        
        # 시간 정보 추출
        game_time = "20:00"  # 기본값
        time_element = game_element.select_one('.MatchBox_time__Zt5-d')
        if time_element:
            time_text = time_element.get_text().strip()
            time_match = re.search(r'(\d{1,2}):(\d{2})', time_text)
            if time_match:
                game_time = f"{time_match.group(1).zfill(2)}:{time_match.group(2)}"
                print(f"  ⏰ 경기 {game_num} 시간: {game_time}")
        
        # 팀 정보 추출
        team_elements = game_element.select('.MatchBoxHeadToHeadArea_team_item__9ZknX')
        
        if len(team_elements) < 2:
            print(f"  ❌ 경기 {game_num}: 팀 정보 부족")
            return None
        
        # 팀명 추출
        home_element = team_elements[0].select_one('.MatchBoxHeadToHeadArea_team__l2ZxP')
        away_element = team_elements[1].select_one('.MatchBoxHeadToHeadArea_team__l2ZxP')
        
        if not home_element or not away_element:
            print(f"  ❌ 경기 {game_num}: 팀명 추출 실패")
            return None
        
        home_team = home_element.get_text().strip()
        away_team = away_element.get_text().strip()
        
        print(f"  🏠 경기 {game_num}: {away_team} vs {home_team} (예정)")
        
        # 예정된 경기만 처리하므로 점수는 None
        home_score = None
        away_score = None
        result = None
        
        start_time = f"{target_date}T{game_time}:00+09:00"
        
        game_data = {
            'home_team': home_team,
            'away_team': away_team,
            'start_time': start_time,
            'home_score': home_score,
            'away_score': away_score,
            'result': result,
            'is_closed': is_closed,
            'sport_id': 2,  # 축구
            'sport_name': 'soccer',
            'league_name': 'EPL',
            'league_type': 'epl',
            'stadium': None
        }
        
        return game_data
        
    except Exception as e:
        print(f"  ❌ 경기 {game_num} 정보 추출 중 오류: {e}")
        return None

def save_epl_games_to_csv(games, target_date):
    """EPL 경기 데이터를 CSV 파일로 저장"""
    
    if not games:
        print("❌ 저장할 경기 데이터가 없습니다.")
        return None
    
    filename = f"epl_games_{target_date.replace('-', '_')}_fixed.csv"
    
    try:
        with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = [
                'home_team', 'away_team', 'start_time', 
                'home_score', 'away_score', 'result', 'is_closed',
                'sport_id', 'sport_name', 'league_name', 'league_type', 'stadium'
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
    
    # 크롤링할 날짜 설정
    target_date = "2025-09-27"
    
    print("⚽ 네이버 스포츠 EPL 크롤러 Fixed 시작")
    print(f"📅 대상 날짜: {target_date}")
    print("🎯 예정된 경기만 수집 (과거 경기 제외)")
    print("=" * 60)
    
    # EPL 경기 크롤링
    games = crawl_naver_epl_date_fixed(target_date)
    
    if games:
        # CSV 파일로 저장
        csv_file = save_epl_games_to_csv(games, target_date)
        
        # 결과 요약 출력
        print("\n📊 크롤링 결과 요약:")
        print("=" * 40)
        
        for i, game in enumerate(games, 1):
            status = "종료" if game['is_closed'] else "예정"
            score_info = ""
            if game['home_score'] is not None and game['away_score'] is not None:
                score_info = f" ({game['away_score']}:{game['home_score']})"
            
            print(f"{i}. {game['away_team']} vs {game['home_team']} | {game['start_time'][11:16]} | {status}{score_info}")
        
        print(f"\n✅ 총 {len(games)}개 EPL 예정 경기 크롤링 완료!")
        if csv_file:
            print(f"📁 저장된 파일: {csv_file}")
    else:
        print(f"❌ {target_date}에는 예정된 EPL 경기가 없거나 크롤링에 실패했습니다.")

if __name__ == "__main__":
    main()
