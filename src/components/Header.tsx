/**
 * アプリケーション共通ヘッダー
 * 施設名、最終更新日時、操作者情報、データ状態バッジを表示
 */

import React, { useEffect, useState } from 'react';
import { AppSettings } from '../types';
import { User, Clock, Building2, ShieldAlert } from 'lucide-react';

interface HeaderProps {
  settings: AppSettings;
  pendingCount: number;
  onNavigateToPending: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  pendingCount,
  onNavigateToPending
}) => {
  const [currentDateTime, setCurrentDateTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setCurrentDateTime(`${year}年${month}月${day}日 ${hours}:${minutes}:${seconds}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-[#12324A] text-white border-b border-[#234E6F] sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 左側：施設名 & アプリタイトル */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#1677A6] shadow-inner text-white font-bold text-lg">
              海
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[#EAF6FA] flex items-center gap-1 bg-[#1A3E59] px-2 py-0.5 rounded border border-[#2B5B7D]">
                  <Building2 className="w-3 h-3 text-[#5AC3EE]" />
                  {settings.facilityName}
                </span>
                <span className="text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded-full">
                  試作品・サンプルデータ
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5 mt-0.5">
                ウニ種苗 AI生産管理
                <span className="hidden md:inline-block text-xs font-normal text-gray-300 ml-2">
                  幼生・稚ウニの計数、生残率、着底状況を一画面で管理
                </span>
              </h1>
            </div>
          </div>

          {/* 右側：更新日時・操作者・確認待ち通知 */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* 確認待ちアラートボタン（確認待ちがある場合） */}
            {pendingCount > 0 && (
              <button
                onClick={onNavigateToPending}
                className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-md text-xs font-semibold transition"
                title="確認待ちの解析結果があります"
              >
                <ShieldAlert className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>確認待ち <span className="bg-amber-500 text-slate-900 px-1.5 py-0.2 rounded-full font-bold">{pendingCount}</span></span>
              </button>
            )}

            {/* 時計 */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-gray-300 bg-[#0E273C] px-2.5 py-1 rounded border border-[#234E6F]">
              <Clock className="w-3.5 h-3.5 text-[#5AC3EE]" />
              <span className="font-mono">{currentDateTime || '2026年08月19日 10:30'}</span>
            </div>

            {/* 操作者 */}
            <div className="flex items-center gap-1.5 text-xs bg-[#1A3E59] text-white px-2.5 py-1 rounded border border-[#2B5B7D]">
              <User className="w-3.5 h-3.5 text-[#5AC3EE]" />
              <span className="hidden sm:inline text-gray-300">操作者:</span>
              <span className="font-semibold text-white">{settings.defaultOperator}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
