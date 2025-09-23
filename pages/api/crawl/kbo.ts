import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import * as cheerio from 'cheerio';

interface KBOGame {
  date: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  stadium: string;
  status: string; // 경기 상태 (예정, 진행중, 종료)
  homeScore?: number;
  awayScore?: number;
  result?: '1' | '0' | '2'; // 1: 홈팀 승, 0: 무승부, 2: 원정팀 승
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '지원하지 않는 메서드입니다.' });
  }

  try {
    const { date } = req.query;
    
    // 날짜 형식 검증 (YYYY-MM-DD 또는 YYYY-M-D)
    if (!date || typeof date !== 'string') {
      return res.status(400).json({ error: '날짜를 입력해주세요. (형식: YYYY-MM-DD)' });
    }

    // 네이버 스포츠 KBO 일정 URL
    const url = `https://m.sports.naver.com/kbaseball/schedule/index?date=${date}`;
    
    console.log(`크롤링 시작: ${url}`);

    // 네이버 페이지 요청
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const games: KBOGame[] = [];

    // 네이버 스포츠 모바일 페이지의 경기 정보 추출
    $('.ScheduleAllType_match_item__1QoUG').each((index, element) => {
      try {
        const $game = $(element);
        
        // 시간 정보
        const timeElement = $game.find('.ScheduleAllType_time__3FPgq');
        const time = timeElement.text().trim();
        
        // 팀 정보
        const homeTeamElement = $game.find('.ScheduleAllType_team__2yFLZ').first();
        const awayTeamElement = $game.find('.ScheduleAllType_team__2yFLZ').last();
        
        const homeTeam = homeTeamElement.find('.ScheduleAllType_team_name__3Jw4w').text().trim();
        const awayTeam = awayTeamElement.find('.ScheduleAllType_team_name__3Jw4w').text().trim();
        
        // 경기장 정보
        const stadium = $game.find('.ScheduleAllType_stadium__1KBRR').text().trim();
        
        // 점수 정보 (경기가 끝난 경우)
        const homeScoreElement = homeTeamElement.find('.ScheduleAllType_score__12bgi');
        const awayScoreElement = awayTeamElement.find('.ScheduleAllType_score__12bgi');
        
        let homeScore: number | undefined;
        let awayScore: number | undefined;
        let status = '예정';
        let result: '1' | '0' | '2' | undefined;

        if (homeScoreElement.length > 0 && awayScoreElement.length > 0) {
          homeScore = parseInt(homeScoreElement.text().trim());
          awayScore = parseInt(awayScoreElement.text().trim());
          status = '종료';
          
          // 결과 판정
          if (homeScore > awayScore) {
            result = '1'; // 홈팀 승
          } else if (homeScore < awayScore) {
            result = '2'; // 원정팀 승
          } else {
            result = '0'; // 무승부
          }
        } else {
          // 경기 상태 확인
          const statusElement = $game.find('.ScheduleAllType_state__3EPL8');
          if (statusElement.length > 0) {
            const statusText = statusElement.text().trim();
            if (statusText.includes('진행중') || statusText.includes('라이브')) {
              status = '진행중';
            } else if (statusText.includes('연기') || statusText.includes('취소')) {
              status = '연기';
            }
          }
        }

        if (homeTeam && awayTeam) {
          games.push({
            date: date as string,
            time,
            homeTeam,
            awayTeam,
            stadium,
            status,
            homeScore,
            awayScore,
            result,
          });
        }
      } catch (error) {
        console.error('경기 정보 파싱 오류:', error);
      }
    });

    console.log(`크롤링 완료: ${games.length}개 경기 발견`);

    return res.status(200).json({
      success: true,
      date,
      games,
      total: games.length,
    });

  } catch (error) {
    console.error('크롤링 오류:', error);
    
    if (axios.isAxiosError(error)) {
      return res.status(500).json({ 
        error: '네이버 스포츠 페이지 요청 실패', 
        details: error.message 
      });
    }
    
    return res.status(500).json({ 
      error: '크롤링 중 오류가 발생했습니다.', 
      details: error instanceof Error ? error.message : '알 수 없는 오류' 
    });
  }
}

