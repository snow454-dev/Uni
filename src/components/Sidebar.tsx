/**
 * サイドメニュー（ナビゲーションバー）
 * PCおよびタブレット両対応のレスポンシブサイドバー
 */

import React from 'react';
import { NavigationTab } from '../types';
import { 
  Home, 
  Camera, 
  Clock, 
  Layers, 
  BarChart3, 
  Settings, 
  AlertCircle
} from 'lucide-react';

interface SidebarProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  pendingCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  pendingCount
}) => {
  const menuItems = [
    {
      id: 'home' as NavigationTab,
      label: 'ホーム',
      subtitle: '全体概要・KPI',
      icon: Home
    },
    {
      id: 'capture' as NavigationTab,
      label: '撮影・解析',
      subtitle: 'AI自動計数・修正',
      icon: Camera
    },
    {
      id: 'pending' as NavigationTab,
      label: '確認待ち',
      subtitle: '目視判定キュー',
      icon: Clock,
      badge: pendingCount > 0 ? pendingCount : undefined,
      badgeColor: 'bg-amber-500 text-slate-950'
    },
    {
      id: 'tanks' as NavigationTab,
      label: '水槽・ロット管理',
      subtitle: '個体数・水質監視',
      icon: Layers
    },
    {
      id: 'analytics' as NavigationTab,
      label: '分析・帳票',
      subtitle: '生残推移・CSV出力',
      icon: BarChart3
    },
    {
      id: 'settings' as NavigationTab,
      label: '設定',
      subtitle: '基準値・水槽設定',
      icon: Settings
    }
  ];

  return (
    <aside className="w-full lg:w-64 bg-[#12324A] text-white flex-shrink-0 flex lg:flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#234E6F] shadow-sm">
      {/* メインメニュー */}
      <div className="p-2 lg:p-4 w-full">
        <div className="hidden lg:block mb-4 px-3 py-2 bg-[#0E273C] rounded-lg border border-[#234E6F]">
          <div className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
            システムメニュー
          </div>
          <div className="text-xs text-[#EAF6FA] font-medium mt-0.5">
            エゾバフンウニ種苗生産
          </div>
        </div>

        <nav className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-1 lg:pb-0">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all duration-150 whitespace-nowrap lg:whitespace-normal group ${
                  isActive
                    ? 'bg-[#1677A6] text-white font-semibold shadow-sm'
                    : 'text-gray-300 hover:bg-[#1A3E59] hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-[#84B4D2] group-hover:text-white'
                    }`}
                  />
                  <div>
                    <div className="text-sm leading-tight">{item.label}</div>
                    <div
                      className={`hidden lg:block text-[11px] leading-none mt-0.5 ${
                        isActive ? 'text-[#D3EEF9]' : 'text-gray-400'
                      }`}
                    >
                      {item.subtitle}
                    </div>
                  </div>
                </div>

                {/* バッジ（確認待ち件数など） */}
                {item.badge !== undefined && (
                  <span
                    className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full ${
                      item.badgeColor || 'bg-amber-500 text-slate-900'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* サイドバー下部ステータス（PC時のみ） */}
      <div className="hidden lg:block p-4 border-t border-[#234E6F] bg-[#0E273C]/60 text-xs text-gray-400">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-gray-300 font-medium">AI画像解析エンジン</span>
          <span className="text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            待機中 (v1.0-Sim)
          </span>
        </div>
        <div className="text-[11px] text-gray-400 leading-relaxed">
          平均推論時間: 約1.5秒<br />
          検出対象: プルテウス幼生・稚ウニ
        </div>
      </div>
    </aside>
  );
};
