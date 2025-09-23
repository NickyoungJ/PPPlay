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

def crawl_naver_kbo_date(target_date):
    """네이버 스포츠 특정 날짜 KBO 일정 크롤링"""
    
    print(f"🏟️ 네이버 스포츠 {target_date} 크롤링 시작")
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
        
        # 네이버 스포츠 접속
        url = f'https://m.sports.naver.com/kbaseball/schedule/index?date={target_date}'
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
        
        # 추가 대기 (동적 콘텐츠 로딩)
        time.sleep(3)
        
        # 페이지 소스 가져오기
        page_source = driver.page_source
        print(f"📄 페이지 크기: {len(page_source)} bytes")
        
        # BeautifulSoup으로 파싱
        soup = BeautifulSoup(page_source, 'html.parser')
        
        # KBO 팀 매핑
        team_mapping = {
            'KIA': 'KIA', 'KT': 'KT', 'LG': 'LG', 'NC': 'NC', 'SSG': 'SSG',
            '두산': '두산', '롯데': '롯데', '삼성': '삼성', '한화': '한화', '키움': '키움',
            '기아': 'KIA', 'kt': 'KT', 'lg': 'LG', 'nc': 'NC', 'ssg': 'SSG'
        }
        
        # 경기 없음 메시지 확인
        no_game_messages = [
            '경기가 없습니다', '일정이 없습니다', '예정된 경기가 없습니다', 
            '경기 일정이 없습니다', '휴식일', '경기 없음'
        ]
        
        page_text = soup.get_text()
        for message in no_game_messages:
            if message in page_text:
                print(f"⚠️ 발견: {message}")
                print("✅ 2025-09-16은 KBO 경기가 없는 날입니다.")
                return []
        
        # 다양한 선택자로 경기 정보 찾기
        selectors = [
            # 네이버 스포츠 모바일 일반적인 선택자들
            '[class*="ScheduleAllType_match_item"]',
            '[class*="match_item"]',
            '[class*="game_item"]',
            '[class*="schedule_item"]',
            '.match_item',
            '.game_item',
            '.schedule_item',
            'li[class*="match"]',
            'li[class*="game"]',
            'div[class*="match"]',
            'div[class*="game"]',
            'div[class*="vs"]',
            # 테이블 형태
            'tr[class*="match"]',
            'tr[class*="game"]',
            'table tr',
            # 기타
            '[data-game-id]',
            '[data-match-id]'
        ]
        
        print("🔍 경기 정보 검색 중...")
        
        for selector in selectors:
            elements = soup.select(selector)
            if elements:
                print(f"  ✅ {selector}: {len(elements)}개 요소 발견")
                
                for element in elements:
                    text = element.get_text(strip=True)
                    
                    # KBO 팀명이 포함된 요소만 처리
                    teams_found = []
                    for team_name in team_mapping.keys():
                        if team_name in text:
                            teams_found.append(team_mapping[team_name])
                    
                    # 중복 제거
                    teams_found = list(dict.fromkeys(teams_found))
                    
                    if len(teams_found) >= 2:
                        print(f"    📊 경기 후보: {text[:100]}...")
                        
                        # 경기 정보 파싱
                        game = parse_game_info(element, teams_found, target_date)
                        if game:
                            games.append(game)
                            print(f"    ✅ 경기 추출: {game['awayTeam']} vs {game['homeTeam']}")
                
                if games:
                    break
        
        # 중복 제거
        unique_games = remove_duplicates(games)
        
        print(f"\n📊 최종 결과:")
        print(f"총 경기 수: {len(unique_games)}개")
        
        if unique_games:
            # CSV 저장
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            csv_filename = f"naver_{target_date}_{timestamp}.csv"
            
            with open(csv_filename, 'w', newline='', encoding='utf-8') as csvfile:
                fieldnames = ['date', 'homeTeam', 'awayTeam', 'homeScore', 'awayScore', 'result', 'status', 'time', 'stadium', 'source']
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                
                writer.writeheader()
                for game in unique_games:
                    writer.writerow(game)
            
            print(f"💾 CSV 저장 완료: {csv_filename}")
            
            # 경기 상세 출력
            for i, game in enumerate(unique_games, 1):
                status_emoji = "✅" if game['status'] == '종료' else "⏰"
                print(f"{i}. {status_emoji} {game['time']} | {game['awayTeam']} vs {game['homeTeam']}")
                
                if game.get('homeScore') is not None:
                    result_text = "홈팀 승" if game['result'] == '1' else "원정팀 승" if game['result'] == '2' else "무승부"
                    print(f"   점수: {game['awayScore']} : {game['homeScore']} ({result_text})")
                else:
                    print(f"   상태: {game['status']}")
                
                print(f"   구장: {game['stadium']}")
        else:
            print("❌ 추출된 경기가 없습니다.")
            
            # 페이지 내용 샘플 출력 (디버깅용)
            print("\n📄 페이지 내용 샘플:")
            lines = page_text.split('\n')[:20]
            for line in lines:
                if line.strip():
                    print(f"  {line.strip()[:80]}...")
        
        return unique_games
        
    except Exception as e:
        print(f"❌ 크롤링 오류: {e}")
        return []
        
    finally:
        if driver:
            driver.quit()

def parse_game_info(element, teams_found, date_str):
    """경기 정보 파싱"""
    try:
        text = element.get_text(strip=True)
        
        # 기본 경기 정보
        home_team = teams_found[0]
        away_team = teams_found[1] if len(teams_found) > 1 else teams_found[0]
        
        # 점수 찾기
        home_score = None
        away_score = None
        status = '예정'
        result = None
        
        # 네이버 스포츠 점수 패턴 매칭 (스코어11KIA홈패김태형스코어1 형태)
        score_patterns = [
            # 네이버 스포츠 특별 패턴: "스코어10KT홈패헤이수스스코어6" (non-greedy 매칭)
            r'스코어(\d{1,2}).*?스코어(\d{1,2})',
            # 시간을 제외한 일반적인 점수 패턴
            r'(?<!시간\d)(?<!\d:)(\d{1,2})\s*[:\-]\s*(\d{1,2})(?!\d:)',
        ]
        
        for pattern in score_patterns:
            score_match = re.search(pattern, text)
            if score_match:
                score1 = int(score_match.group(1))
                score2 = int(score_match.group(2))
                
                # 점수 유효성 검증 (야구 점수 범위)
                if 0 <= score1 <= 30 and 0 <= score2 <= 30:
                    # 네이버 스포츠 패턴의 경우 첫 번째가 홈팀, 두 번째가 원정팀
                    if '스코어' in pattern:
                        home_score = score1
                        away_score = score2
                    else:
                        # 일반 패턴의 경우 순서 확인 필요
                        home_score = score1
                        away_score = score2
                    
                    status = '종료'
                    
                    if home_score > away_score:
                        result = '1'
                    elif home_score < away_score:
                        result = '2'
                    else:
                        result = '0'
                    break
        
        # 시간 찾기
        time_match = re.search(r'(\d{1,2}):(\d{2})', text)
        game_time = time_match.group(0) if time_match else '14:00'
        
        # 구장 매핑
        stadium_mapping = {
            'KIA': '광주-기아 챔피언스 필드',
            'KT': '수원 KT위즈파크',
            'LG': '서울 잠실야구장',
            'NC': '창원 NC파크',
            'SSG': '인천 SSG랜더스필드',
            '두산': '서울 잠실야구장',
            '롯데': '부산 사직야구장',
            '삼성': '대구 삼성라이온즈파크',
            '한화': '대전 한화생명이글스파크',
            '키움': '서울 고척스카이돔'
        }
        
        stadium = stadium_mapping.get(home_team, f'{home_team} 홈구장')
        
        return {
            'date': date_str,
            'homeTeam': home_team,
            'awayTeam': away_team,
            'homeScore': home_score,
            'awayScore': away_score,
            'result': result,
            'status': status,
            'time': game_time,
            'stadium': stadium,
            'source': 'naver_sports'
        }
        
    except Exception as e:
        print(f"    ⚠️ 파싱 오류: {e}")
        return None

def remove_duplicates(games):
    """중복 경기 제거"""
    seen = set()
    unique_games = []
    
    for game in games:
        if game:
            # 팀 순서에 관계없이 중복 체크
            teams = tuple(sorted([game['homeTeam'], game['awayTeam']]))
            key = (teams, game['date'])
            
            if key not in seen:
                seen.add(key)
                unique_games.append(game)
    
    return unique_games

if __name__ == "__main__":
    import sys
    
    # 날짜 인자가 있으면 해당 날짜, 없으면 기본값
    if len(sys.argv) > 1:
        target_date = sys.argv[1]
    else:
        target_date = "2025-09-16"
    
    result = crawl_naver_kbo_date(target_date)
    
    if result:
        print(f"\n🎯 크롤링 성공: {len(result)}개 경기")
    else:
        print("\n❌ 크롤링 결과 없음")
