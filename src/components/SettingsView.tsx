/**
 * 6. 設定画面コンポーネント
 * 基準値（生残率・AI信頼度・採取量）、施設名・担当者設定、水槽の追加・有効化、データ初期化・サンプル復元
 */

import React, { useState } from 'react';
import { AppSettings, TankInfo } from '../types';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Layers, 
  Building2, 
  User, 
  ShieldCheck
} from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  tanks: TankInfo[];
  onSaveSettings: (newSettings: AppSettings) => void;
  onRestoreSampleData: () => void;
  onClearAllData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  tanks,
  onSaveSettings,
  onRestoreSampleData,
  onClearAllData
}) => {
  const [facilityName, setFacilityName] = useState<string>(settings.facilityName);
  const [defaultOperator, setDefaultOperator] = useState<string>(settings.defaultOperator);
  const [survivalRateWarningThreshold, setSurvivalRateWarningThreshold] = useState<number>(
    settings.survivalRateWarningThreshold
  );
  const [aiConfidenceThreshold, setAiConfidenceThreshold] = useState<number>(
    settings.aiConfidenceThreshold
  );
  const [standardSampleVolume, setStandardSampleVolume] = useState<number>(
    settings.standardSampleVolume
  );
  const [alertStaleDaysThreshold, setAlertStaleDaysThreshold] = useState<number>(
    settings.alertStaleDaysThreshold || 3
  );

  // 水槽設定
  const [localTanks, setLocalTanks] = useState<TankInfo[]>(tanks);
  const [newTankId, setNewTankId] = useState<string>('');
  const [newTankName, setNewTankName] = useState<string>('');

  // メッセージ
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AppSettings = {
      facilityName,
      defaultOperator,
      survivalRateWarningThreshold: Number(survivalRateWarningThreshold),
      aiConfidenceThreshold: Number(aiConfidenceThreshold),
      standardSampleVolume: Number(standardSampleVolume),
      alertStaleDaysThreshold: Number(alertStaleDaysThreshold),
      tanks: localTanks
    };

    onSaveSettings(updated);
    setSuccessMsg('システム設定を保存しました。');
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleToggleTank = (tankId: string) => {
    setLocalTanks((prev) =>
      prev.map((t) => (t.id === tankId ? { ...t, enabled: !t.enabled } : t))
    );
  };

  const handleAddTank = () => {
    if (!newTankId.trim() || !newTankName.trim()) {
      alert('水槽IDと水槽名を入力してください。');
      return;
    }

    if (localTanks.some((t) => t.id === newTankId.trim())) {
      alert('その水槽IDは既に存在します。');
      return;
    }

    const newTank: TankInfo = {
      id: newTankId.trim().toUpperCase(),
      name: newTankName.trim(),
      status: 'active',
      currentLotId: 'LOT-NEW',
      startDate: new Date().toISOString().slice(0, 10),
      latestSurvivalRate: 95.0,
      latestSampleDate: new Date().toISOString().slice(0, 10),
      pendingCount: 0,
      capacityLitres: 10000,
      waterTempCelsius: 16.5,
      salinityPsu: 33.0,
      enabled: true
    };

    setLocalTanks([...localTanks, newTank]);
    setNewTankId('');
    setNewTankName('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 画面見出し */}
      <div className="bg-white p-4 sm:p-5 rounded-xl shadow-xs border border-gray-200">
        <h2 className="text-xl font-bold text-[#12324A] tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#1677A6]" />
          システム環境・基準値設定
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          AI判定信頼度および生残率の警戒基準値、施設情報、検鏡採取量、水槽構成を設定・保存します。
        </p>
      </div>

      {/* 成功通知 */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. 警戒・判定基準値設定 */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-200 space-y-4">
          <h3 className="text-sm font-bold text-[#12324A] flex items-center gap-2 pb-2 border-b border-gray-100">
            <ShieldCheck className="w-4 h-4 text-[#1677A6]" />
            AI判定・警戒閾値パラメータ設定
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* 生残率の注意基準 */}
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                生残率の注意基準値 (%)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={survivalRateWarningThreshold}
                  onChange={(e) => setSurvivalRateWarningThreshold(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 font-bold text-gray-900 focus:ring-2 focus:ring-[#1677A6]"
                />
                <span className="text-gray-500 font-semibold">%</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                この値を下回るとダッシュボードや解析時に注意アラートを表示します（初期値: 85%）。
              </p>
            </div>

            {/* AI信頼度の確認基準 */}
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                AI信頼度の確認基準値 (%)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="50"
                  max="99"
                  value={aiConfidenceThreshold}
                  onChange={(e) => setAiConfidenceThreshold(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 font-bold text-gray-900 focus:ring-2 focus:ring-[#1677A6]"
                />
                <span className="text-gray-500 font-semibold">%</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                この値を下回ると自動的に「人による確認が必要です」と判定されます（初期値: 80%）。
              </p>
            </div>

            {/* 標準採取量 */}
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                標準サンプリング採取量 (ml)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="10"
                  value={standardSampleVolume}
                  onChange={(e) => setStandardSampleVolume(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 font-bold text-gray-900 focus:ring-2 focus:ring-[#1677A6]"
                />
                <span className="text-gray-500 font-semibold">ml</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                新規撮影時の初期サンプリング量（初期値: 1.0ml）。
              </p>
            </div>
          </div>
        </div>

        {/* 2. 施設・職員プロファイル設定 */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-200 space-y-4">
          <h3 className="text-sm font-bold text-[#12324A] flex items-center gap-2 pb-2 border-b border-gray-100">
            <Building2 className="w-4 h-4 text-[#1677A6]" />
            施設情報・担当者設定
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">施設名</label>
              <input
                type="text"
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#1677A6]"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">標準担当者（操作者）</label>
              <input
                type="text"
                value={defaultOperator}
                onChange={(e) => setDefaultOperator(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#1677A6]"
              />
            </div>
          </div>
        </div>

        {/* 3. 飼育水槽の有効化・追加設定 */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-200 space-y-4">
          <h3 className="text-sm font-bold text-[#12324A] flex items-center gap-2 pb-2 border-b border-gray-100">
            <Layers className="w-4 h-4 text-[#1677A6]" />
            水槽マスタ管理（有効化・無効化・追加）
          </h3>

          <div className="space-y-2 text-xs">
            {localTanks.map((tank) => (
              <div
                key={tank.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm text-[#12324A] w-12">{tank.id}</span>
                  <div>
                    <span className="font-semibold text-gray-800">{tank.name}</span>
                    <span className="text-gray-500 text-[11px] ml-2">容量: {tank.capacityLitres.toLocaleString()}L</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleTank(tank.id)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                      tank.enabled
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {tank.enabled ? '有効 (稼働中)' : '無効 (休止)'}
                  </button>
                </div>
              </div>
            ))}

            {/* 新規水槽追加行 */}
            <div className="p-3 bg-[#EAF6FA] rounded-lg border border-[#BDE0EE] flex flex-wrap items-center gap-2.5 mt-3">
              <input
                type="text"
                placeholder="水槽ID (例: T-06)"
                value={newTankId}
                onChange={(e) => setNewTankId(e.target.value)}
                className="bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs w-32"
              />
              <input
                type="text"
                placeholder="水槽名 (例: 第6稚ウニ水槽)"
                value={newTankName}
                onChange={(e) => setNewTankName(e.target.value)}
                className="bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs flex-1 min-w-[180px]"
              />
              <button
                type="button"
                onClick={handleAddTank}
                className="px-3 py-1.5 bg-[#1677A6] hover:bg-[#125E84] text-white rounded text-xs font-semibold flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                水槽を追加
              </button>
            </div>
          </div>
        </div>

        {/* 保存ボタン */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-[#1677A6] hover:bg-[#125E84] text-white font-bold rounded-xl shadow-md transition text-sm"
          >
            <Save className="w-4 h-4" />
            設定を保存
          </button>
        </div>
      </form>

      {/* 4. データ保守・復元エリア */}
      <div className="bg-white p-5 rounded-xl shadow-xs border border-rose-200 space-y-4">
        <h3 className="text-sm font-bold text-rose-900 flex items-center gap-2 pb-2 border-b border-rose-100">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          データメンテナンス・試作データ復元
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div>
            <div className="font-bold text-gray-800">初期サンプルデータへの復元</div>
            <p className="text-gray-500 mt-0.5">
              入力・修正したデータを破棄し、初期のデモ用サンプルデータ（8件の解析、5水槽、14日履歴）に完全復元します。
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowRestoreConfirm(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg transition whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4" />
            サンプルデータに戻す
          </button>
        </div>

        <div className="border-t border-gray-100 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div>
            <div className="font-bold text-rose-800">全データの初期化 (クリア)</div>
            <p className="text-gray-500 mt-0.5">
              ブラウザのlocalStorageに保存されたすべての解析記録、水槽情報、設定を消去します。
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg transition whitespace-nowrap shadow-xs"
          >
            <Trash2 className="w-4 h-4" />
            全データを初期化
          </button>
        </div>
      </div>

      {/* サンプルデータ復元確認ダイアログ */}
      {showRestoreConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-5 max-w-md w-full shadow-xl border border-gray-200 space-y-4">
            <h4 className="font-bold text-base text-[#12324A] flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-[#1677A6]" />
              サンプルデータに戻しますか？
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              現在保存されているすべての解析記録および手動修正データが、初期のデモ用サンプルデータで上書きされます。よろしいですか？
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRestoreConfirm(false)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={() => {
                  onRestoreSampleData();
                  setShowRestoreConfirm(false);
                  setSuccessMsg('サンプルデータに復元しました。');
                  setTimeout(() => setSuccessMsg(null), 3500);
                }}
                className="px-4 py-2 bg-[#1677A6] hover:bg-[#125E84] text-white text-xs font-bold rounded-lg"
              >
                復元する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 全データ初期化確認ダイアログ */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-5 max-w-md w-full shadow-xl border border-rose-200 space-y-4">
            <h4 className="font-bold text-base text-rose-700 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-600" />
              【確認】全データを初期化しますか？
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              ローカルストレージ内の全レコードが消去されます。この操作は取り消せません。
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearAllData();
                  setShowClearConfirm(false);
                  setSuccessMsg('すべてのデータを初期化しました。');
                  setTimeout(() => setSuccessMsg(null), 3500);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs"
              >
                完全に初期化
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
