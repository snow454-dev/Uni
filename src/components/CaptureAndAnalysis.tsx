/**
 * 2. 撮影・解析画面コンポーネント
 * 顕微鏡画像の登録、AI模擬解析、リアルタイム検出オーバーレイ、人による確認・修正ワークフロー
 */

import React, { useState, useEffect } from 'react';
import { 
  AnalysisMetadata, 
  AnalysisRecord, 
  AnalysisResult, 
  AppSettings, 
  DetectionItem, 
  GrowthStage, 
  LotInfo, 
  Magnification, 
  TankInfo 
} from '../types';
import { analyzeImage, SAMPLE_MICROSCOPE_IMAGES } from '../services/aiService';
import { MicroscopeCanvas } from './MicroscopeCanvas';
import { 
  Camera, 
  UploadCloud, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Save, 
  Clock, 
  Edit3, 
  FileText, 
  Image as ImageIcon,
  Check,
  AlertCircle
} from 'lucide-react';

interface CaptureAndAnalysisProps {
  tanks: TankInfo[];
  lots: LotInfo[];
  settings: AppSettings;
  onSaveRecord: (record: AnalysisRecord) => void;
  onNavigateToPending: () => void;
}

export const CaptureAndAnalysis: React.FC<CaptureAndAnalysisProps> = ({
  tanks,
  lots,
  settings,
  onSaveRecord,
  onNavigateToPending
}) => {
  // フォーム入力項目
  const [sampleDate, setSampleDate] = useState<string>('2026-08-18');
  const [tankId, setTankId] = useState<string>('T-01');
  const [lotId, setLotId] = useState<string>('LOT-202608-A');
  const [operator, setOperator] = useState<string>(settings.defaultOperator || '佐藤 健一');
  const [growthStage, setGrowthStage] = useState<GrowthStage>('浮遊幼生');
  const [magnification, setMagnification] = useState<Magnification>('100倍');
  const [sampleVolume, setSampleVolume] = useState<number>(settings.standardSampleVolume || 1.0);
  const [notes, setNotes] = useState<string>('');

  // 画像ファイル・プレビュー
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>(SAMPLE_MICROSCOPE_IMAGES[0].svgData);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // 解析状態
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<AnalysisResult | null>(null);
  const [initialAiResult, setInitialAiResult] = useState<AnalysisResult | null>(null);

  // 編集モード＆修正項目
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editAlive, setEditAlive] = useState<number>(0);
  const [editDead, setEditDead] = useState<number>(0);
  const [editUnknown, setEditUnknown] = useState<number>(0);
  const [editStage, setEditStage] = useState<GrowthStage>('浮遊幼生');
  const [editSettlementRate, setEditSettlementRate] = useState<number>(0);
  const [modificationReason, setModificationReason] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // 水槽選択時に対応するロットと発育段階を自動補完
  useEffect(() => {
    const matchedTank = tanks.find((t) => t.id === tankId);
    if (matchedTank && matchedTank.currentLotId) {
      setLotId(matchedTank.currentLotId);
      const matchedLot = lots.find((l) => l.lotId === matchedTank.currentLotId);
      if (matchedLot) {
        setGrowthStage(matchedLot.growthStage);
      }
    }
  }, [tankId, tanks, lots]);

  // ファイルドロップまたは選択時の処理
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('画像ファイル（JPG, PNG, JPEG）を選択してください。');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImagePreviewUrl(e.target.result as string);
        setAiResult(null);
        setInitialAiResult(null);
        setIsEditing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // サンプルプリセット画像の選択
  const handleSelectSamplePreset = (preset: typeof SAMPLE_MICROSCOPE_IMAGES[0]) => {
    setImagePreviewUrl(preset.svgData);
    setImageFile(null);
    setGrowthStage(preset.stage);
    setMagnification(preset.magnification as Magnification);
    setTankId(preset.tankId);
    setLotId(preset.lotId);
    setNotes(preset.description);
    setAiResult(null);
    setInitialAiResult(null);
    setIsEditing(false);
  };

  // AI解析の実行
  const handleRunAnalysis = async () => {
    // バリデーションチェック
    if (!sampleDate) {
      setValidationError('調査日を入力してください。');
      return;
    }
    if (!sampleVolume || sampleVolume <= 0) {
      setValidationError('採取量は0より大きい値を入力してください。');
      return;
    }
    if (!operator.trim()) {
      setValidationError('担当者名を入力してください。');
      return;
    }
    if (!imagePreviewUrl) {
      setValidationError('顕微鏡画像を登録してください。');
      return;
    }

    setValidationError(null);
    setIsAnalyzing(true);

    const metadata: AnalysisMetadata = {
      sampleDate,
      tankId,
      lotId,
      operator,
      growthStage,
      magnification,
      sampleVolume: Number(sampleVolume),
      notes
    };

    try {
      const result = await analyzeImage(imageFile || imagePreviewUrl, metadata);
      setAiResult(result);
      setInitialAiResult(JSON.parse(JSON.stringify(result)));
      
      // 修正フォームにも初期値をセット
      setEditAlive(result.aliveCount);
      setEditDead(result.deadCount);
      setEditUnknown(result.unknownCount);
      setEditStage(result.growthStage);
      setEditSettlementRate(result.settlementRate);
    } catch (err) {
      console.error(err);
      alert('解析中にエラーが発生しました。');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 検出マーカー変更時の自動同期（MicroscopeCanvasでの対話的変更）
  const handleDetectionsChange = (updatedDetections: DetectionItem[]) => {
    if (!aiResult) return;

    const aliveCount = updatedDetections.filter((d) => d.type === 'alive').length;
    const deadCount = updatedDetections.filter((d) => d.type === 'dead').length;
    const unknownCount = updatedDetections.filter((d) => d.type === 'unknown').length;
    const totalCount = aliveCount + deadCount + unknownCount;

    const effectiveTotal = aliveCount + deadCount;
    const survivalRate = effectiveTotal > 0 ? Math.round((aliveCount / effectiveTotal) * 1000) / 10 : 100;

    const updatedResult: AnalysisResult = {
      ...aiResult,
      totalCount,
      aliveCount,
      deadCount,
      unknownCount,
      survivalRate,
      detections: updatedDetections
    };

    setAiResult(updatedResult);
    setEditAlive(aliveCount);
    setEditDead(deadCount);
    setEditUnknown(unknownCount);
    setIsEditing(true);
  };

  // 手動入力値の変更ハンドラ
  const handleManualCountChange = (alive: number, dead: number, unknown: number) => {
    const cleanAlive = Math.max(0, Math.floor(alive || 0));
    const cleanDead = Math.max(0, Math.floor(dead || 0));
    const cleanUnknown = Math.max(0, Math.floor(unknown || 0));

    setEditAlive(cleanAlive);
    setEditDead(cleanDead);
    setEditUnknown(cleanUnknown);

    if (aiResult) {
      const effectiveTotal = cleanAlive + cleanDead;
      const survivalRate = effectiveTotal > 0 ? Math.round((cleanAlive / effectiveTotal) * 1000) / 10 : 100;
      setAiResult({
        ...aiResult,
        totalCount: cleanAlive + cleanDead + cleanUnknown,
        aliveCount: cleanAlive,
        deadCount: cleanDead,
        unknownCount: cleanUnknown,
        survivalRate
      });
    }
  };

  // 保存処理（確定 or 確認待ち）
  const handleSave = (saveStatus: 'confirmed' | 'pending') => {
    if (!aiResult || !initialAiResult) {
      setValidationError('解析結果がありません。「AI解析を実行」を行ってください。');
      return;
    }

    // 入力整合性チェック: 総数 ＝ 生存数 ＋ 死亡数 ＋ 判定不能数
    const calcTotal = editAlive + editDead + editUnknown;
    if (calcTotal <= 0) {
      setValidationError('個体数が0件です。0以上の整数を入力してください。');
      return;
    }

    const isModified = 
      editAlive !== initialAiResult.aliveCount ||
      editDead !== initialAiResult.deadCount ||
      editUnknown !== initialAiResult.unknownCount ||
      editStage !== initialAiResult.growthStage ||
      editSettlementRate !== initialAiResult.settlementRate;

    if (isModified && !modificationReason.trim() && saveStatus === 'confirmed') {
      setValidationError('AIの判定値を修正した場合は、「修正理由」の入力が必須です。');
      return;
    }

    const effectiveTotal = editAlive + editDead;
    const finalSurvivalRate = effectiveTotal > 0 ? Math.round((editAlive / effectiveTotal) * 1000) / 10 : 100;

    const finalResult: AnalysisResult = {
      totalCount: calcTotal,
      aliveCount: editAlive,
      deadCount: editDead,
      unknownCount: editUnknown,
      survivalRate: finalSurvivalRate,
      settlementRate: editSettlementRate,
      growthStage: editStage,
      confidence: initialAiResult.confidence,
      needsReview: saveStatus === 'pending',
      analysisTime: initialAiResult.analysisTime,
      detections: aiResult.detections
    };

    const newRecord: AnalysisRecord = {
      id: `REC-${sampleDate.replace(/-/g, '')}-${String(Math.floor(100 + Math.random() * 900))}`,
      sampleDate,
      tankId,
      lotId,
      operator,
      growthStage: editStage,
      magnification,
      sampleVolume: Number(sampleVolume),
      notes,
      imageUrl: imagePreviewUrl,
      initialAiResult,
      finalResult,
      isModified,
      modificationReason: isModified ? modificationReason : undefined,
      reviewer: operator,
      reviewedAt: saveStatus === 'confirmed' ? new Date().toLocaleString('ja-JP') : undefined,
      status: saveStatus,
      reviewReason: saveStatus === 'pending'
        ? (initialAiResult.confidence < settings.aiConfidenceThreshold
            ? `AI信頼度(${initialAiResult.confidence}%)が基準未満`
            : finalSurvivalRate < settings.survivalRateWarningThreshold
            ? `生残率(${finalSurvivalRate}%)が基準未満`
            : '担当者による保留')
        : undefined,
      createdAt: new Date().toISOString()
    };

    onSaveRecord(newRecord);
    setValidationError(null);
    setSaveSuccessMsg(
      saveStatus === 'confirmed'
        ? `解析レコード [${newRecord.id}] を確定保存しました。`
        : `解析レコード [${newRecord.id}] を確認待ちキューに保存しました。`
    );

    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  // 入力内容のリセット
  const handleResetForm = () => {
    if (window.confirm('入力内容と解析結果をリセットしますか？')) {
      setAiResult(null);
      setInitialAiResult(null);
      setIsEditing(false);
      setModificationReason('');
      setValidationError(null);
      setNotes('');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 画面見出し */}
      <div className="bg-white p-4 sm:p-5 rounded-xl shadow-xs border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#12324A] tracking-tight flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#1677A6]" />
            顕微鏡撮影・AI画像解析
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            幼生・稚ウニの顕微鏡画像を登録し、AIによる自動計数・生残率判定と人による目視確認を行います。
          </p>
        </div>

        {/* 試作用プリセット選択 */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-gray-600 flex items-center gap-1">
            <ImageIcon className="w-3.5 h-3.5 text-[#1677A6]" />
            サンプル画像:
          </span>
          {SAMPLE_MICROSCOPE_IMAGES.map((preset, idx) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectSamplePreset(preset)}
              className="px-2.5 py-1 text-xs font-medium bg-[#EAF6FA] text-[#1677A6] hover:bg-[#D4EDF7] rounded border border-[#BDE0EE] transition"
              title={preset.description}
            >
              サンプル{idx + 1} ({preset.stage})
            </button>
          ))}
        </div>
      </div>

      {/* 成功メッセージ */}
      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button
            onClick={() => setSaveSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* バリデーションエラー表示 */}
      {validationError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* 2カラム構成：左（入力フォーム ＆ 画像登録）、右（解析ビュー ＆ 結果判定） */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 左側：採取メタデータ入力 ＆ 画像アップロード (4/12) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-200">
            <h3 className="text-sm font-bold text-[#12324A] flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
              <FileText className="w-4 h-4 text-[#1677A6]" />
              サンプリング調査情報（必須項目）
            </h3>

            <div className="space-y-3.5 text-xs">
              {/* 調査日 */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  調査日 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={sampleDate}
                  onChange={(e) => setSampleDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#1677A6] focus:bg-white"
                />
              </div>

              {/* 水槽ID & ロットID */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    水槽ID <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={tankId}
                    onChange={(e) => setTankId(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#1677A6]"
                  >
                    {tanks.filter(t => t.enabled).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.id} - {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    ロットID <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={lotId}
                    onChange={(e) => setLotId(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#1677A6]"
                  >
                    {lots.map((l) => (
                      <option key={l.lotId} value={l.lotId}>
                        {l.lotId}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 担当者 */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  担当者 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  placeholder="例: 佐藤 健一"
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#1677A6]"
                />
              </div>

              {/* 発育段階 & 倍率 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    発育段階 <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={growthStage}
                    onChange={(e) => setGrowthStage(e.target.value as GrowthStage)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#1677A6]"
                  >
                    <option value="浮遊幼生">浮遊幼生</option>
                    <option value="変態期">変態期</option>
                    <option value="着底直後">着底直後</option>
                    <option value="稚ウニ">稚ウニ</option>
                    <option value="その他">その他</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    顕微鏡倍率 <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={magnification}
                    onChange={(e) => setMagnification(e.target.value as Magnification)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#1677A6]"
                  >
                    <option value="40倍">40倍 (稚ウニ・着底)</option>
                    <option value="100倍">100倍 (標準幼生期)</option>
                    <option value="200倍">200倍 (精細骨格)</option>
                    <option value="400倍">400倍</option>
                    <option value="その他">その他</option>
                  </select>
                </div>
              </div>

              {/* 採取量 (ml) */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  採取量 (ml) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={sampleVolume}
                    onChange={(e) => setSampleVolume(parseFloat(e.target.value) || 0)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#1677A6]"
                  />
                  <span className="text-xs text-gray-500 font-semibold whitespace-nowrap">
                    ml (標準 1.0ml)
                  </span>
                </div>
              </div>

              {/* 画像アップロード領域 (Drag & Drop) */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  顕微鏡画像ファイル <span className="text-rose-500">*</span>
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition ${
                    isDragOver
                      ? 'border-[#1677A6] bg-[#EAF6FA]'
                      : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <input
                    type="file"
                    id="microscope-file-input"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  <label htmlFor="microscope-file-input" className="cursor-pointer block">
                    <UploadCloud className="w-8 h-8 text-[#1677A6] mx-auto mb-1.5" />
                    <span className="font-semibold text-gray-700 text-xs block">
                      ドラッグ＆ドロップ または クリックしてファイル選択
                    </span>
                    <span className="text-[11px] text-gray-400 mt-0.5 block">
                      対応形式: JPG, JPEG, PNG
                    </span>
                  </label>
                </div>
              </div>

              {/* 備考 */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">備考・特記事項</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="水質変化や給餌状況、検鏡時の特記など"
                  rows={2}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#1677A6]"
                />
              </div>

              {/* AI解析ボタン */}
              <button
                type="button"
                onClick={handleRunAnalysis}
                disabled={isAnalyzing}
                className="w-full py-3 px-4 bg-[#1677A6] hover:bg-[#125E84] text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>AI解析中... (1.5秒)</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>AI解析を実行</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 右側：顕微鏡プレビュー ＆ AI検出結果 ＆ 修正操作 (7/12) */}
        <div className="lg:col-span-7 space-y-4">
          {/* 画像キャンバス */}
          <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-[#12324A] flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-[#1677A6]" />
                顕微鏡視野画像プレビュー
              </span>
              {aiResult && (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  AI検出完了: 計 {aiResult.totalCount} 個体
                </span>
              )}
            </div>

            {/* Microscope Canvas Overlay */}
            <MicroscopeCanvas
              imageUrl={imagePreviewUrl}
              detections={aiResult ? aiResult.detections : []}
              interactive={Boolean(aiResult)}
              onDetectionsChange={handleDetectionsChange}
              heightClass="h-80 sm:h-96"
            />
          </div>

          {/* 解析中の表示 */}
          {isAnalyzing && (
            <div className="bg-white p-8 rounded-xl shadow-xs border border-gray-200 text-center space-y-3">
              <div className="w-12 h-12 border-4 border-[#1677A6] border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="text-base font-bold text-[#12324A]">
                画像を解析しています。しばらくお待ちください。
              </div>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                顕微鏡画像内のプルテウス幼生・稚ウニ輪郭を抽出し、生存状態、死亡判定、発育段階および着底状況を高速推論しています...
              </p>
            </div>
          )}

          {/* AI解析結果 & 修正操作パネル */}
          {aiResult && !isAnalyzing && (
            <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-200 space-y-5">
              {/* ヘッダー部：判定ステータスと信頼度 */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div>
                  <h4 className="text-base font-bold text-[#12324A] flex items-center gap-2">
                    AI解析結果
                    <span className="text-xs font-normal text-gray-500">
                      (解析時間: {aiResult.analysisTime}秒)
                    </span>
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-600">AI判定信頼度:</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      aiResult.confidence >= settings.aiConfidenceThreshold
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-900 font-bold'
                    }`}>
                      {aiResult.confidence}%
                    </span>
                  </div>
                </div>

                {/* 判定アラートバッジ */}
                <div>
                  {aiResult.confidence < settings.aiConfidenceThreshold && (
                    <div className="bg-amber-500 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs">
                      <AlertTriangle className="w-4 h-4" />
                      人による確認が必要です (信頼度 &lt; {settings.aiConfidenceThreshold}%)
                    </div>
                  )}
                  {aiResult.survivalRate < settings.survivalRateWarningThreshold && (
                    <div className="bg-rose-50 text-rose-800 border border-rose-200 text-xs px-3 py-1 rounded-lg flex items-center gap-1.5 mt-1 font-semibold">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      注意: 生残率が基準値({settings.survivalRateWarningThreshold}%)未満です
                    </div>
                  )}
                </div>
              </div>

              {/* 主要メトリクスグリッド */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                {/* 総数 */}
                <div className="p-3 bg-[#F4F6F8] rounded-lg border border-gray-200">
                  <div className="text-[11px] text-gray-500 font-medium">総数</div>
                  <div className="text-2xl font-bold text-[#12324A] mt-0.5">
                    {editAlive + editDead + editUnknown}
                    <span className="text-xs font-normal text-gray-500 ml-1">個体</span>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    1ml中計数
                  </div>
                </div>

                {/* 生存数 */}
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="text-[11px] text-emerald-700 font-semibold">生存数</div>
                  <div className="text-2xl font-bold text-emerald-800 mt-0.5">
                    {editAlive}
                    <span className="text-xs font-normal text-emerald-600 ml-1">個体</span>
                  </div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">
                    活発遊泳・健常
                  </div>
                </div>

                {/* 死亡数 */}
                <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                  <div className="text-[11px] text-rose-700 font-semibold">死亡数</div>
                  <div className="text-2xl font-bold text-rose-800 mt-0.5">
                    {editDead}
                    <span className="text-xs font-normal text-rose-600 ml-1">個体</span>
                  </div>
                  <div className="text-[10px] text-rose-600 mt-0.5">
                    骨格崩壊・斃死
                  </div>
                </div>

                {/* 生残率 */}
                <div className="p-3 bg-sky-50 rounded-lg border border-sky-200">
                  <div className="text-[11px] text-sky-800 font-semibold">生残率</div>
                  <div className={`text-2xl font-bold mt-0.5 ${
                    ((editAlive + editDead) > 0 ? (editAlive / (editAlive + editDead)) * 100 : 100) < settings.survivalRateWarningThreshold
                      ? 'text-rose-600'
                      : 'text-[#1677A6]'
                  }`}>
                    {((editAlive + editDead) > 0 
                      ? Math.round((editAlive / (editAlive + editDead)) * 1000) / 10 
                      : 100).toFixed(1)}
                    <span className="text-xs font-normal ml-0.5">%</span>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    生/(生+死)
                  </div>
                </div>
              </div>

              {/* 詳細情報：判定不能数・着底率・発育段階 */}
              <div className="grid grid-cols-3 gap-3 text-xs bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div>
                  <span className="text-gray-500 block">判定不能数:</span>
                  <span className="font-bold text-amber-700 text-sm">{editUnknown} 個体</span>
                </div>
                <div>
                  <span className="text-gray-500 block">着底率:</span>
                  <span className="font-bold text-gray-800 text-sm">{editSettlementRate}%</span>
                </div>
                <div>
                  <span className="text-gray-500 block">判定発育段階:</span>
                  <span className="font-bold text-[#1677A6] text-sm">{editStage}</span>
                </div>
              </div>

              {/* 手動修正モード切り替え＆修正入力フォーム */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-[#1677A6]" />
                    職員による数値修正（必要な場合）
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    className={`text-xs font-semibold px-2.5 py-1 rounded transition ${
                      isEditing
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {isEditing ? '修正モードON' : '解析結果を修正'}
                  </button>
                </div>

                {isEditing && (
                  <div className="bg-[#EAF6FA] p-4 rounded-xl border border-[#BDE0EE] space-y-3 text-xs">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">生存数</label>
                        <input
                          type="number"
                          min="0"
                          value={editAlive}
                          onChange={(e) => handleManualCountChange(parseInt(e.target.value) || 0, editDead, editUnknown)}
                          className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 font-bold text-emerald-700"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">死亡数</label>
                        <input
                          type="number"
                          min="0"
                          value={editDead}
                          onChange={(e) => handleManualCountChange(editAlive, parseInt(e.target.value) || 0, editUnknown)}
                          className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 font-bold text-rose-700"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">判定不能数</label>
                        <input
                          type="number"
                          min="0"
                          value={editUnknown}
                          onChange={(e) => handleManualCountChange(editAlive, editDead, parseInt(e.target.value) || 0)}
                          className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 font-bold text-amber-700"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">発育段階の修正</label>
                        <select
                          value={editStage}
                          onChange={(e) => setEditStage(e.target.value as GrowthStage)}
                          className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-gray-900"
                        >
                          <option value="浮遊幼生">浮遊幼生</option>
                          <option value="変態期">変態期</option>
                          <option value="着底直後">着底直後</option>
                          <option value="稚ウニ">稚ウニ</option>
                          <option value="その他">その他</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">着底率 (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={editSettlementRate}
                          onChange={(e) => setEditSettlementRate(parseFloat(e.target.value) || 0)}
                          className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-gray-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">
                        修正理由 <span className="text-rose-500">* (数値を修正した場合は必須)</span>
                      </label>
                      <input
                        type="text"
                        value={modificationReason}
                        onChange={(e) => setModificationReason(e.target.value)}
                        placeholder="例: 重なり個体を目視確認し生存に2件修正、気泡誤検出を排除"
                        className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-gray-900"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* アクションボタングループ */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRunAnalysis}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    解析をやり直す
                  </button>
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="px-3 py-2 text-gray-500 hover:text-gray-700 rounded-lg text-xs transition"
                  >
                    入力内容をリセット
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {/* 確認待ちとして保存 */}
                  <button
                    type="button"
                    onClick={() => handleSave('pending')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs shadow-xs transition"
                  >
                    <Clock className="w-4 h-4" />
                    確認待ちとして保存
                  </button>

                  {/* 確認して保存 (確定) */}
                  <button
                    type="button"
                    onClick={() => handleSave('confirmed')}
                    className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-sm transition"
                  >
                    <Check className="w-4 h-4" />
                    確認して保存 (確定)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
