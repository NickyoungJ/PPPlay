#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import time
import json
import csv
import re
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup

def crawl_naver_volleyball_date(target_date):
    """네이버 스포츠 특정 날짜 배구 일정 크롤링"""
    
    print(f"🏐 네이버 스포츠 {target_date} 배구 크롤링 시작")
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
        
        # 배구 경기 요소 찾기 (다양한 선택자 시도)
        game_selectors = [
            'div[class*="ScheduleLeagueType_match_item"]',
            'div[class*="match_item"]',
            'div[class*="game_item"]',
            'div[class*="match"]',
            'li[class*="match"]',
            '.match_item',
            '.game_item'
        ]
        
        game_elements = []
        for selector in game_selectors:
            elements = soup.select(selector)
            if elements:
                print(f"✅ 경기 요소 발견: {selector} ({len(elements)}개)")
                game_elements = elements
                break
        
        if not game_elements:
            print("❌ 경기 요소를 찾을 수 없습니다.")
            # 전체 HTML 구조 분석
            print("\n📋 페이지 구조 분석:")
            print("=" * 40)
            
            # 주요 div 태그들 찾기
            divs = soup.find_all('div', limit=20)
            for i, div in enumerate(divs):
                if div.get('class'):
                    print(f"Div {i}: class='{' '.join(div.get('class', []))}'")
            
            # 경기 관련 텍스트 찾기
            text_content = soup.get_text()
            if any(keyword in text_content for keyword in ['vs', '경기', '시간', '팀']):
                print("📝 경기 관련 텍스트가 페이지에 존재합니다.")
                # 경기가 없는 경우 메시지 확인
                no_game_messages = [
                    "경기가 없습니다",
                    "일정이 없습니다", 
                    "예정된 경기가 없습니다",
                    "No games scheduled"
                ]
                
                for msg in no_game_messages:
                    if msg in text_content:
                        print(f"📋 {target_date}에는 배구 경기가 없습니다: {msg}")
                        return []
            
            return []
        
        print(f"📊 총 {len(game_elements)}개 경기 발견")
        print()
        
        # 각 경기 정보 추출
        for idx, game_element in enumerate(game_elements):
            try:
                game_data = extract_volleyball_game_info(game_element, target_date, idx + 1)
                if game_data:
                    games.append(game_data)
                    print(f"✅ 경기 {idx + 1}: {game_data['away_team']} vs {game_data['home_team']}")
                else:
                    print(f"❌ 경기 {idx + 1}: 정보 추출 실패")
                    
            except Exception as e:
                print(f"❌ 경기 {idx + 1} 처리 중 오류: {e}")
                continue
        
        print()
        print(f"🎉 크롤링 완료!")
        print(f"✅ 총 {len(games)}개 경기 수집")
        print("=" * 60)
        
        return games
        
    except Exception as e:
        print(f"❌ 크롤링 중 오류 발생: {e}")
        return []
        
    finally:
        if driver:
            driver.quit()

def extract_volleyball_game_info(game_element, target_date, game_num):
    """배구 경기 정보 추출"""
    
    try:
        # 팀명 추출 시도 (다양한 패턴)
        team_selectors = [
            'span[class*="team"]',
            'div[class*="team"]',
            '.team_name',
            '.team',
            'span[class*="name"]',
            'div[class*="name"]'
        ]
        
        teams = []
        for selector in team_selectors:
            team_elements = game_element.select(selector)
            if len(team_elements) >= 2:
                teams = [elem.get_text().strip() for elem in team_elements[:2]]
                break
        
        if not teams or len(teams) < 2:
            # 텍스트에서 'vs' 패턴으로 팀명 추출 시도
            game_text = game_element.get_text()
            vs_match = re.search(r'([가-힣A-Za-z0-9\s]+)\s*vs\s*([가-힣A-Za-z0-9\s]+)', game_text)
            if vs_match:
                teams = [vs_match.group(1).strip(), vs_match.group(2).strip()]
        
        if not teams or len(teams) < 2:
            print(f"❌ 경기 {game_num}: 팀명을 찾을 수 없습니다.")
            return None
        
        away_team = teams[0]
        home_team = teams[1]
        
        # 시간 추출
        time_selectors = [
            'span[class*="time"]',
            'div[class*="time"]',
            '.game_time',
            '.time',
            'span[class*="hour"]'
        ]
        
        game_time = None
        for selector in time_selectors:
            time_element = game_element.select_one(selector)
            if time_element:
                time_text = time_element.get_text().strip()
                # 시간 패턴 매칭 (예: 18:30, 오후 2:00 등)
                time_match = re.search(r'(\d{1,2}):(\d{2})', time_text)
                if time_match:
                    game_time = f"{time_match.group(1).zfill(2)}:{time_match.group(2)}"
                    break
        
        if not game_time:
            # 기본 시간 설정 (배구는 보통 저녁 시간)
            game_time = "19:00"
            print(f"⚠️ 경기 {game_num}: 시간 정보 없음, 기본값 {game_time} 사용")
        
        # 점수 추출 (완료된 경기의 경우)
        score_selectors = [
            'span[class*="score"]',
            'div[class*="score"]',
            '.score',
            '.point'
        ]
        
        home_score = None
        away_score = None
        is_closed = False
        result = None
        
        for selector in score_selectors:
            score_elements = game_element.select(selector)
            if len(score_elements) >= 2:
                try:
                    away_score = int(score_elements[0].get_text().strip())
                    home_score = int(score_elements[1].get_text().strip())
                    is_closed = True
                    
                    # 결과 판정
                    if home_score > away_score:
                        result = "home_win"
                    elif away_score > home_score:
                        result = "away_win"
                    else:
                        result = "draw"
                    break
                except (ValueError, IndexError):
                    continue
        
        # 경기 상태 확인
        status_text = game_element.get_text().lower()
        if any(keyword in status_text for keyword in ['종료', 'final', '완료']):
            is_closed = True
        elif any(keyword in status_text for keyword in ['예정', 'scheduled', '시작 전']):
            is_closed = False
        
        # start_time 생성
        start_time = f"{target_date}T{game_time}:00+09:00"
        
        game_data = {
            'home_team': home_team,
            'away_team': away_team,
            'start_time': start_time,
            'home_score': home_score,
            'away_score': away_score,
            'result': result,
            'is_closed': is_closed,
            'sport_id': 4,  # 배구 스포츠 ID
            'sport_name': 'volleyball',
            'stadium': None  # 배구 경기장 정보는 별도 추가 가능
        }
        
        return game_data
        
    except Exception as e:
        print(f"❌ 경기 정보 추출 중 오류: {e}")
        return None

def save_volleyball_games_to_csv(games, target_date):
    """배구 경기 데이터를 CSV 파일로 저장"""
    
    if not games:
        print("❌ 저장할 경기 데이터가 없습니다.")
        return None
    
    filename = f"volleyball_games_{target_date.replace('-', '_')}.csv"
    
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
    
    # 크롤링할 날짜 설정
    target_date = "2025-09-23"
    
    print("🏐 네이버 스포츠 배구 크롤러 시작")
    print(f"📅 대상 날짜: {target_date}")
    print("=" * 60)
    
    # 배구 경기 크롤링
    games = crawl_naver_volleyball_date(target_date)
    
    if games:
        # CSV 파일로 저장
        csv_file = save_volleyball_games_to_csv(games, target_date)
        
        # 결과 요약 출력
        print("\n📊 크롤링 결과 요약:")
        print("=" * 40)
        
        for i, game in enumerate(games, 1):
            status = "종료" if game['is_closed'] else "예정"
            score_info = ""
            if game['home_score'] is not None and game['away_score'] is not None:
                score_info = f" ({game['away_score']}:{game['home_score']})"
            
            print(f"{i}. {game['away_team']} vs {game['home_team']} | {game['start_time'][11:16]} | {status}{score_info}")
        
        print(f"\n✅ 총 {len(games)}개 배구 경기 크롤링 완료!")
        if csv_file:
            print(f"📁 저장된 파일: {csv_file}")
    else:
        print(f"❌ {target_date}에는 배구 경기가 없거나 크롤링에 실패했습니다.")

if __name__ == "__main__":
    main()
