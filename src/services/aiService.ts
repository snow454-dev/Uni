/**
 * 画像解析AIサービス インターフェース及び模擬解析エンジン
 * 将来の本番AIエンジン (Gemini / カスタムYOLO・ResNet等) への接続を見据えた疎結合設計
 */

import { AnalysisMetadata, AnalysisResult, DetectionItem, DetectionType, GrowthStage } from '../types';

/**
 * 画像解析の公式エントリポイント
 * 将来のAI API接続時は、この内部実装をバックエンド呼び出しに置き換えます。
 */
export async function analyzeImage(
  file: File | string,
  metadata: AnalysisMetadata
): Promise<AnalysisResult> {
  // 現在は試作品のため、模擬解析エンジンを呼び出します
  return mockAnalyzeImage(file, metadata);
}

/**
 * 模擬AI解析エンジン
 * 顕微鏡画像と採取メタデータに基づき、リアルな計数・生残率・信頼度・検出座標を約1.5秒で生成します。
 */
export async function mockAnalyzeImage(
  file: File | string,
  metadata: AnalysisMetadata
): Promise<AnalysisResult> {
  // 1.5秒の模擬推論遅延
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // 水槽や発育段階に応じたリアルなシミュレーションシード値
  const isEarlyStage = metadata.growthStage === '浮遊幼生' || metadata.growthStage === '変態期';
  const baseCount = isEarlyStage ? Math.floor(45 + Math.random() * 40) : Math.floor(25 + Math.random() * 30);
  
  // 採取量によるスケーリング (標準 1.0ml)
  const volumeMultiplier = Math.max(0.2, metadata.sampleVolume || 1.0);
  const totalSimulated = Math.max(5, Math.round(baseCount * volumeMultiplier));

  // 生存率の模擬（水槽IDによる個性付け: T-04は少し低めにして確認待ちを発生させやすくする）
  let baseSurvivalRate = 0.92;
  if (metadata.tankId === 'T-04') {
    baseSurvivalRate = 0.78 + Math.random() * 0.08; // 注意発生用
  } else if (metadata.tankId === 'T-02') {
    baseSurvivalRate = 0.86 + Math.random() * 0.08;
  } else {
    baseSurvivalRate = 0.89 + Math.random() * 0.09;
  }

  // 生存・死亡・不明の振り分け
  const aliveCount = Math.round(totalSimulated * baseSurvivalRate);
  const remaining = totalSimulated - aliveCount;
  const unknownCount = Math.max(0, Math.floor(remaining * 0.3));
  const deadCount = Math.max(0, remaining - unknownCount);
  const totalCount = aliveCount + deadCount + unknownCount;

  // 計算ルール: 生残率 ＝ 生存数 ÷（生存数 ＋ 死亡数）× 100
  const effectiveTotal = aliveCount + deadCount;
  const rawSurvivalRate = effectiveTotal > 0 ? (aliveCount / effectiveTotal) * 100 : 100;
  const survivalRate = Math.round(rawSurvivalRate * 10) / 10;

  // 着底率の計算（発育段階に応じた着底状況）
  let settlementRate = 0;
  if (metadata.growthStage === '着底直後') {
    settlementRate = Math.round((60 + Math.random() * 30) * 10) / 10;
  } else if (metadata.growthStage === '稚ウニ') {
    settlementRate = Math.round((90 + Math.random() * 9.5) * 10) / 10;
  } else if (metadata.growthStage === '変態期') {
    settlementRate = Math.round((15 + Math.random() * 35) * 10) / 10;
  } else {
    settlementRate = 0;
  }

  // AI信頼度の算出 (80%未満になるケースも適切に演出)
  let confidence = Math.round((82 + Math.random() * 15) * 10) / 10;
  if (metadata.tankId === 'T-04' || unknownCount >= 3 || Math.random() < 0.2) {
    confidence = Math.round((72 + Math.random() * 7) * 10) / 10; // 80%未満
  }

  const needsReview = confidence < 80 || survivalRate < 85;

  // 顕微鏡画像上のバウンディングボックス/検出丸印（0〜100%のランダム座標）
  const detections: DetectionItem[] = [];

  // 円形視野内に散らばるように座標を生成
  const generateCoordinate = () => {
    // 顕微鏡の円形レンズ内（中心 (50,50), 半径38%以内）
    const angle = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * 36;
    const x = 50 + r * Math.cos(angle);
    const y = 50 + r * Math.sin(angle);
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  };

  for (let i = 0; i < aliveCount; i++) {
    const coord = generateCoordinate();
    detections.push({
      id: `det-alive-${i + 1}`,
      x: coord.x,
      y: coord.y,
      radius: Math.round((isEarlyStage ? 14 : 18) + (Math.random() * 4 - 2)),
      type: 'alive',
      confidence: Math.round((85 + Math.random() * 14) * 10) / 10,
      sizeUm: Math.round(180 + Math.random() * 70),
      stage: metadata.growthStage
    });
  }

  for (let i = 0; i < deadCount; i++) {
    const coord = generateCoordinate();
    detections.push({
      id: `det-dead-${i + 1}`,
      x: coord.x,
      y: coord.y,
      radius: Math.round((isEarlyStage ? 12 : 16) + (Math.random() * 3 - 1.5)),
      type: 'dead',
      confidence: Math.round((75 + Math.random() * 20) * 10) / 10,
      sizeUm: Math.round(160 + Math.random() * 50),
      stage: metadata.growthStage
    });
  }

  for (let i = 0; i < unknownCount; i++) {
    const coord = generateCoordinate();
    detections.push({
      id: `det-unknown-${i + 1}`,
      x: coord.x,
      y: coord.y,
      radius: Math.round((isEarlyStage ? 10 : 14) + (Math.random() * 3)),
      type: 'unknown',
      confidence: Math.round((60 + Math.random() * 18) * 10) / 10,
      sizeUm: Math.round(140 + Math.random() * 40),
      stage: metadata.growthStage
    });
  }

  return {
    totalCount,
    aliveCount,
    deadCount,
    unknownCount,
    survivalRate,
    settlementRate,
    growthStage: metadata.growthStage,
    confidence,
    needsReview,
    analysisTime: 1.5,
    detections
  };
}

/**
 * 試作用の顕微鏡サンプル画像データ（データURI SVG形式）
 */
export const SAMPLE_MICROSCOPE_IMAGES = [
  {
    id: 'sample-early-pluteus',
    title: 'サンプル1: 浮遊幼生期 (プルテウス幼生 4腕期)',
    stage: '浮遊幼生' as GrowthStage,
    magnification: '100倍',
    tankId: 'T-01',
    lotId: 'LOT-202608-A',
    description: '4本のアームが発達した活発なプルテウス幼生。良好な生存状態。',
    svgData: generateMicroscopeSvg('pluteus', 42, 3, 1)
  },
  {
    id: 'sample-metamorphosis',
    title: 'サンプル2: 変態期 (8腕プルテウス・成体原基形成)',
    stage: '変態期' as GrowthStage,
    magnification: '100倍',
    tankId: 'T-02',
    lotId: 'LOT-202608-B',
    description: '成体原基（ウニの骨格原基）が発達し、着底の準備段階。一部変性個体あり。',
    svgData: generateMicroscopeSvg('metamorphosis', 36, 5, 2)
  },
  {
    id: 'sample-settlement',
    title: 'サンプル3: 着底直後 (波板採苗・初期変態)',
    stage: '着底直後' as GrowthStage,
    magnification: '40倍',
    tankId: 'T-03',
    lotId: 'LOT-202607-C',
    description: '幼生アームを脱落し、管足と初期棘で基質に付着した状態。',
    svgData: generateMicroscopeSvg('settled', 28, 2, 1)
  },
  {
    id: 'sample-juvenile-warning',
    title: 'サンプル4: 稚ウニ期 [注意水槽: 生残率低下兆候]',
    stage: '稚ウニ' as GrowthStage,
    magnification: '40倍',
    tankId: 'T-04',
    lotId: 'LOT-202607-D',
    description: '棘が放射状に発達した稚ウニ。水温上昇による一部斃死が疑われる水槽サンプル。',
    svgData: generateMicroscopeSvg('juvenile', 22, 7, 3)
  }
];

function generateMicroscopeSvg(type: string, alive: number, dead: number, unknown: number): string {
  // SVG形式でリアルな顕微鏡円形視野と微細藻類・ウニ幼生のテクスチャを生成
  const total = alive + dead + unknown;
  let items = '';

  for (let i = 0; i < total; i++) {
    const angle = (i * 137.5 * Math.PI) / 180; // ゴールデンアングル分布
    const r = Math.sqrt((i + 1) / total) * 190 + (Math.random() * 20 - 10);
    const cx = 250 + r * Math.cos(angle);
    const cy = 250 + r * Math.sin(angle);

    if (i < alive) {
      if (type === 'pluteus') {
        // プルテウス幼生（特徴的な三角・細長いアームを持つ形状）
        items += `
          <g transform="translate(${cx},${cy}) rotate(${Math.floor(angle * 57)}) scale(${0.7 + Math.random() * 0.3})">
            <path d="M 0 -14 L 10 14 L 0 8 L -10 14 Z" fill="#2E7D32" fill-opacity="0.35" stroke="#1B5E20" stroke-width="1.5"/>
            <circle cx="0" cy="-2" r="4" fill="#66BB6A" fill-opacity="0.7"/>
            <line x1="-8" y1="12" x2="-14" y2="24" stroke="#1B5E20" stroke-width="1.2"/>
            <line x1="8" y1="12" x2="14" y2="24" stroke="#1B5E20" stroke-width="1.2"/>
          </g>
        `;
      } else if (type === 'juvenile' || type === 'settled') {
        // 稚ウニ（円形に棘が放射状に出ている形状）
        items += `
          <g transform="translate(${cx},${cy}) scale(${0.6 + Math.random() * 0.4})">
            <circle cx="0" cy="0" r="10" fill="#2E7D32" fill-opacity="0.4" stroke="#1B5E20" stroke-width="1.5"/>
            <circle cx="0" cy="0" r="6" fill="#81C784" fill-opacity="0.8"/>
            ${[0, 45, 90, 135, 180, 225, 270, 315].map(deg => 
              `<line x1="0" y1="0" x2="${Math.cos(deg*Math.PI/180)*16}" y2="${Math.sin(deg*Math.PI/180)*16}" stroke="#1B5E20" stroke-width="1.2"/>`
            ).join('')}
          </g>
        `;
      } else {
        // 変態期
        items += `
          <g transform="translate(${cx},${cy}) rotate(${Math.floor(angle * 57)}) scale(${0.7 + Math.random() * 0.3})">
            <ellipse cx="0" cy="0" rx="9" ry="7" fill="#2E7D32" fill-opacity="0.4" stroke="#1B5E20" stroke-width="1.5"/>
            <circle cx="2" cy="0" r="4" fill="#388E3C" fill-opacity="0.8"/>
            <line x1="-7" y1="-5" x2="-13" y2="-12" stroke="#1B5E20" stroke-width="1.2"/>
            <line x1="7" y1="-5" x2="13" y2="-12" stroke="#1B5E20" stroke-width="1.2"/>
          </g>
        `;
      }
    } else if (i < alive + dead) {
      // 死亡個体（崩壊した細胞塊、不透明・茶色〜赤褐色・アーム破損）
      items += `
        <g transform="translate(${cx},${cy}) scale(0.7)">
          <ellipse cx="0" cy="0" rx="8" ry="6" fill="#C62828" fill-opacity="0.45" stroke="#B71C1C" stroke-dasharray="2,2" stroke-width="1.5"/>
          <circle cx="-2" cy="1" r="3" fill="#E57373" fill-opacity="0.7"/>
          <circle cx="3" cy="-2" r="2" fill="#EF5350" fill-opacity="0.7"/>
        </g>
      `;
    } else {
      // 判定不能（微小ゴミ・重なり・フォーカスぼけ）
      items += `
        <g transform="translate(${cx},${cy}) scale(0.6)">
          <path d="M -6 -4 Q 0 -8 6 -3 Q 8 4 2 7 Q -5 6 -6 -4" fill="#F57F17" fill-opacity="0.3" stroke="#F57F17" stroke-width="1.2"/>
          <circle cx="0" cy="0" r="3" fill="#FFF59D" fill-opacity="0.6"/>
        </g>
      `;
    }
  }

  // 顕微鏡の目盛り線と海水中の微粒子テクスチャ
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
      <defs>
        <radialGradient id="lensShading" cx="50%" cy="50%" r="50%" fx="45%" fy="45%">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="1" />
          <stop offset="70%" stop-color="#E8F4F8" stop-opacity="1" />
          <stop offset="90%" stop-color="#C5DEE8" stop-opacity="1" />
          <stop offset="100%" stop-color="#7B9AA8" stop-opacity="1" />
        </radialGradient>
        <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#B0CCD8" stroke-width="0.5" stroke-opacity="0.4"/>
        </pattern>
      </defs>
      
      <!-- 顕微鏡視野の外枠暗部 -->
      <rect width="500" height="500" fill="#0C1B29" />
      
      <!-- 顕微鏡の円形視野 -->
      <circle cx="250" cy="250" r="235" fill="url(#lensShading)" />
      <circle cx="250" cy="250" r="235" fill="url(#grid)" />
      
      <!-- 計数グリッド中心十字 -->
      <line x1="250" y1="20" x2="250" y2="480" stroke="#7BA3B5" stroke-width="0.8" stroke-dasharray="3,3" opacity="0.6"/>
      <line x1="20" y1="250" x2="480" y2="250" stroke="#7BA3B5" stroke-width="0.8" stroke-dasharray="3,3" opacity="0.6"/>
      <circle cx="250" cy="250" r="100" fill="none" stroke="#7BA3B5" stroke-width="0.6" stroke-dasharray="2,2" opacity="0.4"/>
      
      <!-- 幼生・稚ウニ配置 -->
      ${items}
      
      <!-- 顕微鏡スケールバー -->
      <g transform="translate(330, 440)">
        <rect x="0" y="0" width="130" height="24" rx="4" fill="#12324A" fill-opacity="0.85"/>
        <line x1="15" y1="12" x2="75" y2="12" stroke="#FFFFFF" stroke-width="2"/>
        <line x1="15" y1="8" x2="15" y2="16" stroke="#FFFFFF" stroke-width="2"/>
        <line x1="75" y1="8" x2="75" y2="16" stroke="#FFFFFF" stroke-width="2"/>
        <text x="85" y="16" fill="#FFFFFF" font-family="sans-serif" font-size="10" font-weight="bold">500 μm</text>
      </g>
      
      <!-- 視野リング枠 -->
      <circle cx="250" cy="250" r="235" fill="none" stroke="#12324A" stroke-width="12" />
      <circle cx="250" cy="250" r="242" fill="none" stroke="#3A5C74" stroke-width="2" />
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
