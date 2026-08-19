/**
 * 帳票・CSVエクスポート及び印刷サービス
 * 日本語文字化け防止 (UTF-8 BOM付与) と A4印刷制御
 */

import { AnalysisRecord } from '../types';

/**
 * 解析データをCSV形式でダウンロード
 * Excelで文字化けしないよう UTF-8 BOM (\uFEFF) を先頭に付与します
 */
export function exportRecordsToCSV(records: AnalysisRecord[], filename = 'ウニ種苗AI生産管理_解析データ'): void {
  const headers = [
    '解析ID',
    '調査日',
    '水槽ID',
    'ロットID',
    '担当者',
    '発育段階',
    '顕微鏡倍率',
    '採取量(ml)',
    'AI_総数',
    'AI_生存数',
    'AI_死亡数',
    'AI_判定不能数',
    'AI_生残率(%)',
    'AI_着底率(%)',
    'AI_信頼度(%)',
    '確定_総数',
    '確定_生存数',
    '確定_死亡数',
    '確定_判定不能数',
    '確定_生残率(%)',
    '確定_着底率(%)',
    '修正有無',
    '修正理由',
    '確認者',
    '確認日時',
    'ステータス',
    '備考'
  ];

  const rows = records.map((r) => [
    r.id,
    r.sampleDate,
    r.tankId,
    r.lotId,
    `"${(r.operator || '').replace(/"/g, '""')}"`,
    r.growthStage,
    r.magnification,
    r.sampleVolume,
    r.initialAiResult.totalCount,
    r.initialAiResult.aliveCount,
    r.initialAiResult.deadCount,
    r.initialAiResult.unknownCount,
    r.initialAiResult.survivalRate,
    r.initialAiResult.settlementRate,
    r.initialAiResult.confidence,
    r.finalResult.totalCount,
    r.finalResult.aliveCount,
    r.finalResult.deadCount,
    r.finalResult.unknownCount,
    r.finalResult.survivalRate,
    r.finalResult.settlementRate,
    r.isModified ? '修正あり' : '修正なし',
    `"${(r.modificationReason || '').replace(/"/g, '""')}"`,
    `"${(r.reviewer || '').replace(/"/g, '""')}"`,
    r.reviewedAt || '',
    r.status === 'confirmed' ? '確認済み' : r.status === 'pending' ? '確認待ち' : '要対応',
    `"${(r.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [
    headers.join(','),
    ...rows.map((row) => row.join(','))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${today}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * A4印刷を実行
 */
export function triggerPrintReport(): void {
  window.print();
}
