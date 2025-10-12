'use client';

import { useState } from 'react';
import { supabaseClient } from '../../../utils/supabase/client';

export default function LogoUploadPage() {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string[]>([]);

  const teams = [
    { name: 'KIA', displayName: 'KIA 타이거즈' },
    { name: '삼성', displayName: '삼성 라이온즈' },
    { name: 'LG', displayName: 'LG 트윈스' },
    { name: '두산', displayName: '두산 베어스' },
    { name: 'KT', displayName: 'KT 위즈' },
    { name: 'SSG', displayName: 'SSG 랜더스' },
    { name: '롯데', displayName: '롯데 자이언츠' },
    { name: '한화', displayName: '한화 이글스' },
    { name: 'NC', displayName: 'NC 다이노스' },
    { name: '키움', displayName: '키움 히어로즈' }
  ];

  const uploadLogo = async (file: File, teamName: string) => {
    try {
      const fileName = `${teamName.toLowerCase()}-logo.png`;
      
      // Storage에 업로드
      const { error } = await supabaseClient.storage
        .from('KBO_teamlogo')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        throw error;
      }

      // 공개 URL 생성
      const { data: urlData } = supabaseClient.storage
        .from('KBO_teamlogo')
        .getPublicUrl(fileName);

      // KBO_team 테이블 업데이트
      const { error: updateError } = await supabaseClient
        .from('KBO_team')
        .update({ logo_url: urlData.publicUrl })
        .eq('name', teamName);

      if (updateError) {
        throw updateError;
      }

      return `✅ ${teamName} 로고 업로드 완료: ${urlData.publicUrl}`;
    } catch (error) {
      return `❌ ${teamName} 업로드 실패: ${error.message}`;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, teamName: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const result = await uploadLogo(file, teamName);
    setUploadStatus(prev => [...prev, result]);
    setUploading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">KBO 팀 로고 업로드</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teams.map((team) => (
          <div key={team.name} className="bg-background/70 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold mb-4 text-center">{team.displayName}</h3>
            
            <div className="space-y-4">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, team.name)}
                disabled={uploading}
                className="w-full p-2 border border-primary/20 rounded-lg bg-background/40 text-foreground"
              />
              
              <div className="text-sm text-foreground/70 text-center">
                권장 크기: 100x100px PNG 파일
              </div>
            </div>
          </div>
        ))}
      </div>

      {uploadStatus.length > 0 && (
        <div className="mt-8 bg-background/70 backdrop-blur-md rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold mb-4">업로드 결과</h3>
          <div className="space-y-2">
            {uploadStatus.map((status, index) => (
              <div key={index} className="text-sm font-mono">
                {status}
              </div>
            ))}
          </div>
        </div>
      )}

      {uploading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>로고 업로드 중...</p>
          </div>
        </div>
      )}
    </div>
  );
}
