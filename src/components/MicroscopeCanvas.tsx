/**
 * 顕微鏡画像 ＆ AI検出オーバーレイ表示コンポーネント
 * 幼生・稚ウニの検出マーカー（緑：生存、赤：死亡、黄：判定不能）を対話的に表示・編集
 */

import React, { useState } from 'react';
import { DetectionItem, DetectionType } from '../types';
import { ZoomIn, ZoomOut, RotateCcw, Eye, PlusCircle, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';

interface MicroscopeCanvasProps {
  imageUrl: string;
  detections: DetectionItem[];
  interactive?: boolean;
  onDetectionsChange?: (updated: DetectionItem[]) => void;
  heightClass?: string;
  showLegend?: boolean;
}

export const MicroscopeCanvas: React.FC<MicroscopeCanvasProps> = ({
  imageUrl,
  detections,
  interactive = false,
  onDetectionsChange,
  heightClass = 'h-96 md:h-[480px]',
  showLegend = true
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [filterType, setFilterType] = useState<DetectionType | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAddMode, setIsAddMode] = useState<boolean>(false);
  const [addType, setAddType] = useState<DetectionType>('alive');

  const visibleDetections = detections.filter(
    (d) => filterType === 'all' || d.type === filterType
  );

  const handleZoomIn = () => setZoom((prev) => Math.min(2.5, prev + 0.25));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.75, prev - 0.25));
  const handleResetZoom = () => {
    setZoom(1);
    setSelectedId(null);
  };

  const handleMarkerClick = (e: React.MouseEvent, item: DetectionItem) => {
    e.stopPropagation();
    if (!interactive) return;
    
    setSelectedId(item.id);
    if (!onDetectionsChange) return;

    // クリックで 生存 -> 死亡 -> 判定不能 -> 生存 とサイクル切り替え
    const nextTypeMap: Record<DetectionType, DetectionType> = {
      alive: 'dead',
      dead: 'unknown',
      unknown: 'alive'
    };
    const updated = detections.map((d) => 
      d.id === item.id ? { ...d, type: nextTypeMap[d.type] } : d
    );
    onDetectionsChange(updated);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !isAddMode || !onDetectionsChange) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newItem: DetectionItem = {
      id: `manual-det-${Date.now()}`,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      radius: 16,
      type: addType,
      confidence: 100,
      sizeUm: 200
    };

    onDetectionsChange([...detections, newItem]);
  };

  const handleDeleteDetection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!interactive || !onDetectionsChange) return;
    onDetectionsChange(detections.filter(d => d.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <div className="flex flex-col w-full bg-[#12324A] rounded-xl overflow-hidden shadow-md border border-[#234E6F]">
      {/* ツールバー */}
      <div className="flex flex-wrap items-center justify-between px-3.5 py-2 bg-[#0E273C] border-b border-[#234E6F] text-xs text-white gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="font-semibold text-[#EAF6FA] flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-[#1677A6]" />
            検出表示:
          </span>
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-2 py-0.5 rounded transition ${
              filterType === 'all'
                ? 'bg-[#1677A6] text-white font-medium'
                : 'bg-[#1A3E59] text-gray-300 hover:bg-[#245070]'
            }`}
          >
            全表示 ({detections.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('alive')}
            className={`px-2 py-0.5 rounded flex items-center gap-1 transition ${
              filterType === 'alive'
                ? 'bg-emerald-600 text-white font-medium'
                : 'bg-[#1A3E59] text-emerald-300 hover:bg-[#245070]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            生存 ({detections.filter((d) => d.type === 'alive').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('dead')}
            className={`px-2 py-0.5 rounded flex items-center gap-1 transition ${
              filterType === 'dead'
                ? 'bg-rose-600 text-white font-medium'
                : 'bg-[#1A3E59] text-rose-300 hover:bg-[#245070]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            死亡 ({detections.filter((d) => d.type === 'dead').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('unknown')}
            className={`px-2 py-0.5 rounded flex items-center gap-1 transition ${
              filterType === 'unknown'
                ? 'bg-amber-600 text-white font-medium'
                : 'bg-[#1A3E59] text-amber-300 hover:bg-[#245070]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            不明 ({detections.filter((d) => d.type === 'unknown').length})
          </button>
        </div>

        {/* ズーム & 操作系 */}
        <div className="flex items-center gap-1.5 ml-auto">
          {interactive && (
            <button
              type="button"
              onClick={() => setIsAddMode(!isAddMode)}
              className={`px-2 py-0.5 rounded flex items-center gap-1 text-xs transition ${
                isAddMode
                  ? 'bg-amber-500 text-slate-900 font-bold'
                  : 'bg-[#1A3E59] text-gray-300 hover:bg-[#245070]'
              }`}
              title="クリックした位置に検出ポイントを手動追加"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              {isAddMode ? '追加中: クリックで配置' : '手動追加'}
            </button>
          )}

          {isAddMode && (
            <select
              value={addType}
              onChange={(e) => setAddType(e.target.value as DetectionType)}
              aria-label="手動追加する個体の状態選択"
              className="bg-[#12324A] text-white border border-[#234E6F] rounded px-1.5 py-0.5 text-xs"
            >
              <option value="alive">生存として追加</option>
              <option value="dead">死亡として追加</option>
              <option value="unknown">不明として追加</option>
            </select>
          )}

          <div className="flex items-center bg-[#1A3E59] rounded border border-[#234E6F] p-0.5">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 0.75}
              className="p-1 text-gray-300 hover:text-white disabled:opacity-40"
              title="縮小"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-[11px] font-mono text-gray-300">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 2.5}
              className="p-1 text-gray-300 hover:text-white disabled:opacity-40"
              title="拡大"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1 text-gray-300 hover:text-white ml-0.5 border-l border-[#234E6F]"
              title="リセット"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* キャンバス領域 */}
      <div 
        className={`relative w-full ${heightClass} bg-[#0A1622] flex items-center justify-center overflow-hidden select-none cursor-${isAddMode ? 'crosshair' : 'default'}`}
        onClick={handleCanvasClick}
      >
        <div
          className="relative transition-transform duration-150 ease-out origin-center"
          style={{
            transform: `scale(${zoom})`,
            width: '100%',
            height: '100%',
            maxWidth: '600px',
            maxHeight: '600px'
          }}
        >
          {/* 背景の顕微鏡画像 */}
          <img
            src={imageUrl}
            alt="顕微鏡撮影画像"
            className="w-full h-full object-contain pointer-events-none"
            referrerPolicy="no-referrer"
          />

          {/* AI検出オーバーレイポイント */}
          {visibleDetections.map((det) => {
            const isSelected = selectedId === det.id;
            let borderColor = 'border-emerald-400 bg-emerald-500/20 text-emerald-200';
            let dotColor = 'bg-emerald-400';
            let label = '生存';

            if (det.type === 'dead') {
              borderColor = 'border-rose-500 bg-rose-500/25 text-rose-200';
              dotColor = 'bg-rose-400';
              label = '死亡';
            } else if (det.type === 'unknown') {
              borderColor = 'border-amber-400 bg-amber-500/20 text-amber-200';
              dotColor = 'bg-amber-400';
              label = '不明';
            }

            return (
              <div
                key={det.id}
                onClick={(e) => handleMarkerClick(e, det)}
                className={`absolute group cursor-pointer transform -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-150 ${
                  isSelected ? 'ring-2 ring-white scale-125 z-30' : 'hover:scale-115 z-10'
                }`}
                style={{
                  left: `${det.x}%`,
                  top: `${det.y}%`,
                  width: `${Math.max(20, det.radius * 1.5)}px`,
                  height: `${Math.max(20, det.radius * 1.5)}px`
                }}
              >
                {/* 円形バウンディング境界 */}
                <div
                  className={`w-full h-full rounded-full border-2 border-dashed flex items-center justify-center ${borderColor} ${
                    isSelected ? 'border-solid shadow-lg' : ''
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${dotColor} shadow`} />
                </div>

                {/* ホバー時のツールチップ */}
                <div className="absolute left-1/2 bottom-full mb-1 -translate-x-1/2 hidden group-hover:flex flex-col items-center bg-[#0C1E2D]/95 text-white text-[10px] px-2 py-1 rounded shadow-xl border border-[#234E6F] whitespace-nowrap pointer-events-none z-40">
                  <div className="flex items-center gap-1 font-semibold">
                    <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                    <span>{label}</span>
                    <span className="text-gray-300">({det.confidence}%)</span>
                  </div>
                  {det.sizeUm && (
                    <span className="text-gray-400 text-[9px]">推定径: {det.sizeUm}μm</span>
                  )}
                  {interactive && (
                    <span className="text-sky-300 text-[8px] mt-0.5">クリックで状態切替</span>
                  )}
                </div>

                {/* 選択時の削除バツ印（インタラクティブ時） */}
                {interactive && isSelected && (
                  <button
                    type="button"
                    onClick={(e) => handleDeleteDetection(det.id, e)}
                    className="absolute -top-2 -right-2 w-4 h-4 bg-rose-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow hover:bg-rose-700 z-50"
                    title="この検出を削除"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 凡例 & 説明フッター */}
      {showLegend && (
        <div className="flex flex-wrap items-center justify-between px-3.5 py-2 bg-[#0E273C] border-t border-[#234E6F] text-xs text-gray-300">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>緑: 生存</span>
            </div>
            <div className="flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>赤: 死亡</span>
            </div>
            <div className="flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>黄: 判定不能</span>
            </div>
          </div>
          {interactive && (
            <div className="text-[11px] text-[#A6CBE0]">
              ※ マーカーをクリックすると生存/死亡/不明をワンタッチで修正できます
            </div>
          )}
        </div>
      )}
    </div>
  );
};
