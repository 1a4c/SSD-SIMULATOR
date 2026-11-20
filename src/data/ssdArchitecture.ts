export type LayerId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type ScenarioId = 'ai-training-qlc' | 'cxl-kv-cache' | 'rad-hard-space';

export type NavTabId = 'topology' | 'formal' | 'scenarios' | 'matrix';

export interface ArchitectureLayerSpec {
  id: LayerId;
  rankLabel: string;
  title: string;
  subsystemName: string;
  primitive: string;
  ssdMapping: string;
  mathSymbol: string;
  mathFullForm: string;
  mathSummary: string;
  accentHex: string;
  accentClass: string;
  summary: string;
  mechanisms: {
    term: string;
    detail: string;
  }[];
  keyInvariant: string;
}

export interface SimulationParams {
  scenarioId: ScenarioId;
  channelCount: number; // M: 4..32
  leasingLengthMb: number; // l_k: 64..1024 MB
  yPortDmaShare: number; // 50..90% (remaining goes to GC / Metadata isolation path)
  randomRead4kRatio: number; // 10..95%
  partialLeadDepth: number; // 0..100% (tR hiding look-ahead aggressiveness)
  subPageSuspendEnabled: boolean; // i-lock_perspensed Program/Erase suspend
  asicOffloadRatio: number; // 0..100% (LDPC / Compute offload escalation)
  temperatureC: number; // -55..125 °C
  tiltAngleDeg: number; // 0.0..2.5 ° (HARC channel tilt)
  peCycles: number; // 100..30000
  selfHealingEnabled: boolean; // healed_slit-abstructed active hole injection & eFuse
}

export interface DieCellState {
  channel: number;
  die: number;
  id: string;
  reclaimGroup: 'Hot-Stream' | 'Warm-KV' | 'Cold-Archive' | 'PLP-SLC';
  wearPercent: number;
  rawBerLog10: number; // e.g. -5.2 => 10^-5.2
  healedBerLog10: number;
  faultType: 'none' | 'seu' | 'wl-short';
  isolatedBySlit: boolean;
  healingActive: boolean;
  suspendedErase: boolean;
  leasedLengthMb: number;
}

export interface LatencyPoint {
  percentile: string;
  baselineUs: number;
  optimizedUs: number;
}

export interface RadarDimension {
  label: string;
  shortLabel: string;
  currentScore: number; // 0..100
  legacyScore: number; // 0..100
  unitNote: string;
}

export interface SimulationMetrics {
  waf: number;
  wafBaseline: number;
  p50LatencyUs: number;
  p99LatencyUs: number;
  p9999LatencyUs: number;
  p9999BaselineUs: number;
  trHiddenRatioPct: number;
  effectiveBandwidthGbps: number;
  dmaBandwidthGbps: number;
  gcIsolationBandwidthGbps: number;
  suspendedOpsPerSec: number;
  subPageMutexConflictsPerK: number;
  asicOffloadSavingPct: number;
  cpuUtilizationPct: number;
  plpHoldWindowMs: number;
  plpJournalFlushPct: number;
  tiltCompensationPs: number;
  rawBer: string;
  healedBer: string;
  rawBerLog10: number;
  healedBerLog10: number;
  isolatedFaultCount: number;
  healedBlockCount: number;
  enduranceGainFactor: number;
  latencyCurve: LatencyPoint[];
  radarDimensions: RadarDimension[];
  dieMatrix: DieCellState[];
}

export interface ScenarioPreset {
  id: ScenarioId;
  name: string;
  shortName: string;
  domainLabel: string;
  focusLayers: LayerId[];
  targetDescription: string;
  mechanismChain: {
    goal: string;
    primitives: string;
    outcome: string;
  };
  params: SimulationParams;
}

export const ARCHITECTURE_LAYERS: ArchitectureLayerSpec[] = [
  {
    id: 1,
    rankLabel: '第 1 層 · 最內層',
    title: '儲存媒體與通道資源層',
    subsystemName: 'I/O 資源池化與動態租賃',
    primitive: 'arch-io_asset()_group-leasing_len',
    ssdMapping: 'FDP（Flexible Data Placement）與多通道（Multi-Channel）動態頻寬租賃',
    mathSymbol: '⋃ Lease(ℐₖ, ℓₖ)',
    mathFullForm: '⋃_{k=1}^{M} Lease(ℐ_k, ℓ_k)',
    mathSummary: '將底層 M 個 NAND 通道與 Die 資產 ℐ_k 依據 FDP 策略動態租賃長度為 ℓ_k 的擦除區塊空間與時間片。',
    accentHex: '#06B6D4',
    accentClass: 'text-cyan-400',
    summary:
      '代表 SSD 控制器底層的硬體 I/O 資產集合，涵蓋 NAND Flash 多通道、Die、Plane 與 SRAM/DRAM 緩衝區。透過 NVMe 2.0/2.1 FDP 標準，將生命週期相同的資料置於獨立 Reclaim Group，以固定租賃長度 ℓₖ 徹底隔絕冷熱資料混合。',
    mechanisms: [
      {
        term: 'arch-io_asset()',
        detail: '統籌 M 個並行通道、NAND Die/Plane 硬體陣列與控制器內部快取資源池。',
      },
      {
        term: 'group-leasing_len',
        detail: '對應 FDP Reclaim Group / Placement Handle，按資料熱度分配固定長度擦除區塊（Erase Block）與通道時間片，將寫入放大（WAF）壓制至趨近 1.0。',
      },
    ],
    keyInvariant: '冷熱資料跨群組零混合 · Reclaim Group 硬體隔離',
  },
  {
    id: 2,
    rankLabel: '第 2 層',
    title: '匯流排與交叉開關層',
    subsystemName: '非對稱路由與多路徑 I/O 拓撲',
    primitive: 'Y-sculped_port[ ... ]',
    ssdMapping: 'PCIe Gen5/Gen6 雙埠（Dual-Port）分叉與 Y 型非對稱 I/O 路由拓撲',
    mathSymbol: '𝒯_Y-port(·)',
    mathFullForm: '𝒯_{Y-port}(·)',
    mathSummary: '經由具備流量塑形能力的 Y 型非對稱埠口，執行冷熱資料與前台/後台讀寫指令的硬體分叉路由。',
    accentHex: '#22D3EE',
    accentClass: 'text-cyan-300',
    summary:
      '在硬體互連與 NoC（Network-on-Chip）層面實現封包級流量塑形（Traffic Shaping）與路徑分叉。於 U.2 / E3.S 雙埠或 CXL.mem / CXL.io 混合介面中，將前台高吞吐 DMA 引擎與後台低延遲 GC / Metadata 引擎物理隔離。',
    mechanisms: [
      {
        term: 'Y 型非對稱分叉',
        detail: '主分支專責高吞吐量連續讀寫 DMA 引擎；側分支專責低延遲後台垃圾回收（GC）與 L2P 元資料查詢，互不搶占匯流排頻寬。',
      },
      {
        term: 'CXL / Dual-Port 塑形',
        detail: '對同時湧入的 PCIe Gen5/Gen6 與 CXL.mem 請求進行權重仲裁，消除後台搬移對主機請求的隊頭阻塞（HoL Blocking）。',
      },
    ],
    keyInvariant: '前台 DMA 與後台 GC 實體通道分離 · 零隊頭阻塞',
  },
  {
    id: 3,
    rankLabel: '第 3 層',
    title: 'FTL 排程與快取層',
    subsystemName: '部分超前執行與預取管線',
    primitive: 'i-partial_lead[ ... ]',
    ssdMapping: '內部部分超前預取（Internal Partial Look-ahead / Speculative Prefetch）',
    mathSymbol: '𝒫_lead(·)',
    mathFullForm: '𝒫_{lead}(·)',
    mathSummary: '對 L2P 映射表偏移量進行部分超前解析，提前觸發 NAND Read Page 指令以隱藏 tR 讀取感測延遲。',
    accentHex: '#38BDF8',
    accentClass: 'text-sky-400',
    summary:
      '處理高並發 4K 隨機讀取或龐大 L2P（Logical-to-Physical）映射表查詢時，控制器無需等待整個映射頁面載入 SRAM，而是透過部分超前導引機制提前解析關鍵 Offset 並對 NAND 介面發出 Read Page，實現 tR 隱藏（tR Hiding）。',
    mechanisms: [
      {
        term: 'Partial Look-ahead',
        detail: '在完整 L2P 頁面傳輸完成前即截取高頻位址偏移量，將串行查表延遲轉化為與 NAND 感測重疊的並行管線。',
      },
      {
        term: 'tR 隱藏與 QoS 99.99%',
        detail: '預先將目標 Wordline 充電與感測時間隱藏於匯流排排程空隙，大幅壓低高並發下的尾端延遲（Tail Latency）。',
      },
    ],
    keyInvariant: '部分 Offset 超前解碼 · tR 感測時間管線化隱藏',
  },
  {
    id: 4,
    rankLabel: '第 4 層',
    title: '並行一致性控制層',
    subsystemName: '細粒度互斥鎖與狀態懸置',
    primitive: 'i-lock_perspensed[ ... ]',
    ssdMapping: 'L2P 映射表細粒度區段鎖定與計算懸置（Sub-page Mutex & Suspended Execution）',
    mathSymbol: 'ℒ_suspend(·)',
    mathFullForm: 'ℒ_{suspend}(·)',
    mathSummary: '施加 4KB 區段微秒級互斥鎖，並在遇高優先級讀取時即時觸發 Program/Erase Suspend 懸置低優先寫擦任務。',
    accentHex: '#F59E0B',
    accentClass: 'text-amber-400',
    summary:
      '在多核心 ARM / RISC-V SSD 控制器同時存取同一 NAND Die 或更新 L2P 映射表時，僅對受影響的 4KB Sub-page 區段施加互斥鎖；若遇緊急主機讀取，立即懸置進行中的 Program/Erase 操作，讓讀取封包搶占通過後無縫恢復。',
    mechanisms: [
      {
        term: 'Sub-page 4KB Mutex',
        detail: '避免整顆 Die 或整張 L2P 頁面的粗粒度鎖死，將多核心並行衝突降至微秒級局部區段。',
      },
      {
        term: 'Program / Erase Suspend',
        detail: '毫秒級 Erase 或數百微秒級 Program 遇到高優先級 Read 時即時暫停電荷泵並保存狀態，讀取完成後無縫續寫。',
      },
    ],
    keyInvariant: '4KB 細粒度互斥鎖 · 高優先讀取即時搶占懸置',
  },
  {
    id: 5,
    rankLabel: '第 5 層',
    title: '韌體與硬體加速器介面層',
    subsystemName: '控制埠口掛載與特權層級提升',
    primitive: 'held-port_ascend-site[ ... ]',
    ssdMapping: 'NVMe SQ/CQ 埠口綁定與硬體加速器特權提升（Hardware Offload Escalation）',
    mathSymbol: 'ℰ_ascend(·)',
    mathFullForm: 'ℰ_{ascend}(·)',
    mathSummary: '綁定持久性 NVMe Doorbell 與佇列埠口，並在遭遇高負載解碼或運算儲存任務時提升控制流至專用 ASIC 硬體引擎。',
    accentHex: '#A78BFA',
    accentClass: 'text-violet-400',
    summary:
      '由維持狀態的持久性控制埠（held-port，對應 NVMe Doorbell 與 Admin/I/O Queue）與運算特權提升位點（ascend-site）組成。當一般韌體 CPU 面對 LDPC 軟解碼重試、內聯壓縮/加密或 Computational Storage 任務時，控制流直接躍升至專用 ASIC 加速引擎，達成零 CPU 介入的自動化資料流。',
    mechanisms: [
      {
        term: 'held-port 佇列綁定',
        detail: '維持 PCIe NVMe Submission / Completion Queue 狀態鎖定與 Doorbell 低抖動響應。',
      },
      {
        term: 'ascend-site ASIC 提升',
        detail: 'LDPC Soft-Decode、AES-XTS 加密與近儲存算子直接卸載至硬體自動化管線，釋放通用核心算力。',
      },
    ],
    keyInvariant: 'Doorbell 狀態持久化 · 重運算零 CPU 介入 ASIC 卸載',
  },
  {
    id: 6,
    rankLabel: '第 6 層',
    title: '全域定址與元資料管理層',
    subsystemName: '根集合錨定與命名空間拓撲',
    primitive: 'root_set[ ... ]',
    ssdMapping: 'L2P 全域根集合（Global Root Set）與斷電保護（PLP）元資料快照',
    mathSymbol: 'ℛ_root(·)',
    mathFullForm: 'ℛ_{root}(·)',
    mathSummary: '錨定所有有效 LBA 與 Namespace 映射樹根節點，於斷電瞬間依賴 PLP 電容將未落盤日誌原子刷新至 SLC Cache。',
    accentHex: '#10B981',
    accentClass: 'text-emerald-400',
    summary:
      '作為全域定址與 GC 可達性分析的根節點集合，維護所有有效 LBA 與 Namespace 映射樹的一致性。結合企業級斷電保護電容（PLP），一旦外部電源異常中斷，控制器於數毫秒內利用電容殘餘能量，將 root_set 及底層已租賃但未落盤的 Journal 原子寫入保留 SLC Cache。',
    mechanisms: [
      {
        term: 'Global Root Set 錨定',
        detail: '維持 Multi-Namespace 與 L2P B+Tree / Radix 根指標的單一真實來源，確保 GC 與快照拓撲一致。',
      },
      {
        term: 'PLP 毫秒級原子快照',
        detail: '偵測電壓跌落後於電容保持窗口（Hold-up Window）內完成 Dirty Metadata 與 Journal 原子落盤，保證資料零遺失。',
      },
    ],
    keyInvariant: 'PLP 保持窗口內 100% 原子快照 · 全域命名空間零遺失',
  },
  {
    id: 7,
    rankLabel: '第 7 層 · 最外層',
    title: '3D NAND 物理層與封裝層',
    subsystemName: '物理裂隙抽象化、傾斜對齊核心組裝與自我修復',
    primitive: 'healed_slit-abstructed_tilt-aligned-core_assembly[ ... ]',
    ssdMapping: '3D NAND 高深寬比通道對齊、裂隙隔離與晶片級自我修復（Self-Healing NAND）',
    mathSymbol: 'ℋ_heal ∘ 𝒜_align(·)',
    mathFullForm: 'ℋ_{heal} ∘ 𝒜_{align}(·)',
    mathSummary: '於物理層補償 200+ 層 HARC 通道傾斜時序偏移，並在 Slit 故障隔離域內執行電洞退火與 eFuse 壞塊自癒閉環。',
    accentHex: '#F43F5E',
    accentClass: 'text-rose-400',
    summary:
      '針對 200 層以上 Xtacking / Multi-Deck 3D NAND 物理特性所構築的最外層防護與封裝結構。結合通道傾斜訓練補償（tilt-aligned）、絕緣槽邏輯故障域抽象（slit-abstructed）以及電洞注入熱載子退火與 eFuse 冗餘重映射（healed_），讓儲存系統在極端磨損或輻射衝擊下實現自我癒合。',
    mechanisms: [
      {
        term: 'tilt-aligned-core_assembly',
        detail: '透過 Link & Channel Training 補償 HARC 高深寬比蝕刻產生的通道傾斜與 Multi-Deck 堆疊時序/訊號衰減。',
      },
      {
        term: 'slit-abstructed 隔離域',
        detail: '將 3D NAND 物理絕緣隔離槽（Gate Line Slit）抽象為邏輯故障隔離域，阻斷 Wordline 短路或單粒子翻轉向鄰近區塊擴散。',
      },
      {
        term: 'healed_ 自我修復閉環',
        detail: 'BER 飆升時啟動局部電洞注入 / 熱載子退火恢復氧化層電荷陷阱，或透過 eFuse 啟用 OP Spare Pool 完成晶片級自癒。',
      },
    ],
    keyInvariant: 'HARC 傾斜皮秒級對齊 · Slit 域級故障阻斷與 BER 自癒',
  },
];

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: 'ai-training-qlc',
    name: 'AI 訓練高密度 QLC/PLC 企業級 SSD',
    shortName: 'AI 訓練 QLC/PLC',
    domainLabel: '大規模 Checkpoint 寫入 · 極低 WAF · 壽命延長',
    focusLayers: [1, 2, 7],
    targetDescription:
      '針對 AI 叢集密集的權重 Checkpoint 與多串流訓練集寫入，利用 FDP group-leasing_len 與 Y-sculped_port 徹底消除 QLC 寫入放大，並以 healed_slit-abstructed 局部熱退火延長 200+ 層 3D NAND 抹寫壽命。',
    mechanismChain: {
      goal: '消除高密度 QLC/PLC 在大規模 AI Checkpoint 寫入下的寫入放大（WAF）並延長 P/E 壽命',
      primitives: 'arch-io_asset()_group-leasing_len + Y-sculped_port + healed_slit-abstructed',
      outcome: 'WAF 由傳統 2.85 降至 1.03–1.08；200+ 層 NAND 有效 P/E 壽命提升約 2.1×',
    },
    params: {
      scenarioId: 'ai-training-qlc',
      channelCount: 16,
      leasingLengthMb: 512,
      yPortDmaShare: 82,
      randomRead4kRatio: 25,
      partialLeadDepth: 65,
      subPageSuspendEnabled: true,
      asicOffloadRatio: 78,
      temperatureC: 58,
      tiltAngleDeg: 0.9,
      peCycles: 6500,
      selfHealingEnabled: true,
    },
  },
  {
    id: 'cxl-kv-cache',
    name: 'CXL 記憶體擴充與持久化儲存混合裝置 (CXL-SSD)',
    shortName: 'CXL-SSD KV Cache',
    domainLabel: 'LLM 推論 KV Cache 卸載 · 確定性微秒延遲',
    focusLayers: [2, 3, 4],
    targetDescription:
      '滿足 LLM 長上下文推論將 KV Cache 卸載至 CXL-SSD 的嚴苛 QoS 需求。透過 i-partial_lead 隱藏 tR 感測延遲，並以 i-lock_perspensed 即時懸置後台擦除與寫入操作，達成確定性尾端延遲。',
    mechanismChain: {
      goal: '達成 LLM 推論 KV Cache 卸載所需的 QoS 99.99% 確定性微秒級讀取延遲',
      primitives: 'i-partial_lead + i-lock_perspensed + Y-sculped_port (CXL.mem/io)',
      outcome: 'P99.99 尾端延遲壓低超過 72%，4K 隨機讀取 tR 隱藏率達 88% 以上',
    },
    params: {
      scenarioId: 'cxl-kv-cache',
      channelCount: 32,
      leasingLengthMb: 128,
      yPortDmaShare: 74,
      randomRead4kRatio: 88,
      partialLeadDepth: 94,
      subPageSuspendEnabled: true,
      asicOffloadRatio: 85,
      temperatureC: 48,
      tiltAngleDeg: 0.5,
      peCycles: 2800,
      selfHealingEnabled: true,
    },
  },
  {
    id: 'rad-hard-space',
    name: '車規級與太空級抗輻射固態硬碟',
    shortName: '車規/太空抗輻射',
    domainLabel: '極端溫差 · 單粒子翻轉 SEU 防護 · 斷電原子快照',
    focusLayers: [5, 6, 7],
    targetDescription:
      '面對車用極端溫度梯度或太空高能粒子撞擊導致的單粒子翻轉（SEU），藉由 tilt-aligned-core_assembly 動態校驗、slit-abstructed 域級隔離、healed_ 電洞自癒以及 root_set PLP 原子快照保障系統零故障運行。',
    mechanismChain: {
      goal: '於 -55°C 至 125°C 極端環境及高能輻射單粒子翻轉下維持儲存完整性與硬體自癒',
      primitives: 'tilt-aligned-core_assembly + healed_slit-abstructed + root_set (PLP) + held-port_ascend-site',
      outcome: 'SEU 故障被嚴格限制於單一 Slit 隔離域，BER 經電洞退火與 LDPC ASIC 修復降低 2.4 個數量級',
    },
    params: {
      scenarioId: 'rad-hard-space',
      channelCount: 16,
      leasingLengthMb: 256,
      yPortDmaShare: 68,
      randomRead4kRatio: 52,
      partialLeadDepth: 76,
      subPageSuspendEnabled: true,
      asicOffloadRatio: 96,
      temperatureC: 108,
      tiltAngleDeg: 1.8,
      peCycles: 14500,
      selfHealingEnabled: true,
    },
  },
];

function deterministicNoise(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function computeSimulationMetrics(
  params: SimulationParams,
  injectedFaultDies: Record<string, 'seu' | 'wl-short'>,
  plpActive: boolean
): SimulationMetrics {
  const {
    channelCount,
    leasingLengthMb,
    yPortDmaShare,
    randomRead4kRatio,
    partialLeadDepth,
    subPageSuspendEnabled,
    asicOffloadRatio,
    temperatureC,
    tiltAngleDeg,
    peCycles,
    selfHealingEnabled,
  } = params;

  // 1. WAF calculation (Layer 1 FDP group-leasing_len + Layer 2 Y-port isolation)
  // Optimal leasing length aligns hot/cold lifetimes; very small or huge leasing has mild fragmentation,
  // while Y-port GC isolation cuts background write collisions.
  const optimalLeaseScore = 1 - Math.abs(Math.log2(leasingLengthMb) - 8) * 0.04; // sweet spot around 256-512MB
  const yPortBenefit = (yPortDmaShare - 50) * 0.0025;
  const writeLoadFactor = (100 - randomRead4kRatio) / 100;
  const wafRaw = 1.02 + (1 - optimalLeaseScore) * 0.45 + writeLoadFactor * 0.12 - yPortBenefit;
  const waf = Number(Math.max(1.01, Math.min(2.15, wafRaw)).toFixed(2));
  const wafBaseline = Number((2.35 + writeLoadFactor * 0.65).toFixed(2));

  // 2. Bandwidth & Y-Port Bifurcation (Layer 1 & 2)
  // PCIe Gen5/Gen6 per-channel effective rate ~0.88 GB/s up to ~14.4 GB/s bus ceiling
  const rawBusCeiling = Math.min(24.5, channelCount * 0.84);
  const readBoost = 1 + (randomRead4kRatio / 100) * 0.14;
  const tiltPenalty = Math.max(0.78, 1 - (tiltAngleDeg * 0.045));
  const effectiveBandwidthGbps = Number(
    (rawBusCeiling * (0.72 + (yPortDmaShare / 100) * 0.28) * readBoost * tiltPenalty).toFixed(2)
  );
  const dmaBandwidthGbps = Number((effectiveBandwidthGbps * (yPortDmaShare / 100)).toFixed(2));
  const gcIsolationBandwidthGbps = Number((effectiveBandwidthGbps - dmaBandwidthGbps).toFixed(2));

  // 3. Partial Lead tR Hiding & Suspend Latency (Layer 3 & 4)
  const trHiddenRatioPct = Number((partialLeadDepth * 0.92).toFixed(1));
  const baseP50 = 42 + (1 - partialLeadDepth / 100) * 28 + (tiltAngleDeg * 4.5);
  const p50LatencyUs = Number(Math.max(18, baseP50 - (channelCount >= 16 ? 7 : 0)).toFixed(1));

  const suspendMultiplier = subPageSuspendEnabled ? 0.34 : 1.0;
  const readContention = (randomRead4kRatio / 100) * 1.15;
  const p99BaselineUs = Number((185 + readContention * 210 + (100 - yPortDmaShare) * 4.2).toFixed(1));
  const p99LatencyUs = Number(
    Math.max(
      p50LatencyUs * 1.45,
      p99BaselineUs * (1 - (partialLeadDepth / 100) * 0.42) * (subPageSuspendEnabled ? 0.56 : 0.92)
    ).toFixed(1)
  );

  const p9999BaselineUs = Number((840 + readContention * 1240 + (peCycles / 30000) * 420).toFixed(0));
  const p9999LatencyUs = Number(
    Math.max(
      p99LatencyUs * 1.5,
      p9999BaselineUs * suspendMultiplier * (1 - (partialLeadDepth / 100) * 0.48)
    ).toFixed(0)
  );

  const suspendedOpsPerSec = subPageSuspendEnabled
    ? Math.round((randomRead4kRatio * 145) + (100 - yPortDmaShare) * 95)
    : 0;
  const subPageMutexConflictsPerK = Number(
    Math.max(0.2, (randomRead4kRatio / 100) * 18.4 * (subPageSuspendEnabled ? 0.18 : 1.0) * (16 / Math.max(8, channelCount))).toFixed(1)
  );

  // 4. ASIC Escalation (Layer 5) & Root Set PLP (Layer 6)
  const asicOffloadSavingPct = Number((asicOffloadRatio * 0.86).toFixed(1));
  const cpuUtilizationPct = Number(
    Math.max(6.5, 78 - asicOffloadRatio * 0.68 + (randomRead4kRatio * 0.14)).toFixed(1)
  );
  const plpHoldWindowMs = Number((4.8 + (channelCount * 0.08)).toFixed(2));
  const plpJournalFlushPct = plpActive
    ? Number(Math.min(100, 98.4 + (asicOffloadRatio * 0.016)).toFixed(2))
    : 100;

  // 5. Physical 3D NAND Tilt, BER & Self-Healing (Layer 7)
  // Thermal stress away from 40°C increases charge trap leakage; PE cycles & tilt degrade raw BER
  const tempDeviation = Math.abs(temperatureC - 40);
  const tempStress = (tempDeviation / 85) * 1.15;
  const wearStress = (peCycles / 30000) * 1.65;
  const tiltStress = tiltAngleDeg * 0.48;
  const injectedKeys = Object.keys(injectedFaultDies);
  const faultPenalty = Math.min(1.4, injectedKeys.length * 0.22);

  // Log10 BER: e.g. -6.2 is 6.3e-7, -2.5 is 3.16e-3 (critical!)
  const rawBerLog10 = Number(
    Math.max(-6.8, Math.min(-2.1, -6.1 + tempStress + wearStress + tiltStress + faultPenalty)).toFixed(2)
  );
  const healingGain = selfHealingEnabled ? 1.85 + (asicOffloadRatio / 100) * 0.55 : 0.15;
  const healedBerLog10 = Number(
    Math.max(-7.4, Math.min(-2.4, rawBerLog10 - healingGain)).toFixed(2)
  );

  const formatSciBer = (logVal: number) => {
    const exp = Math.floor(logVal);
    const mant = Math.pow(10, logVal - exp);
    return `${mant.toFixed(2)}×10^${exp}`;
  };

  const tiltCompensationPs = Number((tiltAngleDeg * 142 * (selfHealingEnabled ? 0.12 : 1.0)).toFixed(1));
  const enduranceGainFactor = Number(
    (selfHealingEnabled ? 1.85 + (1 / waf) * 0.45 : 1.0 + (1.5 / waf) * 0.2).toFixed(2)
  );

  // Build latency curve across percentiles
  const latencyCurve: LatencyPoint[] = [
    {
      percentile: 'P50',
      baselineUs: Number((p50LatencyUs * 1.68).toFixed(1)),
      optimizedUs: p50LatencyUs,
    },
    {
      percentile: 'P90',
      baselineUs: Number((p99BaselineUs * 0.58).toFixed(1)),
      optimizedUs: Number(((p50LatencyUs + p99LatencyUs) * 0.48).toFixed(1)),
    },
    {
      percentile: 'P99',
      baselineUs: p99BaselineUs,
      optimizedUs: p99LatencyUs,
    },
    {
      percentile: 'P99.9',
      baselineUs: Number((p9999BaselineUs * 0.62).toFixed(1)),
      optimizedUs: Number(((p99LatencyUs + p9999LatencyUs) * 0.54).toFixed(1)),
    },
    {
      percentile: 'P99.99',
      baselineUs: p9999BaselineUs,
      optimizedUs: p9999LatencyUs,
    },
  ];

  // Build 6-axis Spider Radar dimensions
  const wafScore = Math.round(Math.min(99, Math.max(20, (2.5 - waf) / 1.5 * 100)));
  const qosScore = Math.round(Math.min(99, Math.max(18, 100 - (p9999LatencyUs / 22))));
  const bwScore = Math.round(Math.min(99, Math.max(25, (effectiveBandwidthGbps / 24) * 100)));
  const asicScore = Math.round(Math.min(99, Math.max(15, asicOffloadRatio * 0.96)));
  const plpScore = Math.round(Math.min(99, Math.max(70, plpJournalFlushPct)));
  const healScore = Math.round(
    Math.min(99, Math.max(22, selfHealingEnabled ? ((-healedBerLog10 - 2.0) / 5.2) * 100 : 35))
  );

  const radarDimensions: RadarDimension[] = [
    { label: '寫入放大抑制 (1/WAF)', shortLabel: 'WAF 抑制', currentScore: wafScore, legacyScore: 42, unitNote: `WAF ${waf}` },
    { label: 'QoS 99.99% 確定性', shortLabel: '尾端 QoS', currentScore: qosScore, legacyScore: 34, unitNote: `${p9999LatencyUs} μs` },
    { label: '有效頻寬吞吐', shortLabel: '頻寬吞吐', currentScore: bwScore, legacyScore: 55, unitNote: `${effectiveBandwidthGbps} GB/s` },
    { label: 'ASIC 硬體卸載率', shortLabel: 'ASIC 卸載', currentScore: asicScore, legacyScore: 28, unitNote: `${asicOffloadRatio}%` },
    { label: 'PLP 根集合原子性', shortLabel: 'PLP 快照', currentScore: plpScore, legacyScore: 76, unitNote: `${plpHoldWindowMs} ms` },
    { label: '3D NAND 物理自癒', shortLabel: '物理自癒', currentScore: healScore, legacyScore: 30, unitNote: `${enduranceGainFactor}×` },
  ];

  // Build Channel x 4 Dies Matrix (display up to 16 channels cleanly or exact channelCount)
  const diesPerChannel = 4;
  const groups: DieCellState['reclaimGroup'][] = ['Hot-Stream', 'Warm-KV', 'Cold-Archive', 'PLP-SLC'];
  const dieMatrix: DieCellState[] = [];
  let isolatedFaultCount = 0;
  let healedBlockCount = 0;

  for (let ch = 0; ch < channelCount; ch++) {
    for (let d = 0; d < diesPerChannel; d++) {
      const id = `CH${ch.toString().padStart(2, '0')}-D${d}`;
      const faultType: DieCellState['faultType'] =
        (injectedFaultDies[id] as DieCellState['faultType'] | undefined) ?? 'none';
      const n = deterministicNoise(ch * 17 + d * 31 + Math.round(peCycles / 500));
      const baseWear = Math.min(98, Math.round((peCycles / 30000) * 78 + n * 16));
      const dieRawBer = Number((rawBerLog10 + (n - 0.5) * 0.5 + (faultType !== 'none' ? 1.4 : 0)).toFixed(2));
      const isolatedBySlit = faultType !== 'none';
      const healingActive = selfHealingEnabled && (faultType !== 'none' || dieRawBer > -4.6);
      const dieHealedBer = selfHealingEnabled
        ? Number((dieRawBer - (faultType !== 'none' ? 2.1 : 1.7)).toFixed(2))
        : dieRawBer;

      if (isolatedBySlit) isolatedFaultCount++;
      if (healingActive) healedBlockCount++;

      const suspendedErase =
        subPageSuspendEnabled &&
        randomRead4kRatio > 60 &&
        (ch + d) % 5 === 0 &&
        faultType === 'none';

      dieMatrix.push({
        channel: ch,
        die: d,
        id,
        reclaimGroup: plpActive && d === 3 ? 'PLP-SLC' : groups[(ch + d) % 3],
        wearPercent: baseWear,
        rawBerLog10: dieRawBer,
        healedBerLog10: dieHealedBer,
        faultType,
        isolatedBySlit,
        healingActive,
        suspendedErase,
        leasedLengthMb: leasingLengthMb,
      });
    }
  }

  return {
    waf,
    wafBaseline,
    p50LatencyUs,
    p99LatencyUs,
    p9999LatencyUs,
    p9999BaselineUs,
    trHiddenRatioPct,
    effectiveBandwidthGbps,
    dmaBandwidthGbps,
    gcIsolationBandwidthGbps,
    suspendedOpsPerSec,
    subPageMutexConflictsPerK,
    asicOffloadSavingPct,
    cpuUtilizationPct,
    plpHoldWindowMs,
    plpJournalFlushPct,
    tiltCompensationPs,
    rawBer: formatSciBer(rawBerLog10),
    healedBer: formatSciBer(healedBerLog10),
    rawBerLog10,
    healedBerLog10,
    isolatedFaultCount,
    healedBlockCount,
    enduranceGainFactor,
    latencyCurve,
    radarDimensions,
    dieMatrix,
  };
}
