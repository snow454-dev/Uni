/**
 * ローカルストレージ永続化サービス
 * 入力・修正データ、水槽・ロット情報、設定をブラウザのlocalStorageに保存・管理
 */

import { AnalysisRecord, AppSettings, LotInfo, TankInfo } from '../types';
import { SAMPLE_MICROSCOPE_IMAGES } from './aiService';

const STORAGE_KEYS = {
  RECORDS: 'ezouni_production_records_v1',
  TANKS: 'ezouni_production_tanks_v1',
  LOTS: 'ezouni_production_lots_v1',
  SETTINGS: 'ezouni_production_settings_v1',
  INITIALIZED: 'ezouni_production_initialized_v1'
};

export const DEFAULT_SETTINGS: AppSettings = {
  survivalRateWarningThreshold: 85,
  aiConfidenceThreshold: 80,
  standardSampleVolume: 1.0,
  facilityName: '根室市ウニ種苗生産センター',
  defaultOperator: '試験運用ユーザー',
  alertStaleDaysThreshold: 3,
  tanks: [
    {
      id: 'T-01',
      name: '第1育苗水槽（円形10t）',
      status: 'active',
      currentLotId: 'LOT-202608-A',
      startDate: '2026-08-01',
      latestSurvivalRate: 94.2,
      latestSampleDate: '2026-08-18',
      pendingCount: 0,
      capacityLitres: 10000,
      waterTempCelsius: 16.4,
      salinityPsu: 33.2,
      notes: '通気・流水安定。珪藻給餌順調。',
      enabled: true
    },
    {
      id: 'T-02',
      name: '第2育苗水槽（円形10t）',
      status: 'active',
      currentLotId: 'LOT-202608-B',
      startDate: '2026-08-05',
      latestSurvivalRate: 91.5,
      latestSampleDate: '2026-08-18',
      pendingCount: 1,
      capacityLitres: 10000,
      waterTempCelsius: 16.8,
      salinityPsu: 33.0,
      notes: '成体原基形成中。採苗波板投入準備。',
      enabled: true
    },
    {
      id: 'T-03',
      name: '第3採苗水槽（角形8t）',
      status: 'active',
      currentLotId: 'LOT-202607-C',
      startDate: '2026-07-20',
      latestSurvivalRate: 88.0,
      latestSampleDate: '2026-08-17',
      pendingCount: 0,
      capacityLitres: 8000,
      waterTempCelsius: 17.1,
      salinityPsu: 33.1,
      notes: '波板付着初期。底面流水速度を微調整。',
      enabled: true
    },
    {
      id: 'T-04',
      name: '第4採苗水槽（角形8t）',
      status: 'active',
      currentLotId: 'LOT-202607-D',
      startDate: '2026-07-15',
      latestSurvivalRate: 78.4,
      latestSampleDate: '2026-08-18',
      pendingCount: 1,
      capacityLitres: 8000,
      waterTempCelsius: 18.5,
      salinityPsu: 32.8,
      notes: '【注意】水温高め（18.5℃）、冷却水流量増加対応中。',
      enabled: true
    },
    {
      id: 'T-05',
      name: '第5予備水槽（円形12t）',
      status: 'active',
      currentLotId: 'LOT-202608-E',
      startDate: '2026-08-10',
      latestSurvivalRate: 96.0,
      latestSampleDate: '2026-08-14',
      pendingCount: 0,
      capacityLitres: 12000,
      waterTempCelsius: 16.2,
      salinityPsu: 33.4,
      notes: '前回採取より4日経過。本日サンプリング予定。',
      enabled: true
    }
  ]
};

export const DEFAULT_LOTS: LotInfo[] = [
  {
    lotId: 'LOT-202608-A',
    fertilizationDate: '2026-08-01',
    tankId: 'T-01',
    initialCount: 5000000,
    currentEstimatedCount: 4710000,
    latestSurvivalRate: 94.2,
    growthStage: '浮遊幼生',
    settlementRate: 0,
    operator: '佐藤 健一',
    notes: 'エゾバフンウニ人工受精群。浮遊幼生の遊泳活発。珪藻（キートセロス）給餌中。',
    status: 'culturing'
  },
  {
    lotId: 'LOT-202608-B',
    fertilizationDate: '2026-08-05',
    tankId: 'T-02',
    initialCount: 4500000,
    currentEstimatedCount: 4117500,
    latestSurvivalRate: 91.5,
    growthStage: '変態期',
    settlementRate: 25.0,
    operator: '高橋 優花',
    notes: '8腕プルテウス幼生期。成体原基の発達が順調。採苗準備開始。',
    status: 'culturing'
  },
  {
    lotId: 'LOT-202607-C',
    fertilizationDate: '2026-07-20',
    tankId: 'T-03',
    initialCount: 4000000,
    currentEstimatedCount: 3520000,
    latestSurvivalRate: 88.0,
    growthStage: '着底直後',
    settlementRate: 74.5,
    operator: '佐藤 健一',
    notes: '波板採苗器への付着順調。微細藻類コーティング波板への移行完了。',
    status: 'culturing'
  },
  {
    lotId: 'LOT-202607-D',
    fertilizationDate: '2026-07-15',
    tankId: 'T-04',
    initialCount: 3800000,
    currentEstimatedCount: 2979200,
    latestSurvivalRate: 78.4,
    growthStage: '稚ウニ',
    settlementRate: 92.0,
    operator: '鈴木 雅之',
    notes: '換水率引き上げ実施。水温18.5℃と高めのため冷却循環を強化中。',
    status: 'culturing'
  },
  {
    lotId: 'LOT-202608-E',
    fertilizationDate: '2026-08-10',
    tankId: 'T-05',
    initialCount: 5200000,
    currentEstimatedCount: 4992000,
    latestSurvivalRate: 96.0,
    growthStage: '浮遊幼生',
    settlementRate: 0,
    operator: '高橋 優花',
    notes: '初期発育極めて良好。4腕期プルテウス。',
    status: 'culturing'
  }
];

export function generateInitialSampleRecords(): AnalysisRecord[] {
  const records: AnalysisRecord[] = [
    // --- 本日の解析記録 (2026-08-18) ---
    {
      id: 'REC-20260818-001',
      sampleDate: '2026-08-18',
      tankId: 'T-01',
      lotId: 'LOT-202608-A',
      operator: '佐藤 健一',
      growthStage: '浮遊幼生',
      magnification: '100倍',
      sampleVolume: 1.0,
      notes: '朝サンプリング。4腕プルテウス幼生。アーム伸長良好。',
      imageUrl: SAMPLE_MICROSCOPE_IMAGES[0].svgData,
      initialAiResult: {
        totalCount: 48,
        aliveCount: 45,
        deadCount: 2,
        unknownCount: 1,
        survivalRate: 95.7,
        settlementRate: 0,
        growthStage: '浮遊幼生',
        confidence: 94.2,
        needsReview: false,
        analysisTime: 1.6,
        detections: []
      },
      finalResult: {
        totalCount: 48,
        aliveCount: 45,
        deadCount: 2,
        unknownCount: 1,
        survivalRate: 95.7,
        settlementRate: 0,
        growthStage: '浮遊幼生',
        confidence: 94.2,
        needsReview: false,
        analysisTime: 1.6,
        detections: []
      },
      isModified: false,
      reviewer: '佐藤 健一',
      reviewedAt: '2026-08-18 09:15',
      status: 'confirmed',
      createdAt: '2026-08-18T09:12:00.000Z'
    },
    {
      id: 'REC-20260818-002',
      sampleDate: '2026-08-18',
      tankId: 'T-01',
      lotId: 'LOT-202608-A',
      operator: '佐藤 健一',
      growthStage: '浮遊幼生',
      magnification: '100倍',
      sampleVolume: 1.0,
      notes: '表層部サンプリング。遊泳個体均一。',
      imageUrl: SAMPLE_MICROSCOPE_IMAGES[0].svgData,
      initialAiResult: {
        totalCount: 52,
        aliveCount: 48,
        deadCount: 3,
        unknownCount: 1,
        survivalRate: 94.1,
        settlementRate: 0,
        growthStage: '浮遊幼生',
        confidence: 91.8,
        needsReview: false,
        analysisTime: 1.8,
        detections: []
      },
      finalResult: {
        totalCount: 52,
        aliveCount: 48,
        deadCount: 3,
        unknownCount: 1,
        survivalRate: 94.1,
        settlementRate: 0,
        growthStage: '浮遊幼生',
        confidence: 91.8,
        needsReview: false,
        analysisTime: 1.8,
        detections: []
      },
      isModified: false,
      reviewer: '佐藤 健一',
      reviewedAt: '2026-08-18 09:40',
      status: 'confirmed',
      createdAt: '2026-08-18T09:35:00.000Z'
    },
    {
      id: 'REC-20260818-003',
      sampleDate: '2026-08-18',
      tankId: 'T-02',
      lotId: 'LOT-202608-B',
      operator: '高橋 優花',
      growthStage: '変態期',
      magnification: '100倍',
      sampleVolume: 1.0,
      notes: '成体原基の発達が顕著。一部個体が重なっておりAI判定不能数がやや多め。',
      imageUrl: SAMPLE_MICROSCOPE_IMAGES[1].svgData,
      initialAiResult: {
        totalCount: 42,
        aliveCount: 35,
        deadCount: 3,
        unknownCount: 4,
        survivalRate: 92.1,
        settlementRate: 25.0,
        growthStage: '変態期',
        confidence: 76.5, // < 80% で確認待ちフラグ
        needsReview: true,
        analysisTime: 1.9,
        detections: []
      },
      finalResult: {
        totalCount: 42,
        aliveCount: 35,
        deadCount: 3,
        unknownCount: 4,
        survivalRate: 92.1,
        settlementRate: 25.0,
        growthStage: '変態期',
        confidence: 76.5,
        needsReview: true,
        analysisTime: 1.9,
        detections: []
      },
      isModified: false,
      status: 'pending',
      reviewReason: 'AI判定信頼度が基準値(80%)未満 (76.5% - 幼生の重なり部)',
      createdAt: '2026-08-18T10:15:00.000Z'
    },
    {
      id: 'REC-20260818-004',
      sampleDate: '2026-08-18',
      tankId: 'T-02',
      lotId: 'LOT-202608-B',
      operator: '高橋 優花',
      growthStage: '変態期',
      magnification: '100倍',
      sampleVolume: 1.0,
      notes: '中層サンプリング。AI判定結果を確認・死亡個体を1件修正済み。',
      imageUrl: SAMPLE_MICROSCOPE_IMAGES[1].svgData,
      initialAiResult: {
        totalCount: 44,
        aliveCount: 39,
        deadCount: 4,
        unknownCount: 1,
        survivalRate: 90.7,
        settlementRate: 28.0,
        growthStage: '変態期',
        confidence: 88.4,
        needsReview: false,
        analysisTime: 1.7,
        detections: []
      },
      finalResult: {
        totalCount: 44,
        aliveCount: 40,
        deadCount: 3,
        unknownCount: 1,
        survivalRate: 93.0,
        settlementRate: 28.0,
        growthStage: '変態期',
        confidence: 88.4,
        needsReview: false,
        analysisTime: 1.7,
        detections: []
      },
      isModified: true,
      modificationReason: 'AIが気泡付近の幼生を死亡判定していたため生存に修正',
      reviewer: '高橋 優花',
      reviewedAt: '2026-08-18 11:05',
      status: 'confirmed',
      createdAt: '2026-08-18T10:50:00.000Z'
    },
    {
      id: 'REC-20260818-005',
      sampleDate: '2026-08-18',
      tankId: 'T-04',
      lotId: 'LOT-202607-D',
      operator: '鈴木 雅之',
      growthStage: '稚ウニ',
      magnification: '40倍',
      sampleVolume: 1.0,
      notes: '水温上昇(18.5℃)に伴う生残率低下がみられる。確認要。',
      imageUrl: SAMPLE_MICROSCOPE_IMAGES[3].svgData,
      initialAiResult: {
        totalCount: 34,
        aliveCount: 25,
        deadCount: 7,
        unknownCount: 2,
        survivalRate: 78.1, // < 85% 注意基準値下回り
        settlementRate: 91.5,
        growthStage: '稚ウニ',
        confidence: 84.0,
        needsReview: true,
        analysisTime: 1.9,
        detections: []
      },
      finalResult: {
        totalCount: 34,
        aliveCount: 25,
        deadCount: 7,
        unknownCount: 2,
        survivalRate: 78.1,
        settlementRate: 91.5,
        growthStage: '稚ウニ',
        confidence: 84.0,
        needsReview: true,
        analysisTime: 1.9,
        detections: []
      },
      isModified: false,
      status: 'pending',
      reviewReason: '生残率が注意基準値(85%)未満 (78.1% - T-04水温管理警戒)',
      createdAt: '2026-08-18T11:45:00.000Z'
    },
    {
      id: 'REC-20260818-006',
      sampleDate: '2026-08-18',
      tankId: 'T-04',
      lotId: 'LOT-202607-D',
      operator: '鈴木 雅之',
      growthStage: '稚ウニ',
      magnification: '40倍',
      sampleVolume: 1.0,
      notes: '冷却水注水後の再検査。目視確認完了。',
      imageUrl: SAMPLE_MICROSCOPE_IMAGES[3].svgData,
      initialAiResult: {
        totalCount: 33,
        aliveCount: 26,
        deadCount: 6,
        unknownCount: 1,
        survivalRate: 81.3,
        settlementRate: 93.0,
        growthStage: '稚ウニ',
        confidence: 87.2,
        needsReview: true,
        analysisTime: 1.8,
        detections: []
      },
      finalResult: {
        totalCount: 33,
        aliveCount: 26,
        deadCount: 6,
        unknownCount: 1,
        survivalRate: 81.3,
        settlementRate: 93.0,
        growthStage: '稚ウニ',
        confidence: 87.2,
        needsReview: false,
        analysisTime: 1.8,
        detections: []
      },
      isModified: false,
      reviewer: '鈴木 雅之',
      reviewedAt: '2026-08-18 14:10',
      status: 'confirmed',
      createdAt: '2026-08-18T13:50:00.000Z'
    },
    {
      id: 'REC-20260818-007',
      sampleDate: '2026-08-18',
      tankId: 'T-01',
      lotId: 'LOT-202608-A',
      operator: '佐藤 健一',
      growthStage: '浮遊幼生',
      magnification: '100倍',
      sampleVolume: 1.0,
      notes: '夕方定期検査。活力極めて良好。',
      imageUrl: SAMPLE_MICROSCOPE_IMAGES[0].svgData,
      initialAiResult: {
        totalCount: 50,
        aliveCount: 47,
        deadCount: 2,
        unknownCount: 1,
        survivalRate: 95.9,
        settlementRate: 0,
        growthStage: '浮遊幼生',
        confidence: 95.0,
        needsReview: false,
        analysisTime: 1.7,
        detections: []
      },
      finalResult: {
        totalCount: 50,
        aliveCount: 47,
        deadCount: 2,
        unknownCount: 1,
        survivalRate: 95.9,
        settlementRate: 0,
        growthStage: '浮遊幼生',
        confidence: 95.0,
        needsReview: false,
        analysisTime: 1.7,
        detections: []
      },
      isModified: false,
      reviewer: '佐藤 健一',
      reviewedAt: '2026-08-18 16:30',
      status: 'confirmed',
      createdAt: '2026-08-18T16:15:00.000Z'
    },
    {
      id: 'REC-20260818-008',
      sampleDate: '2026-08-18',
      tankId: 'T-03',
      lotId: 'LOT-202607-C',
      operator: '佐藤 健一',
      growthStage: '着底直後',
      magnification: '40倍',
      sampleVolume: 1.0,
      notes: '波板周辺海水のサンプリング。浮遊残存個体は少数。',
      imageUrl: SAMPLE_MICROSCOPE_IMAGES[2].svgData,
      initialAiResult: {
        totalCount: 30,
        aliveCount: 26,
        deadCount: 3,
        unknownCount: 1,
        survivalRate: 89.7,
        settlementRate: 76.0,
        growthStage: '着底直後',
        confidence: 90.1,
        needsReview: false,
        analysisTime: 1.6,
        detections: []
      },
      finalResult: {
        totalCount: 30,
        aliveCount: 26,
        deadCount: 3,
        unknownCount: 1,
        survivalRate: 89.7,
        settlementRate: 76.0,
        growthStage: '着底直後',
        confidence: 90.1,
        needsReview: false,
        analysisTime: 1.6,
        detections: []
      },
      isModified: false,
      reviewer: '佐藤 健一',
      reviewedAt: '2026-08-18 17:00',
      status: 'confirmed',
      createdAt: '2026-08-18T16:45:00.000Z'
    }
  ];

  // 過去14日分の履歴データを生成（グラフ表示と分析用）
  const dates = [
    '2026-08-05', '2026-08-06', '2026-08-07', '2026-08-08', '2026-08-09',
    '2026-08-10', '2026-08-11', '2026-08-12', '2026-08-13', '2026-08-14',
    '2026-08-15', '2026-08-16', '2026-08-17'
  ];

  dates.forEach((dateStr, idx) => {
    // タンク T-01
    records.push({
      id: `REC-${dateStr.replace(/-/g, '')}-001`,
      sampleDate: dateStr,
      tankId: 'T-01',
      lotId: 'LOT-202608-A',
      operator: '佐藤 健一',
      growthStage: '浮遊幼生',
      magnification: '100倍',
      sampleVolume: 1.0,
      notes: `定期調査 (${dateStr})。発育良好。`,
      imageUrl: SAMPLE_MICROSCOPE_IMAGES[0].svgData,
      initialAiResult: {
        totalCount: 46 + (idx % 4),
        aliveCount: 43 + (idx % 3),
        deadCount: 2 + (idx % 2),
        unknownCount: 1,
        survivalRate: Math.round((93.5 + (idx % 3) * 1.2) * 10) / 10,
        settlementRate: 0,
        growthStage: '浮遊幼生',
        confidence: 92.0 + (idx % 5),
        needsReview: false,
        analysisTime: 1.7,
        detections: []
      },
      finalResult: {
        totalCount: 46 + (idx % 4),
        aliveCount: 43 + (idx % 3),
        deadCount: 2 + (idx % 2),
        unknownCount: 1,
        survivalRate: Math.round((93.5 + (idx % 3) * 1.2) * 10) / 10,
        settlementRate: 0,
        growthStage: '浮遊幼生',
        confidence: 92.0 + (idx % 5),
        needsReview: false,
        analysisTime: 1.7,
        detections: []
      },
      isModified: false,
      reviewer: '佐藤 健一',
      reviewedAt: `${dateStr} 15:00`,
      status: 'confirmed',
      createdAt: `${dateStr}T14:30:00.000Z`
    });

    // タンク T-03
    if (idx >= 3) {
      records.push({
        id: `REC-${dateStr.replace(/-/g, '')}-002`,
        sampleDate: dateStr,
        tankId: 'T-03',
        lotId: 'LOT-202607-C',
        operator: '高橋 優花',
        growthStage: idx < 8 ? '変態期' : '着底直後',
        magnification: '40倍',
        sampleVolume: 1.0,
        notes: `着底経過観察 (${dateStr})。`,
        imageUrl: SAMPLE_MICROSCOPE_IMAGES[2].svgData,
        initialAiResult: {
          totalCount: 36 + (idx % 3),
          aliveCount: 32 + (idx % 3),
          deadCount: 3 + (idx % 2),
          unknownCount: 1,
          survivalRate: Math.round((87.0 + idx * 0.4) * 10) / 10,
          settlementRate: Math.round((45.0 + idx * 3.5) * 10) / 10,
          growthStage: idx < 8 ? '変態期' : '着底直後',
          confidence: 89.5,
          needsReview: false,
          analysisTime: 1.8,
          detections: []
        },
        finalResult: {
          totalCount: 36 + (idx % 3),
          aliveCount: 32 + (idx % 3),
          deadCount: 3 + (idx % 2),
          unknownCount: 1,
          survivalRate: Math.round((87.0 + idx * 0.4) * 10) / 10,
          settlementRate: Math.round((45.0 + idx * 3.5) * 10) / 10,
          growthStage: idx < 8 ? '変態期' : '着底直後',
          confidence: 89.5,
          needsReview: false,
          analysisTime: 1.8,
          detections: []
        },
        isModified: false,
        reviewer: '高橋 優花',
        reviewedAt: `${dateStr} 16:20`,
        status: 'confirmed',
        createdAt: `${dateStr}T16:00:00.000Z`
      });
    }
  });

  return records;
}

export function loadSettings(): AppSettings {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load settings from localStorage', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to localStorage', e);
  }
}

export function loadRecords(): AnalysisRecord[] {
  try {
    const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!initialized) {
      resetToDefaultSampleData();
      return generateInitialSampleRecords();
    }
    const data = localStorage.getItem(STORAGE_KEYS.RECORDS);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load records from localStorage', e);
  }
  return generateInitialSampleRecords();
}

export function saveRecords(records: AnalysisRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save records to localStorage', e);
  }
}

export function loadTanks(): TankInfo[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TANKS);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load tanks from localStorage', e);
  }
  return DEFAULT_SETTINGS.tanks;
}

export function saveTanks(tanks: TankInfo[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TANKS, JSON.stringify(tanks));
  } catch (e) {
    console.error('Failed to save tanks to localStorage', e);
  }
}

export function loadLots(): LotInfo[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.LOTS);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load lots from localStorage', e);
  }
  return DEFAULT_LOTS;
}

export function saveLots(lots: LotInfo[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LOTS, JSON.stringify(lots));
  } catch (e) {
    console.error('Failed to save lots to localStorage', e);
  }
}

/**
 * 初期サンプルデータに完全復元する
 */
export function resetToDefaultSampleData(): void {
  const sampleRecords = generateInitialSampleRecords();
  localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(sampleRecords));
  localStorage.setItem(STORAGE_KEYS.TANKS, JSON.stringify(DEFAULT_SETTINGS.tanks));
  localStorage.setItem(STORAGE_KEYS.LOTS, JSON.stringify(DEFAULT_LOTS));
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
}

/**
 * 全データをクリアする
 */
export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEYS.RECORDS);
  localStorage.removeItem(STORAGE_KEYS.TANKS);
  localStorage.removeItem(STORAGE_KEYS.LOTS);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  localStorage.removeItem(STORAGE_KEYS.INITIALIZED);
}
