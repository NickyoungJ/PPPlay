#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
from datetime import datetime, timedelta
import subprocess

# 기존 크롤러 import
sys.path.append(os.path.dirname(__file__))
from naver_2025_0916_crawler import crawl_naver_kbo_date

def crawl_date_range():
    """2025년 9월 22일부터 30일까지 KBO 경기 크롤링"""
    
    print("🏟️ KBO 경기 다중 날짜 크롤링 시작")
    print("📅 기간: 2025년 9월 22일 ~ 30일")
    print("=" * 60)
    
    # 크롤링할 날짜 범위 설정
    start_date = datetime(2025, 9, 22)
    end_date = datetime(2025, 9, 30)
    
    current_date = start_date
    total_games = 0
    successful_dates = []
    failed_dates = []
    
    while current_date <= end_date:
        date_str = current_date.strftime('%Y-%m-%d')
        print(f"\n📅 {date_str} 크롤링 시작...")
        
        try:
            games_count = crawl_naver_kbo_date(date_str)
            
            if games_count > 0:
                print(f"✅ {date_str}: {games_count}개 경기 크롤링 완료")
                successful_dates.append((date_str, games_count))
                total_games += games_count
            else:
                print(f"ℹ️  {date_str}: 경기 없음")
                successful_dates.append((date_str, 0))
                
        except Exception as e:
            print(f"❌ {date_str} 크롤링 실패: {e}")
            failed_dates.append((date_str, str(e)))
        
        current_date += timedelta(days=1)
    
    # 결과 요약
    print("\n" + "=" * 60)
    print("🎉 크롤링 완료!")
    print(f"📊 총 {total_games}개 경기 크롤링")
    print(f"✅ 성공: {len(successful_dates)}일")
    print(f"❌ 실패: {len(failed_dates)}일")
    
    if successful_dates:
        print("\n📈 성공한 날짜:")
        for date_str, count in successful_dates:
            print(f"  - {date_str}: {count}개 경기")
    
    if failed_dates:
        print("\n❌ 실패한 날짜:")
        for date_str, error in failed_dates:
            print(f"  - {date_str}: {error}")
    
    print("=" * 60)
    return total_games

if __name__ == "__main__":
    try:
        total_games = crawl_date_range()
        print(f"\n🏆 최종 결과: 총 {total_games}개 경기 크롤링 완료!")
    except KeyboardInterrupt:
        print("\n⚠️  사용자에 의해 중단되었습니다.")
    except Exception as e:
        print(f"\n💥 예상치 못한 오류 발생: {e}")
