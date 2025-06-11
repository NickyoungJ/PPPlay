import requests
from bs4 import BeautifulSoup
import pandas as pd
from datetime import datetime, timedelta
import re
import os
from dotenv import load_dotenv
from supabase import create_client
import time

# .env 파일에서 환경 변수 로드
env_path = os.path.join(os.path.dirname(__file__), '.env.local')
print("Loading .env file from:", env_path)
load_dotenv(env_path)

print("SUPABASE_URL:", os.getenv("SUPABASE_URL"))
print("SUPABASE_KEY:", os.getenv("SUPABASE_KEY"))

# Supabase 클라이언트 초기화
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

def get_game_time(game_url):
    """
    경기 상세 페이지에서 시간 정보를 가져옵니다.
    
    Args:
        game_url (str): 경기 상세 페이지 URL
    
    Returns:
        str: 경기 시간 정보
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        }
        response = requests.get(f"https://mykbostats.com{game_url}", headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        time_element = soup.find('div', class_='game-time')
        if time_element:
            return time_element.text.strip()
        return "Unknown"
    except Exception as e:
        print(f"Error getting game time: {e}")
        return "Unknown"

def save_to_supabase(games):
    """
    게임 데이터를 Supabase에 저장합니다.
    중복된 데이터는 최신 데이터로 업데이트됩니다.
    
    Args:
        games (list): 게임 데이터 리스트
    """
    try:
        for game in games:
            data = {
                'game_date': game['date'],
                'game_time': game['time'],
                'home_team': game['home_team'],
                'away_team': game['away_team'],
                'home_score': game['home_score'] if game['home_score'] else None,
                'away_score': game['away_score'] if game['away_score'] else None,
                'inning': game['inning'],
                'stadium': game['stadium'],
                'created_at': datetime.now().isoformat()
            }
            
            # 먼저 해당 게임이 존재하는지 확인
            existing_game = supabase.table('kbo_games').select('*').eq('game_date', game['date']).eq('home_team', game['home_team']).eq('away_team', game['away_team']).execute()
            
            if existing_game.data:
                # 존재하면 업데이트
                supabase.table('kbo_games').update(data).eq('game_date', game['date']).eq('home_team', game['home_team']).eq('away_team', game['away_team']).execute()
            else:
                # 존재하지 않으면 새로 삽입
                supabase.table('kbo_games').insert(data).execute()
            
        print("Data successfully saved to Supabase")
    except Exception as e:
        print(f"Error saving to Supabase: {e}")

def crawl_kbo_schedule(date_str):
    """
    Crawls KBO schedule from mykbostats.com
    
    Args:
        date_str (str): Date in format YYYY-MM-DD
    
    Returns:
        list: List of dictionaries containing game information
    """
    url = f"https://mykbostats.com/schedule/week_of/{date_str}"
    
    # Set headers to mimic a browser request
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    }
    
    try:
        # Make the request
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        # Save HTML for debugging
        with open(f'kbo_schedule_debug_{date_str}.html', 'w', encoding='utf-8') as f:
            f.write(response.text)
        print(f"HTML saved to kbo_schedule_debug_{date_str}.html")
        
        # Parse the HTML content
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find all date headers and their corresponding games
        games = []
        date_headers = soup.find_all('h3')
        
        for date_header in date_headers:
            try:
                # Extract date from time tag
                time_tag = date_header.find('time')
                if not time_tag:
                    continue
                    
                date = time_tag.get('datetime', '').split('T')[0]  # Get YYYY-MM-DD from datetime
                
                # Find all games under this date
                current = date_header.find_next_sibling()
                while current and current.name != 'h3':  # Until next date header
                    if current.name == 'a' and 'game-line' in current.get('class', []):
                        try:
                            away_team = current.find('div', class_='away-team').text.strip()
                            home_team = current.find('div', class_='home-team').text.strip()
                            score_container = current.find('div', class_='score-container')
                            away_score = score_container.find('span', class_='away-score').text.strip() if score_container else ""
                            home_score = score_container.find('span', class_='home-score').text.strip() if score_container else ""
                            inning = current.find('div', class_='inning').text.strip() if current.find('div', class_='inning') else "Unknown"
                            
                            # 경기 시간 및 구장 정보 크롤링 (middle 영역에서 추출)
                            middle = current.find('div', class_='middle')
                            if middle:
                                time_tag = middle.find('time')
                                game_time = time_tag.text.strip() if time_tag else "Unknown"
                                venue_tag = middle.find('div', class_='venue')
                                stadium = venue_tag.text.strip() if venue_tag else "Unknown"
                            else:
                                game_time = "Unknown"
                                stadium = "Unknown"
                            
                            game_data = {
                                'date': date,
                                'time': game_time,
                                'home_team': home_team,
                                'away_team': away_team,
                                'home_score': home_score,
                                'away_score': away_score,
                                'inning': inning,
                                'stadium': stadium
                            }
                            games.append(game_data)
                            
                            # 서버 부하를 줄이기 위해 잠시 대기
                            time.sleep(1)
                            
                        except Exception as e:
                            print(f"Error parsing game line: {e}")
                            continue
                    current = current.find_next_sibling()
                    
            except Exception as e:
                print(f"Error parsing date section: {e}")
                continue
        
        return games
        
    except Exception as e:
        print(f"Error crawling KBO schedule: {e}")
        return []

def display_results(games):
    """
    Pretty prints the game data
    
    Args:
        games (list): List of game data dictionaries
    """
    if not games:
        print("No games found.")
        return
    
    print(f"\n===== KBO Schedule =====")
    
    for i, game in enumerate(games, 1):
        print(f"\nGame {i}:")
        print(f"Date: {game.get('date', 'N/A')}")
        print(f"Time: {game.get('time', 'N/A')}")
        print(f"Stadium: {game.get('stadium', 'N/A')}")
        
        home_team = game.get('home_team', 'N/A')
        away_team = game.get('away_team', 'N/A')
        home_score = game.get('home_score', '')
        away_score = game.get('away_score', '')
        
        if home_score and away_score:
            print(f"{away_team} {away_score} vs {home_score} {home_team}")
        else:
            print(f"{away_team} vs {home_team}")

def save_to_csv(games, filename=None):
    """
    Saves the game data to a CSV file
    
    Args:
        games (list): List of game data dictionaries
        filename (str, optional): Output filename. Defaults to None.
    
    Returns:
        str: Path to saved file
    """
    if filename is None:
        date_str = datetime.now().strftime("%Y%m%d")
        filename = f"kbo_schedule_{date_str}.csv"
    
    # Create DataFrame and save to CSV
    df = pd.DataFrame(games)
    df.to_csv(filename, index=False, encoding='utf-8-sig')
    print(f"Data saved to {filename}")
    return filename

def get_week_dates(start_date_str, end_date_str):
    """
    주 단위로 날짜 리스트를 생성합니다.
    
    Args:
        start_date_str (str): 시작 날짜 (YYYY-MM-DD)
        end_date_str (str): 종료 날짜 (YYYY-MM-DD)
    
    Returns:
        list: 주 단위 날짜 리스트
    """
    start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
    end_date = datetime.strptime(end_date_str, "%Y-%m-%d")
    
    dates = []
    current_date = start_date
    
    while current_date <= end_date:
        dates.append(current_date.strftime("%Y-%m-%d"))
        current_date += timedelta(days=7)
    
    return dates

if __name__ == "__main__":
    start_date = "2025-05-27"
    end_date = "2025-08-31"
    
    print(f"Crawling KBO schedule from {start_date} to {end_date}...")
    
    try:
        # 모든 주의 날짜 리스트 생성
        week_dates = get_week_dates(start_date, end_date)
        
        # 모든 주의 데이터 수집
        all_games = []
        for date in week_dates:
            print(f"\nCrawling week of {date}...")
            games = crawl_kbo_schedule(date)
            all_games.extend(games)
        
        # 결과 표시
        display_results(all_games)
        
        # CSV로 저장
        save_to_csv(all_games)
        
        # Supabase에 저장
        save_to_supabase(all_games)
        
    except Exception as e:
        print(f"An error occurred: {e}") 