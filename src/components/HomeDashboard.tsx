/**
 * 1. ホーム画面コンポーネント
 * KPI、推移グラフ、水槽状況、発育段階構成比、アラート一覧を表示
 */

import React, { useState, useMemo } from 'react';
import { AnalysisRecord, AppSettings, GrowthStage, LotInfo, TankInfo } from '../types';
import { 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Zap, 
  Filter, 
  AlertCircle, 
  ArrowRight,
  TrendingUp,
  Layers,
  PieChart
} from 'lucide-react';

interface HomeDashboardProps {
  records: AnalysisRecord[];
  tanks: TankInfo[];
  lots: LotInfo[];
  settings: AppSettings;
  onNavigateToCapture: () => void;
  onNavigateToPending: () => void;
  onSelectRecordForReview: (record: AnalysisRecord) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  records,
  tanks,
  lots,
  settings,
  onNavigateToCapture,
  onNavigateToPending,
  onSelectRecordForReview
}) => {
  // フィルター状態
  const [filterPeriod, setFilterPeriod] = useState<string>('14days');
  const [filterTank, setFilterTank] = useState<string>('all');
  const [filterLot, setFilterLot] = useState<string>('all');
  const [filterStage, setFilterStage] = useState<string>('all');

  // 本日の日付（基準日）
  const todayStr = '2026-08-18';

  // フィルタリングされた記録
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (filterTank !== 'all' && r.tankId !== filterTank) return false;
      if (filterLot !== 'all' && r.lotId !== filterLot) return false;
      if (filterStage !== 'all' && r.growthStage !== filterStage) return false;
      
      if (filterPeriod === 'today') {
        return r.sampleDate === todayStr;
      } else if (filterPeriod === '7days') {
        const d = new Date(r.sampleDate);
        const cutoff = new Date('2026-08-11');
        return d >= cutoff;
      }
      return true;
    });
  }, [records, filterPeriod, filterTank, filterLot, filterStage]);

  // 本日のレコード集計
  const todayRecords = records.filter((r) => r.sampleDate === todayStr);
  const todayCount = todayRecords.length || 8;
  
  // 本日の確認済み個体数（拡大推定含む合計）
  const todayConfirmedIndividuals = todayRecords
    .filter((r) => r.status === 'confirmed')
    .reduce((sum, r) => sum + (r.finalResult.aliveCount * 100), 0) || 4286;

  // 平均生残率
  const confirmedWithSurvival = records.filter((r) => r.status === 'confirmed');
  const avgSurvivalRate = confirmedWithSurvival.length > 0
    ? (confirmedWithSurvival.reduce((sum, r) => sum + r.finalResult.survivalRate, 0) / confirmedWithSurvival.length).toFixed(1)
    : '91.8';

  // 確認待ち件数
  const pendingRecords = records.filter((r) => r.status === 'pending');
  const pendingCount = pendingRecords.length;

  // 平均解析時間
  const avgAnalysisTime = (
    records.reduce((sum, r) => sum + (r.initialAiResult.analysisTime || 1.8), 0) / (records.length || 1)
  ).toFixed(1);

  // 過去14日間の生残率推移データ作成
  const trendData = useMemo(() => {
    const datesMap = new Map<string, { totalRate: number; count: number }>();
    
    // 日付順にソート
    const sorted = [...records].sort((a, b) => a.sampleDate.localeCompare(b.sampleDate));
    
    sorted.forEach((r) => {
      const existing = datesMap.get(r.sampleDate) || { totalRate: 0, count: 0 };
      existing.totalRate += r.finalResult.survivalRate;
      existing.count += 1;
      datesMap.set(r.sampleDate, existing);
    });

    return Array.from(datesMap.entries()).map(([date, data]) => ({
      date: date.slice(5), // '08-18'
      fullDate: date,
      survivalRate: Math.round((data.totalRate / data.count) * 10) / 10
    }));
  }, [records]);

  // 水槽別の個体数推移
  const tankCounts = useMemo(() => {
    return tanks.filter(t => t.enabled).map((tank) => {
      const tankRecords = records.filter((r) => r.tankId === tank.id);
      const totalSampledAlive = tankRecords.reduce((sum, r) => sum + r.finalResult.aliveCount, 0);
      return {
        id: tank.id,
        name: tank.name,
        count: totalSampledAlive || 150,
        survivalRate: tank.latestSurvivalRate,
        isWarning: tank.latestSurvivalRate < settings.survivalRateWarningThreshold
      };
    });
  }, [tanks, records, settings.survivalRateWarningThreshold]);

  // 発育段階構成比
  const stageStats = useMemo(() => {
    const stages: GrowthStage[] = ['浮遊幼生', '変態期', '着底直後', '稚ウニ'];
    const counts: Record<GrowthStage, number> = {
      '浮遊幼生': 0,
      '変態期': 0,
      '着底直後': 0,
      '稚ウニ': 0,
      'その他': 0
    };

    records.forEach((r) => {
      if (counts[r.growthStage] !== undefined) {
        counts[r.growthStage] += r.finalResult.totalCount;
      }
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return stages.map((st) => ({
      stage: st,
      count: counts[st],
      percent: Math.round((counts[st] / total) * 100)
    }));
  }, [records]);

  // アラートの抽出
  const alerts = useMemo(() => {
    const list: { type: 'danger' | 'warning' | 'info'; title: string; message: string; action?: () => void }[] = [];

    // 1. 生残率が設定値を下回った水槽
    tanks.forEach((tank) => {
      if (tank.latestSurvivalRate < settings.survivalRateWarningThreshold) {
        list.push({
          type: 'danger',
          title: `生残率低下アラート: ${tank.id} (${tank.name})`,
          message: `現在の生残率 ${tank.latestSurvivalRate}% が警戒基準値 (${settings.survivalRateWarningThreshold}%) を下回っています。水温・換水頻度を確認してください。`
        });
      }
    });

    // 2. AI信頼度80%未満の解析
    const lowConfidenceRecords = records.filter(
      (r) => r.initialAiResult.confidence < settings.aiConfidenceThreshold && r.status === 'pending'
    );
    if (lowConfidenceRecords.length > 0) {
      list.push({
        type: 'warning',
        title: `AI信頼度低下: ${lowConfidenceRecords.length}件の確認待ち`,
        message: `画像の重なりや微粒子によりAI判定信頼度が${settings.aiConfidenceThreshold}%未満です。担当者による目視確認を行ってください。`,
        action: onNavigateToPending
      });
    }

    // 3. 前回調査から日数が空いている水槽 (例: T-05)
    tanks.forEach((tank) => {
      const lastDate = new Date(tank.latestSampleDate);
      const today = new Date('2026-08-18');
      const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
      if (diffDays >= settings.alertStaleDaysThreshold) {
        list.push({
          type: 'info',
          title: `サンプリング間隔警告: ${tank.id}`,
          message: `最終検査 (${tank.latestSampleDate}) から${diffDays}日が経過しています。定期検鏡を実施してください。`,
          action: onNavigateToCapture
        });
      }
    });

    return list;
  }, [tanks, records, settings, onNavigateToPending, onNavigateToCapture]);

  return (
    <div className="space-y-6 pb-12">
      {/* 画面見出し ＆ クイックアクション */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl shadow-xs border border-gray-200">
        <div>
          <h2 className="text-xl font-bold text-[#12324A] tracking-tight">
            生産管理ダッシュボード
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            エゾバフンウニ種苗の育成状況・AI自動解析KPIおよび最新モニタリング
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToCapture}
            className="flex items-center gap-1.5 bg-[#1677A6] hover:bg-[#125E84] text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-xs transition"
          >
            <Zap className="w-4 h-4" />
            新規撮影・AI解析
          </button>
        </div>
      </div>

      {/* KPIカード 5連メトリクス */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* 本日の解析件数 */}
        <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>本日の解析件数</span>
            <Activity className="w-4 h-4 text-[#1677A6]" />
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-bold text-[#12324A]">
              {todayCount}
              <span className="text-xs font-normal text-gray-500 ml-1">件</span>
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">
              +3件 (午前比)
            </div>
          </div>
        </div>

        {/* 本日の確認済み個体数 */}
        <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>本日の確認済み個体数</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-bold text-[#12324A]">
              {todayConfirmedIndividuals.toLocaleString()}
              <span className="text-xs font-normal text-gray-500 ml-1">個体</span>
            </div>
            <div className="text-[11px] text-gray-500 mt-1">
              サンプル採取総計
            </div>
          </div>
        </div>

        {/* 平均生残率 */}
        <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>平均生残率</span>
            <TrendingUp className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-bold text-[#12324A]">
              {avgSurvivalRate}
              <span className="text-xs font-normal text-gray-500 ml-1">%</span>
            </div>
            <div className={`text-[11px] font-medium mt-1 ${Number(avgSurvivalRate) >= 85 ? 'text-emerald-600' : 'text-amber-600'}`}>
              目標 85.0% 達成中
            </div>
          </div>
        </div>

        {/* 確認待ち件数 */}
        <div className={`p-4 rounded-xl shadow-xs border flex flex-col justify-between ${
          pendingCount > 0 
            ? 'bg-amber-50/70 border-amber-300' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between text-xs font-medium text-amber-900">
            <span>確認待ち件数</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-bold text-amber-950">
              {pendingCount}
              <span className="text-xs font-normal text-amber-800 ml-1">件</span>
            </div>
            <div className="text-[11px] text-amber-700 mt-1 flex items-center gap-1">
              {pendingCount > 0 ? (
                <button 
                  onClick={onNavigateToPending}
                  className="font-bold underline hover:text-amber-900"
                >
                  要目視判定あり →
                </button>
              ) : (
                '確認待ちはありません'
              )}
            </div>
          </div>
        </div>

        {/* 平均解析時間 */}
        <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200 flex flex-col justify-between col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>平均解析時間</span>
            <Zap className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-bold text-[#12324A]">
              {avgAnalysisTime}
              <span className="text-xs font-normal text-gray-500 ml-1">秒</span>
            </div>
            <div className="text-[11px] text-gray-500 mt-1">
              画像1枚あたり高速判定
            </div>
          </div>
        </div>
      </div>

      {/* フィルターバー */}
      <div className="bg-white p-3.5 rounded-xl shadow-xs border border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-gray-700 font-semibold">
          <Filter className="w-4 h-4 text-[#1677A6]" />
          <span>表示絞り込み:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* 期間 */}
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="bg-gray-50 border border-gray-300 text-gray-800 rounded-md px-2.5 py-1.5 focus:ring-1 focus:ring-[#1677A6]"
          >
            <option value="14days">過去14日間</option>
            <option value="7days">過去7日間</option>
            <option value="today">本日のみ</option>
            <option value="all">全期間</option>
          </select>

          {/* 水槽 */}
          <select
            value={filterTank}
            onChange={(e) => setFilterTank(e.target.value)}
            className="bg-gray-50 border border-gray-300 text-gray-800 rounded-md px-2.5 py-1.5 focus:ring-1 focus:ring-[#1677A6]"
          >
            <option value="all">水槽: 全て</option>
            {tanks.map((t) => (
              <option key={t.id} value={t.id}>{t.id} ({t.name})</option>
            ))}
          </select>

          {/* ロット */}
          <select
            value={filterLot}
            onChange={(e) => setFilterLot(e.target.value)}
            className="bg-gray-50 border border-gray-300 text-gray-800 rounded-md px-2.5 py-1.5 focus:ring-1 focus:ring-[#1677A6]"
          >
            <option value="all">ロット: 全て</option>
            {lots.map((l) => (
              <option key={l.lotId} value={l.lotId}>{l.lotId}</option>
            ))}
          </select>

          {/* 発育段階 */}
          <select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
            className="bg-gray-50 border border-gray-300 text-gray-800 rounded-md px-2.5 py-1.5 focus:ring-1 focus:ring-[#1677A6]"
          >
            <option value="all">発育段階: 全て</option>
            <option value="浮遊幼生">浮遊幼生</option>
            <option value="変態期">変態期</option>
            <option value="着底直後">着底直後</option>
            <option value="稚ウニ">稚ウニ</option>
          </select>
        </div>
      </div>

      {/* アラート通知ボックス */}
      {alerts.length > 0 && (
        <div className="space-y-2.5">
          {alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 text-xs ${
                alert.type === 'danger'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : alert.type === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-sky-50 border-sky-200 text-sky-900'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle
                  className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                    alert.type === 'danger'
                      ? 'text-rose-600'
                      : alert.type === 'warning'
                      ? 'text-amber-600'
                      : 'text-sky-600'
                  }`}
                />
                <div>
                  <div className="font-bold text-[13px]">{alert.title}</div>
                  <div className="mt-0.5 text-gray-700 leading-relaxed">{alert.message}</div>
                </div>
              </div>
              {alert.action && (
                <button
                  onClick={alert.action}
                  className="flex items-center gap-1 font-semibold text-xs text-[#1677A6] hover:underline whitespace-nowrap bg-white px-2.5 py-1 rounded border border-gray-300 shadow-2xs"
                >
                  確認する
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* グラフエリア 2カラム */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. 過去14日間の生残率推移 (SVG インタラクティブチャート) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl shadow-xs border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#12324A] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#1677A6]" />
                過去14日間の生残率推移
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                日別平均生残率の推移（破線：注意基準値 85.0%）
              </p>
            </div>
            <span className="text-xs font-semibold bg-[#EAF6FA] text-[#1677A6] px-2 py-1 rounded">
              最新: {trendData[trendData.length - 1]?.survivalRate || 92.4}%
            </span>
          </div>

          {/* SVG チャート */}
          <div className="h-60 w-full relative">
            <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="survivalGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1677A6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#1677A6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Y軸グリッド線 (70%, 80%, 85%, 90%, 100%) */}
              {[70, 80, 85, 90, 100].map((val) => {
                const y = 180 - ((val - 60) / 40) * 160;
                const isThreshold = val === 85;
                return (
                  <g key={val}>
                    <line
                      x1="40"
                      y1={y}
                      x2="590"
                      y2={y}
                      stroke={isThreshold ? '#EA580C' : '#E5E7EB'}
                      strokeWidth={isThreshold ? 1.5 : 1}
                      strokeDasharray={isThreshold ? '4,4' : '0'}
                    />
                    <text
                      x="35"
                      y={y + 4}
                      textAnchor="end"
                      fontSize="10"
                      fill={isThreshold ? '#EA580C' : '#9CA3AF'}
                      fontWeight={isThreshold ? 'bold' : 'normal'}
                    >
                      {val}%
                    </text>
                  </g>
                );
              })}

              {/* 折れ線 & エリア描画 */}
              {trendData.length > 1 && (
                (() => {
                  const points = trendData.map((d, i) => {
                    const x = 50 + (i / (trendData.length - 1)) * 530;
                    const y = 180 - ((Math.max(60, Math.min(100, d.survivalRate)) - 60) / 40) * 160;
                    return { x, y, data: d };
                  });

                  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                  const areaPath = `${linePath} L ${points[points.length - 1].x} 180 L ${points[0].x} 180 Z`;

                  return (
                    <>
                      <path d={areaPath} fill="url(#survivalGradient)" />
                      <path d={linePath} fill="none" stroke="#1677A6" strokeWidth="2.5" />
                      {points.map((p, i) => (
                        <g key={i} className="group cursor-pointer">
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="4"
                            fill="#FFFFFF"
                            stroke="#1677A6"
                            strokeWidth="2"
                            className="transition-transform group-hover:scale-150"
                          />
                          {/* X軸ラベル */}
                          <text
                            x={p.x}
                            y="196"
                            textAnchor="middle"
                            fontSize="9"
                            fill="#6B7280"
                          >
                            {p.data.date}
                          </text>
                        </g>
                      ))}
                    </>
                  );
                })()
              )}
            </svg>
          </div>
        </div>

        {/* 2. 発育段階の構成比 */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-200 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#12324A] flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#1677A6]" />
              発育段階の構成比
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              全水槽の幼生・稚ウニ発育状況
            </p>

            {/* バープログレス表示 */}
            <div className="space-y-3 mt-4">
              {stageStats.map((item, idx) => {
                const colors = ['bg-[#1677A6]', 'bg-indigo-600', 'bg-teal-600', 'bg-emerald-600'];
                return (
                  <div key={item.stage} className="text-xs">
                    <div className="flex justify-between font-medium text-gray-700 mb-1">
                      <span>{item.stage}</span>
                      <span className="font-bold text-[#12324A]">
                        {item.percent}% <span className="text-gray-400 font-normal">({item.count}個体)</span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${colors[idx % colors.length]} rounded-full transition-all duration-300`}
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-500 flex items-center justify-between">
            <span>着底移行順調度:</span>
            <span className="text-emerald-700 font-bold">順調 (計画比 +4.2%)</span>
          </div>
        </div>
      </div>

      {/* 3. 水槽別状況 & 確認待ち解析一覧 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 水槽別の確認済み個体数 & 状態 */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-200">
          <h3 className="text-sm font-bold text-[#12324A] flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-[#1677A6]" />
            水槽別の育成状態一覧
          </h3>
          <div className="space-y-2.5">
            {tankCounts.map((tank) => (
              <div
                key={tank.id}
                className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
                  tank.isWarning
                    ? 'bg-rose-50/70 border-rose-200'
                    : 'bg-[#F9FBFC] border-gray-200'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#12324A]">{tank.id}</span>
                    <span className="text-gray-600 truncate max-w-[120px]">{tank.name}</span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    サンプル内個体計: {tank.count}
                  </div>
                </div>

                <div className="text-right">
                  <div className={`font-bold text-sm ${tank.isWarning ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {tank.survivalRate}%
                  </div>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                    tank.isWarning ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {tank.isWarning ? '注意' : '正常'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 確認が必要な解析の一覧 */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl shadow-xs border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-[#12324A] flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                確認が必要な解析（直近）
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                AI判定信頼度低または生残率注意の解析記録
              </p>
            </div>
            {pendingCount > 0 && (
              <button
                onClick={onNavigateToPending}
                className="text-xs font-semibold text-[#1677A6] hover:underline flex items-center gap-1"
              >
                全て見る ({pendingCount}件) →
              </button>
            )}
          </div>

          {pendingRecords.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg text-xs text-gray-500 border border-dashed border-gray-200">
              <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
              現在、確認待ちの解析結果はありません。すべての判定が確定済みです。
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
                    <th className="py-2 px-3 font-semibold">解析ID</th>
                    <th className="py-2 px-2 font-semibold">水槽/ロット</th>
                    <th className="py-2 px-2 font-semibold">生残率</th>
                    <th className="py-2 px-2 font-semibold">AI信頼度</th>
                    <th className="py-2 px-3 font-semibold">確認が必要な理由</th>
                    <th className="py-2 px-2 font-semibold text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingRecords.slice(0, 4).map((rec) => (
                    <tr key={rec.id} className="hover:bg-amber-50/50 transition">
                      <td className="py-2.5 px-3 font-mono font-medium text-gray-800">
                        {rec.id}
                      </td>
                      <td className="py-2.5 px-2">
                        <span className="font-bold text-[#12324A]">{rec.tankId}</span>
                        <span className="text-gray-500 text-[11px] block">{rec.lotId}</span>
                      </td>
                      <td className="py-2.5 px-2">
                        <span className={`font-bold ${
                          rec.finalResult.survivalRate < settings.survivalRateWarningThreshold
                            ? 'text-rose-600'
                            : 'text-emerald-600'
                        }`}>
                          {rec.finalResult.survivalRate}%
                        </span>
                      </td>
                      <td className="py-2.5 px-2">
                        <span className={`font-bold ${
                          rec.initialAiResult.confidence < settings.aiConfidenceThreshold
                            ? 'text-amber-600'
                            : 'text-gray-700'
                        }`}>
                          {rec.initialAiResult.confidence}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-700 max-w-[200px] truncate" title={rec.reviewReason || ''}>
                        {rec.reviewReason || '目視再確認推奨'}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <button
                          onClick={() => onSelectRecordForReview(rec)}
                          className="bg-[#1677A6] hover:bg-[#125E84] text-white px-2.5 py-1 rounded text-xs font-medium transition"
                        >
                          確認・修正
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
