/**
 * エゾバフンウニ種苗生産センター - AI生産管理システム 型定義
 */

export type GrowthStage = 
  | '浮遊幼生' 
  | '変態期' 
  | '着底直後' 
  | '稚ウニ' 
  | 'その他';

export type Magnification = 
  | '40倍' 
  | '100倍' 
  | '200倍' 
  | '400倍' 
  | 'その他';

export type DetectionType = 'alive' | 'dead' | 'unknown';

export interface DetectionItem {
  id: string;
  x: number; // 0-100 percentage inside image
  y: number; // 0-100 percentage inside image
  radius: number;
  type: DetectionType;
  confidence: number;
  sizeUm?: number; // Estimated size in micrometers
  stage?: GrowthStage;
}

export interface AnalysisMetadata {
  sampleDate: string; // YYYY-MM-DD
  tankId: string;
  lotId: string;
  operator: string;
  growthStage: GrowthStage;
  magnification: Magnification;
  sampleVolume: number; // in ml, e.g., 1.0
  notes: string;
}

export interface AnalysisResult {
  totalCount: number;
  aliveCount: number;
  deadCount: number;
  unknownCount: number;
  survivalRate: number; // 0 - 100 (%)
  settlementRate: number; // 0 - 100 (%)
  growthStage: GrowthStage;
  confidence: number; // 0 - 100 (%)
  needsReview: boolean;
  analysisTime: number; // in seconds, e.g. 1.5
  detections: DetectionItem[];
}

export type RecordStatus = 'pending' | 'confirmed' | 'needs_attention';

export interface AnalysisRecord {
  id: string;
  sampleDate: string;
  tankId: string;
  lotId: string;
  operator: string;
  growthStage: GrowthStage;
  magnification: Magnification;
  sampleVolume: number;
  notes: string;
  imageUrl: string;
  initialAiResult: AnalysisResult;
  finalResult: AnalysisResult;
  isModified: boolean;
  modificationReason?: string;
  reviewer?: string;
  reviewedAt?: string;
  status: RecordStatus;
  createdAt: string;
  reviewReason?: string; // Reason why human review was flagged (e.g. AI信頼度 76% < 80%, 生残率 78.4% < 85%)
}

export interface TankInfo {
  id: string; // T-01, T-02, etc.
  name: string;
  status: 'active' | 'maintenance' | 'empty';
  currentLotId: string;
  startDate: string;
  latestSurvivalRate: number;
  latestSampleDate: string;
  pendingCount: number;
  capacityLitres: number;
  waterTempCelsius: number;
  salinityPsu: number;
  notes?: string;
  enabled: boolean;
}

export interface LotInfo {
  lotId: string;
  fertilizationDate: string;
  tankId: string;
  initialCount: number;
  currentEstimatedCount: number;
  latestSurvivalRate: number;
  growthStage: GrowthStage;
  settlementRate: number;
  operator: string;
  notes: string;
  status: 'culturing' | 'settled' | 'shipped';
}

export interface AppSettings {
  survivalRateWarningThreshold: number; // e.g. 85 (%)
  aiConfidenceThreshold: number; // e.g. 80 (%)
  standardSampleVolume: number; // e.g. 1.0 (ml)
  facilityName: string;
  defaultOperator: string;
  tanks: TankInfo[];
  alertStaleDaysThreshold: number; // Alert if no sample taken in X days (default: 3)
}

export type NavigationTab = 
  | 'home' 
  | 'capture' 
  | 'pending' 
  | 'tanks' 
  | 'analytics' 
  | 'settings';
