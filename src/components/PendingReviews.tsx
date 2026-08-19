/**
 * 3. 確認待ち画面コンポーネント
 * AI信頼度低下や生残率注意フラグが付いた未確定解析の一覧・詳細目視判定・一括/個別確定
 */

import React, { useState } from 'react';
import { AnalysisRecord, AppSettings, DetectionItem } from '../types';
import { MicroscopeCanvas } from './MicroscopeCanvas';
import { 
  Clock, 
  AlertTriangle, 
  AlertCircle, 
  Check, 
  Eye, 
  X, 
  Filter, 
  CheckCheck, 
  Edit3,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

interface PendingReviewsProps {
  records: AnalysisRecord[];
  settings: AppSettings;
  onUpdateRecord: (updated: AnalysisRecord) => void;
  onConfirmAllPending?: () => void;
}

export const PendingReviews: React.FC<PendingReviewsProps> = ({
  records,
  settings,
  onUpdateRecord,
  onConfirmAllPending
}) => {
  const [filterTank, setFilterTank] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<AnalysisRecord | null>(null);

  // 編集用ローカルステート（モーダル内）
  const [modalAlive, setModalAlive] = useState<number>(0);
  const [modalDead, setModalDead] = useState<number>(0);
  const [modalUnknown, setModalUnknown] = useState<number>(0);
  const [modalReason, setModalReason] = useState<string>('');
  const [modalNotes, setModalNotes] = useState<string>('');
  const [modalDetections, setModalDetections] = useState<DetectionItem[]>([]);

  // 確認待ちレコードのみ抽出
  const pendingRecords = records.filter((r) => r.status === 'pending');

  const filteredPending = pendingRecords.filter((r) => {
    if (filterTank !== 'all' && r.tankId !== filterTank) return false;
    return true;
  });

  const openReviewModal = (record: AnalysisRecord) => {
    setSelectedRecord(record);
    setModalAlive(record.finalResult.aliveCount);
    setModalDead(record.finalResult.deadCount);
    setModalUnknown(record.finalResult.unknownCount);
    setModalReason(record.modificationReason || '');
    setModalNotes(record.notes || '');
    setModalDetections(record.finalResult.detections || []);
  };

  const closeReviewModal = () => {
    setSelectedRecord(null);
  };

  const handleDetectionsChangeInModal = (updatedDetections: DetectionItem[]) => {
    const alive = updatedDetections.filter((d) => d.type === 'alive').length;
    const dead = updatedDetections.filter((d) => d.type === 'dead').length;
    const unknown = updatedDetections.filter((d) => d.type === 'unknown').length;
    
    setModalDetections(updatedDetections);
    setModalAlive(alive);
    setModalDead(dead);
    setModalUnknown(unknown);
  };

  const handleConfirmRecord = () => {
    if (!selectedRecord) return;

    const total = modalAlive + modalDead + modalUnknown;
    const effectiveTotal = modalAlive + modalDead;
    const survivalRate = effectiveTotal > 0 ? Math.round((modalAlive / effectiveTotal) * 1000) / 10 : 100;

    const isModified = 
      modalAlive !== selectedRecord.initialAiResult.aliveCount ||
      modalDead !== selectedRecord.initialAiResult.deadCount ||
      modalUnknown !== selectedRecord.initialAiResult.unknownCount;

    const updated: AnalysisRecord = {
      ...selectedRecord,
      finalResult: {
        ...selectedRecord.finalResult,
        totalCount: total,
        aliveCount: modalAlive,
        deadCount: modalDead,
        unknownCount: modalUnknown,
        survivalRate,
        detections: modalDetections
      },
      isModified: isModified || selectedRecord.isModified,
      modificationReason: modalReason || selectedRecord.modificationReason,
      notes: modalNotes,
      reviewer: settings.defaultOperator || '担当職員',
      reviewedAt: new Date().toLocaleString('ja-JP'),
      status: 'confirmed'
    };

    onUpdateRecord(updated);
    closeReviewModal();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 画面見出し */}
      <div className="bg-white p-4 sm:p-5 rounded-xl shadow-xs border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#12324A] tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            確認待ち一覧（目視判定キュー）
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            AI信頼度が基準値({settings.aiConfidenceThreshold}%)未満、または生残率が注意基準({settings.survivalRateWarningThreshold}%)未満の解析結果を目視確認・修正します。
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            未確認: {pendingRecords.length} 件
          </span>
        </div>
      </div>

      {/* フィルターバー */}
      <div className="bg-white p-3.5 rounded-xl shadow-xs border border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-gray-700 font-semibold">
          <Filter className="w-4 h-4 text-[#1677A6]" />
          <span>水槽絞り込み:</span>
        </div>
        <select
          value={filterTank}
          onChange={(e) => setFilterTank(e.target.value)}
          className="bg-gray-50 border border-gray-300 text-gray-800 rounded-md px-3 py-1.5 text-xs focus:ring-1 focus:ring-[#1677A6]"
        >
          <option value="all">すべての水槽 ({pendingRecords.length}件)</option>
          <option value="T-01">T-01</option>
          <option value="T-02">T-02</option>
          <option value="T-03">T-03</option>
          <option value="T-04">T-04</option>
          <option value="T-05">T-05</option>
        </select>
      </div>

      {/* 確認待ちテーブル */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
        {filteredPending.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <CheckCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-gray-800">
              確認待ちのデータはありません
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              すべてのAI解析結果が確認・確定されています。
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#12324A] text-white border-b border-[#234E6F]">
                  <th className="py-3 px-4 font-semibold">解析ID</th>
                  <th className="py-3 px-3 font-semibold">調査日</th>
                  <th className="py-3 px-3 font-semibold">水槽ID / ロットID</th>
                  <th className="py-3 px-3 font-semibold text-center">総数</th>
                  <th className="py-3 px-3 font-semibold text-center">生残率</th>
                  <th className="py-3 px-3 font-semibold text-center">AI信頼度</th>
                  <th className="py-3 px-4 font-semibold">確認が必要な理由</th>
                  <th className="py-3 px-3 font-semibold text-center">状態</th>
                  <th className="py-3 px-4 font-semibold text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPending.map((rec) => {
                  const isLowConfidence = rec.initialAiResult.confidence < settings.aiConfidenceThreshold;
                  const isLowSurvival = rec.finalResult.survivalRate < settings.survivalRateWarningThreshold;

                  return (
                    <tr
                      key={rec.id}
                      className={`hover:bg-amber-50/60 transition ${
                        isLowConfidence ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      {/* 解析ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[#12324A]">
                        {rec.id}
                      </td>

                      {/* 調査日 */}
                      <td className="py-3.5 px-3 text-gray-600">
                        {rec.sampleDate}
                      </td>

                      {/* 水槽 / ロット */}
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-[#12324A] bg-gray-100 px-1.5 py-0.5 rounded border border-gray-300 mr-1.5">
                          {rec.tankId}
                        </span>
                        <span className="text-gray-600 font-mono text-[11px]">
                          {rec.lotId}
                        </span>
                      </td>

                      {/* 総数 */}
                      <td className="py-3.5 px-3 text-center font-bold text-gray-800">
                        {rec.finalResult.totalCount}
                        <span className="text-[10px] text-gray-400 font-normal ml-0.5">個体</span>
                      </td>

                      {/* 生残率 */}
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`font-bold text-xs px-2 py-0.5 rounded ${
                            isLowSurvival
                              ? 'bg-rose-100 text-rose-800 font-extrabold border border-rose-200'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {rec.finalResult.survivalRate}%
                        </span>
                      </td>

                      {/* AI信頼度 (80%未満強調) */}
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`font-bold text-xs px-2 py-0.5 rounded inline-flex items-center gap-1 ${
                            isLowConfidence
                              ? 'bg-amber-500 text-slate-950 font-extrabold shadow-2xs'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {isLowConfidence && <AlertTriangle className="w-3 h-3 text-slate-950" />}
                          {rec.initialAiResult.confidence}%
                        </span>
                      </td>

                      {/* 理由 */}
                      <td className="py-3.5 px-4 text-gray-700">
                        <div className="flex items-center gap-1.5">
                          {isLowConfidence && (
                            <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                          )}
                          <span className="font-medium leading-relaxed">
                            {rec.reviewReason || '担当者保留・再検鏡推奨'}
                          </span>
                        </div>
                      </td>

                      {/* 状態 */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded-full text-[10px]">
                          確認待ち
                        </span>
                      </td>

                      {/* 操作 */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openReviewModal(rec)}
                          className="bg-[#1677A6] hover:bg-[#125E84] text-white px-3 py-1.5 rounded-lg font-semibold text-xs transition shadow-2xs flex items-center gap-1 ml-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          詳細・修正
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 詳細・目視判定モーダル */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-200">
            {/* モーダルヘッダー */}
            <div className="flex items-center justify-between p-4 sm:p-5 bg-[#12324A] text-white sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <span className="bg-[#1677A6] px-2 py-0.5 rounded text-xs font-mono font-bold">
                  {selectedRecord.id}
                </span>
                <h3 className="text-base font-bold">
                  解析結果の目視確認・修正
                </h3>
              </div>
              <button
                onClick={closeReviewModal}
                className="p-1 rounded-lg text-gray-300 hover:text-white hover:bg-[#1A3E59]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {/* 警戒フラグ通知 */}
              {selectedRecord.reviewReason && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <div>
                    <span className="font-bold">確認要フラグ:</span> {selectedRecord.reviewReason}
                  </div>
                </div>
              )}

              {/* 顕微鏡ビュー & 検出対話編集 */}
              <div>
                <div className="text-xs font-bold text-gray-700 mb-2 flex items-center justify-between">
                  <span>顕微鏡画像およびAI検出プロット（マーカーをクリックで状態変更可）</span>
                  <span className="text-gray-400 font-normal">倍率: {selectedRecord.magnification}</span>
                </div>
                <MicroscopeCanvas
                  imageUrl={selectedRecord.imageUrl}
                  detections={modalDetections}
                  interactive={true}
                  onDetectionsChange={handleDetectionsChangeInModal}
                  heightClass="h-72 sm:h-96"
                />
              </div>

              {/* AI判定初期値 vs 人による修正値 の比較グリッド */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* AI初期値 */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2.5">
                  <div className="font-bold text-gray-700 border-b border-gray-200 pb-1.5 flex items-center justify-between">
                    <span>AIによる初期判定値</span>
                    <span className="text-gray-500 text-[11px]">信頼度: {selectedRecord.initialAiResult.confidence}%</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center pt-1">
                    <div>
                      <span className="text-gray-500 block text-[10px]">総数</span>
                      <span className="font-bold text-sm text-gray-800">{selectedRecord.initialAiResult.totalCount}</span>
                    </div>
                    <div>
                      <span className="text-emerald-700 block text-[10px]">生存</span>
                      <span className="font-bold text-sm text-emerald-800">{selectedRecord.initialAiResult.aliveCount}</span>
                    </div>
                    <div>
                      <span className="text-rose-700 block text-[10px]">死亡</span>
                      <span className="font-bold text-sm text-rose-800">{selectedRecord.initialAiResult.deadCount}</span>
                    </div>
                    <div>
                      <span className="text-amber-700 block text-[10px]">不明</span>
                      <span className="font-bold text-sm text-amber-800">{selectedRecord.initialAiResult.unknownCount}</span>
                    </div>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-gray-200 text-gray-600">
                    <span>生残率: <strong className="text-[#1677A6]">{selectedRecord.initialAiResult.survivalRate}%</strong></span>
                    <span>発育: <strong>{selectedRecord.initialAiResult.growthStage}</strong></span>
                  </div>
                </div>

                {/* 人が修正する最終値 */}
                <div className="p-4 bg-[#EAF6FA] rounded-xl border border-[#BDE0EE] space-y-2.5">
                  <div className="font-bold text-[#12324A] border-b border-[#BDE0EE] pb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Edit3 className="w-3.5 h-3.5 text-[#1677A6]" />
                      確定値（職員修正可能）
                    </span>
                    <span className="text-[#1677A6] font-semibold text-[11px]">
                      現在生残率: {((modalAlive + modalDead) > 0 ? Math.round((modalAlive / (modalAlive + modalDead)) * 1000) / 10 : 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-emerald-800 font-semibold mb-0.5">生存数</label>
                      <input
                        type="number"
                        min="0"
                        value={modalAlive}
                        onChange={(e) => setModalAlive(parseInt(e.target.value) || 0)}
                        className="w-full bg-white border border-gray-300 rounded px-2 py-1 font-bold text-emerald-800"
                      />
                    </div>
                    <div>
                      <label className="block text-rose-800 font-semibold mb-0.5">死亡数</label>
                      <input
                        type="number"
                        min="0"
                        value={modalDead}
                        onChange={(e) => setModalDead(parseInt(e.target.value) || 0)}
                        className="w-full bg-white border border-gray-300 rounded px-2 py-1 font-bold text-rose-800"
                      />
                    </div>
                    <div>
                      <label className="block text-amber-800 font-semibold mb-0.5">不明数</label>
                      <input
                        type="number"
                        min="0"
                        value={modalUnknown}
                        onChange={(e) => setModalUnknown(parseInt(e.target.value) || 0)}
                        className="w-full bg-white border border-gray-300 rounded px-2 py-1 font-bold text-amber-800"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-0.5">修正理由</label>
                    <input
                      type="text"
                      value={modalReason}
                      onChange={(e) => setModalReason(e.target.value)}
                      placeholder="例: 目視確認により気泡を排除、アーム損傷個体を死亡へ修正"
                      className="w-full bg-white border border-gray-300 rounded px-2.5 py-1 text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* 備考編集 */}
              <div className="text-xs">
                <label className="block font-semibold text-gray-700 mb-1">備考</label>
                <input
                  type="text"
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            {/* モーダルフッター */}
            <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <button
                type="button"
                onClick={closeReviewModal}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 transition"
              >
                キャンセル
              </button>

              <button
                type="button"
                onClick={handleConfirmRecord}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                目視確認を完了し、確定保存する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
