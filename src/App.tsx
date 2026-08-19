/**
 * エゾバフンウニ種苗生産センター - AI画像解析・生産管理ダッシュボード
 * メインアプリケーションコンポーネント
 */

import React, { useState, useEffect } from 'react';
import { 
  AnalysisRecord, 
  AppSettings, 
  LotInfo, 
  NavigationTab, 
  TankInfo 
} from './types';
import { 
  loadRecords, 
  saveRecords, 
  loadTanks, 
  saveTanks, 
  loadLots, 
  saveLots, 
  loadSettings, 
  saveSettings, 
  resetToDefaultSampleData, 
  clearAllData 
} from './services/storageService';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { HomeDashboard } from './components/HomeDashboard';
import { CaptureAndAnalysis } from './components/CaptureAndAnalysis';
import { PendingReviews } from './components/PendingReviews';
import { TankAndLotManagement } from './components/TankAndLotManagement';
import { AnalyticsReports } from './components/AnalyticsReports';
import { SettingsView } from './components/SettingsView';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('home');
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [tanks, setTanks] = useState<TankInfo[]>([]);
  const [lots, setLots] = useState<LotInfo[]>([]);
  const [settings, setSettings] = useState<AppSettings>(loadSettings());
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // 初期データ読み込み
  useEffect(() => {
    const initRecords = loadRecords();
    const initTanks = loadTanks();
    const initLots = loadLots();
    const initSettings = loadSettings();

    setRecords(initRecords);
    setTanks(initTanks);
    setLots(initLots);
    setSettings(initSettings);
    setIsLoaded(true);
  }, []);

  // レコード追加 / 更新
  const handleSaveRecord = (newRecord: AnalysisRecord) => {
    const updatedRecords = [newRecord, ...records.filter((r) => r.id !== newRecord.id)];
    setRecords(updatedRecords);
    saveRecords(updatedRecords);

    // 水槽情報の更新（最新生残率・最終検鏡日・確認待ちカウント）
    const updatedTanks = tanks.map((t) => {
      if (t.id === newRecord.tankId) {
        const tankPending = updatedRecords.filter((r) => r.tankId === t.id && r.status === 'pending').length;
        return {
          ...t,
          latestSurvivalRate: newRecord.finalResult.survivalRate,
          latestSampleDate: newRecord.sampleDate,
          pendingCount: tankPending
        };
      }
      return t;
    });

    setTanks(updatedTanks);
    saveTanks(updatedTanks);
  };

  // 確認待ち確定による更新
  const handleUpdateRecord = (updatedRecord: AnalysisRecord) => {
    const updatedRecords = records.map((r) =>
      r.id === updatedRecord.id ? updatedRecord : r
    );
    setRecords(updatedRecords);
    saveRecords(updatedRecords);

    // 水槽の確認待ち件数を再計算
    const updatedTanks = tanks.map((t) => {
      const tankPending = updatedRecords.filter((r) => r.tankId === t.id && r.status === 'pending').length;
      return { ...t, pendingCount: tankPending };
    });
    setTanks(updatedTanks);
    saveTanks(updatedTanks);
  };

  // 水槽情報の更新
  const handleUpdateTank = (updatedTank: TankInfo) => {
    const updated = tanks.map((t) => (t.id === updatedTank.id ? updatedTank : t));
    setTanks(updated);
    saveTanks(updated);
  };

  // ロット情報の更新
  const handleUpdateLot = (updatedLot: LotInfo) => {
    const updated = lots.map((l) => (l.lotId === updatedLot.lotId ? updatedLot : l));
    setLots(updated);
    saveLots(updated);
  };

  // 設定の更新
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    if (newSettings.tanks) {
      setTanks(newSettings.tanks);
      saveTanks(newSettings.tanks);
    }
  };

  // サンプルデータ復元
  const handleRestoreSampleData = () => {
    resetToDefaultSampleData();
    setRecords(loadRecords());
    setTanks(loadTanks());
    setLots(loadLots());
    setSettings(loadSettings());
  };

  // 全データ初期化
  const handleClearAllData = () => {
    clearAllData();
    setRecords([]);
    setTanks(loadTanks());
    setLots(loadLots());
  };

  // 水槽画面から「この水槽を検鏡」で直接移動
  const handleNavigateToCaptureWithTank = (tankId: string, lotId: string) => {
    setActiveTab('capture');
  };

  // 確認待ち件数
  const pendingCount = records.filter((r) => r.status === 'pending').length;

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center text-[#12324A]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#1677A6] border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-sm font-bold">システムを読み込んでいます...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col text-[#12324A] font-sans antialiased">
      {/* グローバルヘッダー */}
      <Header
        settings={settings}
        pendingCount={pendingCount}
        onNavigateToPending={() => setActiveTab('pending')}
      />

      {/* メインレイアウト（サイドバー + コンテンツ） */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto">
        {/* サイドバー */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          pendingCount={pendingCount}
        />

        {/* メインビュー */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'home' && (
            <HomeDashboard
              records={records}
              tanks={tanks}
              lots={lots}
              settings={settings}
              onNavigateToCapture={() => setActiveTab('capture')}
              onNavigateToPending={() => setActiveTab('pending')}
              onSelectRecordForReview={(rec) => {
                setActiveTab('pending');
              }}
            />
          )}

          {activeTab === 'capture' && (
            <CaptureAndAnalysis
              tanks={tanks}
              lots={lots}
              settings={settings}
              onSaveRecord={handleSaveRecord}
              onNavigateToPending={() => setActiveTab('pending')}
            />
          )}

          {activeTab === 'pending' && (
            <PendingReviews
              records={records}
              settings={settings}
              onUpdateRecord={handleUpdateRecord}
            />
          )}

          {activeTab === 'tanks' && (
            <TankAndLotManagement
              tanks={tanks}
              lots={lots}
              settings={settings}
              onUpdateTank={handleUpdateTank}
              onUpdateLot={handleUpdateLot}
              onNavigateToCaptureWithTank={handleNavigateToCaptureWithTank}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsReports
              records={records}
              tanks={tanks}
              lots={lots}
              settings={settings}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              tanks={tanks}
              onSaveSettings={handleSaveSettings}
              onRestoreSampleData={handleRestoreSampleData}
              onClearAllData={handleClearAllData}
            />
          )}
        </main>
      </div>
    </div>
  );
}
