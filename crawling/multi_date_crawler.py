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

def crawl_naver_kbo_multi_dates(start_date_str, days_count=7):
    """네이버 스포츠 여러 날짜 KBO 일정 크롤링"""
    
    print(f"🏟️ 네이버 스포츠 {days_count}일간 크롤링 시작 (시작: {start_date_str})")
    print("=" * 60)
    
    # Chrome 설정
    options = Options()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1')
    
    driver = None
    all_games = []
    
    try:
        driver = webdriver.Chrome(options=options)
        driver.set_window_size(375, 812)  # iPhone 크기
        
        # 시작 날짜 파싱
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
        
        for day_offset in range(days_count):
            current_date = start_date + timedelta(days=day_offset)
            date_str = current_date.strftime('%Y-%m-%d')
            
            print(f"\n📅 {date_str} 크롤링 중...")
            
            url = f"https://m.sports.naver.com/kbaseball/schedule/index?date={date_str}"
            print(f"📡 접속: {url}")
            
            driver.get(url)
            time.sleep(3)
            
            # 페이지 소스 가져오기
            page_source = driver.page_source
            print(f"📄 페이지 크기: {len(page_source)} bytes")
            
            # BeautifulSoup으로 파싱
            soup = BeautifulSoup(page_source, 'html.parser')
            
            # 경기 정보 추출
            games = extract_games_from_soup(soup, date_str)
            
            if games:
                all_games.extend(games)
                print(f"✅ {len(games)}개 경기 발견")
            else:
                print("❌ 경기 없음")
            
            time.sleep(2)  # 요청 간격
        
    except Exception as e:
        print(f"❌ 크롤링 중 오류 발생: {e}")
        
    finally:
        if driver:
            driver.quit()
    
    if all_games:
        # CSV 파일로 저장
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"kbo_multi_dates_{start_date_str}_{timestamp}.csv"
        
        with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = ['date', 'homeTeam', 'awayTeam', 'homeScore', 'awayScore', 'result', 'status', 'time', 'stadium', 'source']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(all_games)
        
        print(f"\n💾 CSV 저장 완료: {filename}")
        
        # 결과 요약
        print(f"\n📊 최종 결과:")
        print(f"총 경기 수: {len(all_games)}개")
        
        for i, game in enumerate(all_games, 1):
            status_emoji = "✅" if game['status'] == '종료' else "⏳"
            print(f"{i}. {status_emoji} {game['date']} {game['time']} | {game['awayTeam']} vs {game['homeTeam']}")
            if game['status'] == '종료':
                print(f"   점수: {game['awayScore']} : {game['homeScore']} ({'홈팀 승' if game['result'] == '1' else '원정팀 승' if game['result'] == '2' else '무승부'})")
                print(f"   구장: {game['stadium']}")
        
        print(f"\n🎯 크롤링 성공: {len(all_games)}개 경기")
        return filename
    else:
        print("❌ 크롤링된 데이터가 없습니다.")
        return None

def extract_games_from_soup(soup, date_str):
    """BeautifulSoup 객체에서 경기 정보 추출"""
    games = []
    
    try:
        print("🔍 경기 정보 검색 중...")
        
        # 경기 항목 찾기 (다양한 선택자 시도)
        selectors = [
            '[class*="match_item"]',
            '[class*="MatchItem"]', 
            '[class*="match"]',
            '.match_item',
            '.MatchItem'
        ]
        
        match_items = []
        for selector in selectors:
            items = soup.select(selector)
            if items:
                print(f"  ✅ {selector}: {len(items)}개 요소 발견")
                match_items = items
                break
        
        if not match_items:
            print("  ❌ 경기 항목을 찾을 수 없습니다.")
            return games
        
        for item in match_items:
            try:
                item_text = item.get_text(strip=True)
                print(f"    📊 경기 후보: {item_text[:100]}...")
                
                # 팀명 추출 패턴들
                team_patterns = [
                    r'(KIA|KT|LG|두산|키움|한화|롯데|삼성|SSG|NC)',
                    r'(기아|케이티|엘지|두산|키움|한화|롯데|삼성|에스에스지|엔씨)'
                ]
                
                teams_found = []
                for pattern in team_patterns:
                    teams = re.findall(pattern, item_text)
                    if len(teams) >= 2:
                        teams_found = teams[:2]  # 처음 두 팀만
                        break
                
                if len(teams_found) < 2:
                    continue
                
                away_team, home_team = teams_found[0], teams_found[1]
                
                # 시간 추출
                time_match = re.search(r'(\d{1,2}:\d{2})', item_text)
                game_time = time_match.group(1) if time_match else "18:30"
                
                # 점수 추출
                score_pattern = r'스코어(\d+)'
                scores = re.findall(score_pattern, item_text)
                
                # 상태 확인
                is_finished = '종료' in item_text
                
                if is_finished and len(scores) >= 2:
                    away_score, home_score = int(scores[0]), int(scores[1])
                    
                    # 승부 결과 판정
                    if home_score > away_score:
                        result = "1"  # 홈팀 승
                    elif away_score > home_score:
                        result = "2"  # 원정팀 승
                    else:
                        result = "0"  # 무승부
                    
                    status = "종료"
                else:
                    away_score, home_score = None, None
                    result = None
                    status = "예정"
                
                # 경기장 추출 (간단한 패턴)
                stadium_patterns = [
                    r'([\w\-\s]+(?:야구장|파크|필드|돔|스타디움))',
                    r'(광주|수원|부산|창원|서울|인천|대구|대전)[\-\s]*([\w\s]+)'
                ]
                
                stadium = "미정"
                for pattern in stadium_patterns:
                    stadium_match = re.search(pattern, item_text)
                    if stadium_match:
                        stadium = stadium_match.group(0).strip()
                        break
                
                game = {
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
                
                games.append(game)
                print(f"    ✅ 경기 추출: {away_team} vs {home_team}")
                
            except Exception as e:
                print(f"    ❌ 경기 파싱 오류: {e}")
                continue
    
    except Exception as e:
        print(f"❌ 전체 파싱 오류: {e}")
    
    return games

def main():
    """메인 실행 함수"""
    # 오늘부터 일주일간 크롤링
    today = datetime.now()
    start_date = (today - timedelta(days=3)).strftime('%Y-%m-%d')  # 3일 전부터
    
    print("📋 크롤링 설정:")
    print(f"   시작 날짜: {start_date}")
    print(f"   크롤링 일수: 7일")
    print()
    
    filename = crawl_naver_kbo_multi_dates(start_date, 7)
    
    if filename:
        print(f"\n✅ 크롤링 완료! 파일: {filename}")
    else:
        print("\n❌ 크롤링 실패!")

if __name__ == "__main__":
    main()
