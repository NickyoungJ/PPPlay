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
    """네이버 스포츠 특정 날짜 배구 일정 크롤링 (개선 버전)"""
    
    print(f"🏐 네이버 스포츠 {target_date} 배구 크롤링 시작 (v2)")
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
        
        print("🔍 페이지 구조 상세 분석:")
        print("=" * 40)
        
        # HTML 구조 상세 분석
        with open(f"volleyball_page_source_{target_date}.html", "w", encoding="utf-8") as f:
            f.write(page_source)
        print(f"📄 페이지 소스 저장: volleyball_page_source_{target_date}.html")
        
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
        
        # 다양한 배구 경기 선택자 시도
        game_selectors = [
            # 일반적인 경기 아이템
            'div[class*="ScheduleLeagueType_match_item"]',
            'div[class*="match_item"]',
            'div[class*="game_item"]',
            'div[class*="match"]',
            'li[class*="match"]',
            '.match_item',
            '.game_item',
            
            # 배구 전용 선택자
            'div[class*="volleyball"]',
            'div[class*="v-ball"]',
            'div[class*="league"]',
            
            # 스포츠 공통 선택자
            'div[class*="schedule"]',
            'div[class*="game"]',
            'tr[class*="game"]',
            'tbody tr'
        ]
        
        game_elements = []
        found_selector = None
        
        for selector in game_selectors:
            elements = soup.select(selector)
            if elements:
                # 경기 관련 텍스트가 있는 요소만 필터링
                valid_elements = []
                for elem in elements:
                    elem_text = elem.get_text().strip()
                    if any(keyword in elem_text for keyword in ['vs', ':', '시간', '팀', '경기']):
                        valid_elements.append(elem)
                
                if valid_elements:
                    print(f"✅ 유효한 경기 요소 발견: {selector} ({len(valid_elements)}개)")
                    game_elements = valid_elements
                    found_selector = selector
                    break
        
        if not game_elements:
            print("❌ 경기 요소를 찾을 수 없습니다.")
            
            # 텍스트 기반 경기 정보 찾기 시도
            print("\n🔍 텍스트 기반 경기 정보 찾기:")
            vs_matches = re.findall(r'([가-힣A-Za-z0-9\s]+)\s*vs\s*([가-힣A-Za-z0-9\s]+)', page_text)
            if vs_matches:
                print(f"📊 'vs' 패턴으로 {len(vs_matches)}개 매치 발견")
                for i, (team1, team2) in enumerate(vs_matches):
                    print(f"  {i+1}. {team1.strip()} vs {team2.strip()}")
                
                # vs 패턴으로 경기 생성
                games = create_games_from_vs_pattern(vs_matches, target_date)
                return games
            
            return []
        
        print(f"📊 총 {len(game_elements)}개 경기 요소 발견 (선택자: {found_selector})")
        print()
        
        # 각 경기 정보 추출
        for idx, game_element in enumerate(game_elements):
            try:
                print(f"\n🔍 경기 {idx + 1} 분석:")
                print(f"HTML: {str(game_element)[:200]}...")
                print(f"텍스트: {game_element.get_text().strip()}")
                
                game_data = extract_volleyball_game_info_v2(game_element, target_date, idx + 1)
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

def create_games_from_vs_pattern(vs_matches, target_date):
    """vs 패턴으로 발견된 매치에서 경기 데이터 생성"""
    games = []
    
    for i, (team1, team2) in enumerate(vs_matches):
        # 팀명 정리 (불필요한 텍스트 제거)
        team1 = clean_team_name(team1.strip())
        team2 = clean_team_name(team2.strip())
        
        if team1 and team2 and team1 != team2:
            game_data = {
                'home_team': team2,  # 두 번째 팀을 홈팀으로
                'away_team': team1,  # 첫 번째 팀을 원정팀으로
                'start_time': f"{target_date}T19:00:00+09:00",  # 기본 시간
                'home_score': None,
                'away_score': None,
                'result': None,
                'is_closed': False,
                'sport_id': 4,
                'sport_name': 'volleyball',
                'stadium': None
            }
            games.append(game_data)
    
    return games

def clean_team_name(team_name):
    """팀명 정리 (불필요한 텍스트 제거)"""
    if not team_name:
        return ""
    
    # 제거할 패턴들
    remove_patterns = [
        r'스코어\d+',  # 스코어1, 스코어2 등
        r'점수\d+',
        r'득점\d+',
        r'\d+점',
        r'세트\d+',
        r'경기\d+',
        r'매치\d+'
    ]
    
    cleaned = team_name
    for pattern in remove_patterns:
        cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE)
    
    # 공백 정리
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    
    # 너무 짧거나 의미없는 이름 필터링
    if len(cleaned) < 2 or cleaned.isdigit():
        return ""
    
    return cleaned

def extract_volleyball_game_info_v2(game_element, target_date, game_num):
    """배구 경기 정보 추출 (개선 버전)"""
    
    try:
        game_text = game_element.get_text().strip()
        print(f"  원본 텍스트: {game_text}")
        
        # vs 패턴으로 팀명 추출
        vs_match = re.search(r'([가-힣A-Za-z0-9\s]+)\s*vs\s*([가-힣A-Za-z0-9\s]+)', game_text)
        if not vs_match:
            print(f"  ❌ vs 패턴을 찾을 수 없습니다.")
            return None
        
        away_team = clean_team_name(vs_match.group(1))
        home_team = clean_team_name(vs_match.group(2))
        
        if not away_team or not home_team or away_team == home_team:
            print(f"  ❌ 유효하지 않은 팀명: '{away_team}' vs '{home_team}'")
            return None
        
        print(f"  팀명: {away_team} vs {home_team}")
        
        # 시간 추출
        time_match = re.search(r'(\d{1,2}):(\d{2})', game_text)
        if time_match:
            game_time = f"{time_match.group(1).zfill(2)}:{time_match.group(2)}"
        else:
            game_time = "19:00"  # 기본값
        
        print(f"  경기 시간: {game_time}")
        
        # 점수 및 상태 추출
        home_score = None
        away_score = None
        is_closed = False
        result = None
        
        # 점수 패턴 찾기 (3:1, 25:23 등)
        score_matches = re.findall(r'(\d{1,2}):(\d{1,2})', game_text)
        if score_matches:
            # 마지막 점수를 최종 점수로 간주
            final_score = score_matches[-1]
            away_score = int(final_score[0])
            home_score = int(final_score[1])
            is_closed = True
            
            if home_score > away_score:
                result = "home_win"
            elif away_score > home_score:
                result = "away_win"
            else:
                result = "draw"
            
            print(f"  점수: {away_score}:{home_score} ({'종료' if is_closed else '진행중'})")
        
        # 경기 상태 키워드 확인
        if any(keyword in game_text for keyword in ['종료', 'final', '완료']):
            is_closed = True
        elif any(keyword in game_text for keyword in ['예정', 'scheduled', '시작 전']):
            is_closed = False
        
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
        print(f"  ❌ 경기 정보 추출 중 오류: {e}")
        return None

def save_volleyball_games_to_csv(games, target_date):
    """배구 경기 데이터를 CSV 파일로 저장"""
    
    if not games:
        print("❌ 저장할 경기 데이터가 없습니다.")
        return None
    
    filename = f"volleyball_games_{target_date.replace('-', '_')}_v2.csv"
    
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
    
    print("🏐 네이버 스포츠 배구 크롤러 v2 시작")
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
