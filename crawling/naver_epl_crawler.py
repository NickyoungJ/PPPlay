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

def crawl_naver_epl_date(target_date):
    """네이버 스포츠 특정 날짜 EPL 일정 크롤링"""
    
    print(f"⚽ 네이버 스포츠 {target_date} EPL 크롤링 시작")
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
                print(f"📋 {target_date}에는 EPL 경기가 없습니다: {msg}")
                return []
        
        # EPL 경기 리스트 찾기 - 축구는 다른 클래스명 사용
        # 여러 가능한 선택자 시도
        selectors = [
            'li.MatchBox_match_item__WiPhj',  # 배구에서 사용한 클래스
            '.match_item',
            '.game_item',
            '.schedule_item',
            '[data-testid="match-item"]',
            '.match-card'
        ]
        
        game_elements = []
        for selector in selectors:
            game_elements = soup.select(selector)
            if game_elements:
                print(f"✅ 선택자 '{selector}'로 {len(game_elements)}개 요소 발견")
                break
        
        if not game_elements:
            print("❌ 경기 요소를 찾을 수 없습니다. 페이지 구조 분석 필요")
            print("📄 페이지 내용 샘플:")
            print(soup.get_text()[:500] + "...")
            return []
        
        print(f"📊 총 {len(game_elements)}개 경기 발견")
        print()
        
        # 각 경기 정보 추출
        for idx, game_element in enumerate(game_elements):
            try:
                game_data = extract_epl_game_info(game_element, target_date, idx + 1)
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

def extract_epl_game_info(game_element, target_date, game_num):
    """EPL 경기 정보 추출"""
    
    try:
        print(f"🔍 경기 {game_num} 요소 분석 중...")
        
        # 시간 정보 추출 - 여러 가능한 클래스명 시도
        time_selectors = [
            '.MatchBox_time__Zt5-d',
            '.time',
            '.match_time',
            '.game_time',
            '.schedule_time'
        ]
        
        game_time = "20:00"  # 기본값
        for selector in time_selectors:
            time_element = game_element.select_one(selector)
            if time_element:
                time_text = time_element.get_text().strip()
                time_match = re.search(r'(\d{1,2}):(\d{2})', time_text)
                if time_match:
                    game_time = f"{time_match.group(1).zfill(2)}:{time_match.group(2)}"
                    print(f"  ⏰ 시간 발견: {game_time}")
                    break
        
        # 경기 상태 확인
        status_selectors = [
            '.MatchBox_status__xU6\\+d',
            '.status',
            '.match_status',
            '.game_status'
        ]
        
        is_closed = False
        for selector in status_selectors:
            status_element = game_element.select_one(selector)
            if status_element:
                status_text = status_element.get_text().strip()
                if any(word in status_text.lower() for word in ['종료', 'final', '완료', 'ft']):
                    is_closed = True
                    print(f"  📊 상태: {status_text} (종료)")
                    break
                else:
                    print(f"  📊 상태: {status_text}")
        
        # 팀 정보 추출 - 여러 가능한 선택자 시도
        team_selectors = [
            '.MatchBoxHeadToHeadArea_team_item__9ZknX',
            '.team_item',
            '.team',
            '.match_team',
            '.club'
        ]
        
        team_elements = []
        for selector in team_selectors:
            team_elements = game_element.select(selector)
            if len(team_elements) >= 2:
                print(f"  👥 팀 요소 발견: {len(team_elements)}개")
                break
        
        if len(team_elements) < 2:
            print(f"  ❌ 경기 {game_num}: 팀 정보가 부족합니다.")
            return None
        
        # 팀명 추출
        team_name_selectors = [
            '.MatchBoxHeadToHeadArea_team__l2ZxP',
            '.team_name',
            '.club_name',
            '.name'
        ]
        
        home_team = None
        away_team = None
        
        for selector in team_name_selectors:
            home_element = team_elements[0].select_one(selector)
            away_element = team_elements[1].select_one(selector)
            
            if home_element and away_element:
                home_team = home_element.get_text().strip()
                away_team = away_element.get_text().strip()
                print(f"  🏠 홈팀: {home_team}")
                print(f"  🏃 원정팀: {away_team}")
                break
        
        if not home_team or not away_team:
            # 대체 방법: 전체 텍스트에서 팀명 추출
            game_text = game_element.get_text()
            print(f"  📄 경기 텍스트: {game_text[:100]}...")
            return None
        
        # 점수 정보 추출
        score_selectors = [
            '.MatchBoxHeadToHeadArea_score__TChmp',
            '.score',
            '.match_score',
            '.goal'
        ]
        
        home_score = None
        away_score = None
        result = None
        
        for selector in score_selectors:
            home_score_element = team_elements[0].select_one(selector)
            away_score_element = team_elements[1].select_one(selector)
            
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
                    
                    print(f"  ⚽ 점수: {away_team} {away_score} : {home_score} {home_team}")
                    break
                        
                except (ValueError, AttributeError):
                    # 점수가 숫자가 아닌 경우
                    pass
        
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
    
    filename = f"epl_games_{target_date.replace('-', '_')}.csv"
    
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
    
    print("⚽ 네이버 스포츠 EPL 크롤러 시작")
    print(f"📅 대상 날짜: {target_date}")
    print("=" * 60)
    
    # EPL 경기 크롤링
    games = crawl_naver_epl_date(target_date)
    
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
        
        print(f"\n✅ 총 {len(games)}개 EPL 경기 크롤링 완료!")
        if csv_file:
            print(f"📁 저장된 파일: {csv_file}")
    else:
        print(f"❌ {target_date}에는 EPL 경기가 없거나 크롤링에 실패했습니다.")
        print("🔧 페이지 구조가 변경되었을 수 있습니다. 수동 확인이 필요합니다.")

if __name__ == "__main__":
    main()
