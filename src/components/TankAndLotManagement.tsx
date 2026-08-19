/**
 * 4. 水槽・ロット管理画面コンポーネント
 * 水槽ステータス（T-01〜T-05）、水質環境、ロット追跡、推定総個体数および発育・着底進捗の管理
 */

import React, { useState } from 'react';
import { AppSettings, GrowthStage, LotInfo, TankInfo } from '../types';
import { 
  Layers, 
  Thermometer, 
  Droplets, 
  Calendar, 
  User, 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Plus, 
  ArrowRight,
  TrendingUp,
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';

interface TankAndLotManagementProps {
  tanks: TankInfo[];
  lots: LotInfo[];
  settings: AppSettings;
  onUpdateTank: (tank: TankInfo) => void;
  onUpdateLot: (lot: LotInfo) => void;
  onNavigateToCaptureWithTank: (tankId: string, lotId: string) => void;
}

export const TankAndLotManagement: React.FC<TankAndLotManagementProps> = ({
  tanks,
  lots,
  settings,
  onUpdateTank,
  onUpdateLot,
  onNavigateToCaptureWithTank
}) => {
  const [selectedTankId, setSelectedTankId] = useState<string>('T-01');
  const [activeSubTab, setActiveSubTab] = useState<'tanks' | 'lots'>('tanks');

  const selectedTank = tanks.find((t) => t.id === selectedTankId) || tanks[0];
  const selectedLot = lots.find((l) => l.tankId === selectedTank?.id) || lots[0];

  return (
    <div className="space-y-6 pb-12">
      {/* 画面見出し */}
      <div className="bg-white p-4 sm:p-5 rounded-xl shadow-xs border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#12324A] tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#1677A6]" />
            水槽・生産ロット管理
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            各水槽（T-01〜T-05）の稼働状態、水温・塩分濃度、受精ロット別推定個体数および発育ステージを一括管理します。
          </p>
        </div>

        {/* サブタブ切り替え */}
        <div className="flex items-center bg-gray-100 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('tanks')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeSubTab === 'tanks'
                ? 'bg-white text-[#12324A] shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            水槽別モニタリング ({tanks.filter(t => t.enabled).length}基)
          </button>
          <button
            onClick={() => setActiveSubTab('lots')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeSubTab === 'lots'
                ? 'bg-white text-[#12324A] shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            生産ロット一覧 ({lots.length}ロット)
          </button>
        </div>
      </div>

      {activeSubTab === 'tanks' ? (
        /* 水槽別モニタリング画面 */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左側：水槽カードグリッド (7/12) */}
          <div className="lg:col-span-7 space-y-3.5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              飼育水槽ステータス一覧
            </h3>

            <div className="space-y-3">
              {tanks.filter(t => t.enabled).map((tank) => {
                const isSelected = selectedTankId === tank.id;
                const isWarning = tank.latestSurvivalRate < settings.survivalRateWarningThreshold;
                const matchedLot = lots.find((l) => l.lotId === tank.currentLotId);

                return (
                  <div
                    key={tank.id}
                    onClick={() => setSelectedTankId(tank.id)}
                    className={`p-4 rounded-xl border transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'border-[#1677A6] ring-2 ring-[#1677A6]/20 bg-[#F4F9FC] shadow-sm'
                        : isWarning
                        ? 'border-rose-200 bg-rose-50/40 hover:bg-rose-50/80'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm text-white ${
                          isWarning ? 'bg-rose-600' : 'bg-[#12324A]'
                        }`}>
                          {tank.id}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-[#12324A]">{tank.name}</h4>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              isWarning ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {isWarning ? '注意（水温・生残率）' : '正常稼働'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                            <span>ロット: <strong className="text-gray-700">{tank.currentLotId}</strong></span>
                            <span>・</span>
                            <span>段階: <strong className="text-[#1677A6]">{matchedLot?.growthStage || '浮遊幼生'}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* 生残率 ＆ 確認待ちバッジ */}
                      <div className="text-right">
                        <div className="text-xs text-gray-500 font-medium">最新生残率</div>
                        <div className={`text-xl font-bold ${isWarning ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {tank.latestSurvivalRate}%
                        </div>
                        {tank.pendingCount > 0 && (
                          <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.5 rounded-full inline-block mt-0.5">
                            確認待ち {tank.pendingCount}件
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 環境パラメータ（水温・塩分・水量） */}
                    <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-xs text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Thermometer className={`w-3.5 h-3.5 ${tank.waterTempCelsius > 18.0 ? 'text-rose-600' : 'text-sky-600'}`} />
                        <span>水温: <strong className="text-gray-800">{tank.waterTempCelsius}℃</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Droplets className="w-3.5 h-3.5 text-[#1677A6]" />
                        <span>塩分: <strong className="text-gray-800">{tank.salinityPsu} PSU</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 justify-end">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>最終: {tank.latestSampleDate}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 右側：選択水槽のハイライト詳細パネル (5/12) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-200 sticky top-20">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-[#1677A6] text-white font-bold flex items-center justify-center text-sm">
                    {selectedTank.id}
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-[#12324A]">{selectedTank.name}</h3>
                    <span className="text-[11px] text-gray-500">水槽容量: {selectedTank.capacityLitres.toLocaleString()} L</span>
                  </div>
                </div>

                <button
                  onClick={() => onNavigateToCaptureWithTank(selectedTank.id, selectedTank.currentLotId)}
                  className="bg-[#1677A6] hover:bg-[#125E84] text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-2xs transition flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  この水槽を検鏡
                </button>
              </div>

              {/* 関連ロット情報カード */}
              {selectedLot && (
                <div className="mt-4 space-y-3 text-xs">
                  <div className="p-3 bg-[#EAF6FA] rounded-lg border border-[#BDE0EE]">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] font-bold text-[#1677A6] uppercase tracking-wider">
                        収容ロット詳細
                      </span>
                      <span className="text-xs font-mono font-bold text-[#12324A]">
                        {selectedLot.lotId}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <span className="text-gray-500 block text-[10px]">受精日</span>
                        <span className="font-semibold text-gray-800">{selectedLot.fertilizationDate}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px]">発育段階</span>
                        <span className="font-bold text-[#1677A6]">{selectedLot.growthStage}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px]">初期投入数</span>
                        <span className="font-semibold text-gray-800">
                          {(selectedLot.initialCount / 10000).toFixed(0)}万 個体
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px]">現在の推定個体数</span>
                        <span className="font-bold text-emerald-800 text-sm">
                          {(selectedLot.currentEstimatedCount / 10000).toFixed(1)}万 個体
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 着底率 & 生残状況 */}
                  <div className="space-y-2">
                    <div className="flex justify-between font-semibold text-gray-700">
                      <span>波板着底率</span>
                      <span className="text-[#1677A6]">{selectedLot.settlementRate}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#1677A6] h-full rounded-full transition-all duration-300"
                        style={{ width: `${selectedLot.settlementRate}%` }}
                      />
                    </div>
                  </div>

                  {/* 管理特記事項 */}
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="font-semibold text-gray-700 block mb-1">飼育管理ノート</span>
                    <p className="text-gray-600 leading-relaxed text-[11px]">
                      {selectedTank.notes || selectedLot.notes || '異常なし。給餌・換水計画通り推進中。'}
                    </p>
                  </div>

                  {/* 担当者 */}
                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-100">
                    <span>主担当職員:</span>
                    <span className="font-semibold text-gray-800 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-[#1677A6]" />
                      {selectedLot.operator}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ロット一覧テーブル画面 */
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#12324A] text-white border-b border-[#234E6F]">
                  <th className="py-3 px-4 font-semibold">ロットID</th>
                  <th className="py-3 px-3 font-semibold">受精日</th>
                  <th className="py-3 px-3 font-semibold">収容水槽</th>
                  <th className="py-3 px-3 font-semibold">発育段階</th>
                  <th className="py-3 px-3 font-semibold text-right">開始個体数</th>
                  <th className="py-3 px-3 font-semibold text-right">現在推定個体数</th>
                  <th className="py-3 px-3 font-semibold text-center">最新生残率</th>
                  <th className="py-3 px-3 font-semibold text-center">着底率</th>
                  <th className="py-3 px-3 font-semibold">担当者</th>
                  <th className="py-3 px-4 font-semibold">飼育状況・備考</th>
                  <th className="py-3 px-3 font-semibold text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lots.map((lot) => (
                  <tr key={lot.lotId} className="hover:bg-sky-50/50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#12324A]">
                      {lot.lotId}
                    </td>
                    <td className="py-3.5 px-3 text-gray-600">{lot.fertilizationDate}</td>
                    <td className="py-3.5 px-3">
                      <span className="font-bold text-[#12324A] bg-gray-100 px-2 py-0.5 rounded border border-gray-300">
                        {lot.tankId}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-[#1677A6]">
                      {lot.growthStage}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-gray-600">
                      {lot.initialCount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-800">
                      {lot.currentEstimatedCount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className={`font-bold px-2 py-0.5 rounded ${
                        lot.latestSurvivalRate < settings.survivalRateWarningThreshold
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {lot.latestSurvivalRate}%
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-gray-700">
                      {lot.settlementRate}%
                    </td>
                    <td className="py-3.5 px-3 text-gray-700">{lot.operator}</td>
                    <td className="py-3.5 px-4 text-gray-600 max-w-[200px] truncate" title={lot.notes}>
                      {lot.notes}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => onNavigateToCaptureWithTank(lot.tankId, lot.lotId)}
                        className="bg-[#1677A6] hover:bg-[#125E84] text-white px-2.5 py-1 rounded text-xs font-semibold transition"
                      >
                        検鏡
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
