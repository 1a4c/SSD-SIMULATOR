import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Zap,
  ShieldAlert,
  RotateCcw,
  Play,
  Pause,
} from 'lucide-react';
import {
  SCENARIO_PRESETS,
  ScenarioId,
  SimulationParams,
} from '../data/ssdArchitecture';

interface ControlSidebarProps {
  params: SimulationParams;
  isSimulating: boolean;
  plpActive: boolean;
  faultCount: number;
  onApplyScenario: (scenarioId: ScenarioId) => void;
  onUpdateParam: <K extends keyof SimulationParams>(
    key: K,
    value: SimulationParams[K]
  ) => void;
  onToggleSimulation: () => void;
  onTriggerPlp: () => void;
  onInjectRandomSeu: () => void;
  onResetFaults: () => void;
}

interface SliderRowProps {
  label: string;
  valueDisplay: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  hint?: string;
  onChange: (val: number) => void;
}

const SliderRow: React.FC<SliderRowProps> = ({
  label,
  valueDisplay,
  value,
  min,
  max,
  step = 1,
  hint,
  onChange,
}) => (
  <div className="space-y-1.5">
    <div className="flex items-baseline justify-between gap-2">
      <label className="text-xs font-medium text-slate-300">{label}</label>
      <span className="text-xs font-mono tabular-nums text-cyan-300 font-semibold">
        {valueDisplay}
      </span>
    </div>
    <input
      type="range"
      className="precision-slider w-full"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
    {hint && <p className="text-[11px] text-slate-500 leading-tight">{hint}</p>}
  </div>
);

export const ControlSidebar: React.FC<ControlSidebarProps> = ({
  params,
  isSimulating,
  plpActive,
  faultCount,
  onApplyScenario,
  onUpdateParam,
  onToggleSimulation,
  onTriggerPlp,
  onInjectRandomSeu,
  onResetFaults,
}) => {
  const [openGroups, setOpenGroups] = useState({
    ioPool: true,
    pipeline: true,
    physical: true,
  });

  const toggleGroup = (key: keyof typeof openGroups) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <aside
      aria-label="控制器參數與故障注入面板"
      className="w-full lg:w-[340px] shrink-0 bg-[#0D121B] border border-slate-800 rounded-lg p-4 space-y-5 self-start"
    >
      {/* Scenario Presets */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-slate-300 tracking-wide">
            01. 前沿落地場景預設
          </h2>
          <button
            type="button"
            onClick={onToggleSimulation}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded border border-slate-700 bg-[#07090E] text-slate-200 hover:border-cyan-500/60 hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isSimulating ? (
              <>
                <Pause className="w-3 h-3" aria-hidden="true" />
                <span>暫停脈衝</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3" aria-hidden="true" />
                <span>啟動脈衝</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-1.5">
          {SCENARIO_PRESETS.map((preset) => {
            const active = params.scenarioId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onApplyScenario(preset.id)}
                className={`text-left px-3 py-2 rounded-md border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-cyan-500 ${
                  active
                    ? 'bg-cyan-500/10 border-cyan-400/70 text-slate-100'
                    : 'bg-[#07090E] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold truncate">{preset.shortName}</span>
                  <span className="text-[11px] font-mono text-cyan-400/90 shrink-0">
                    {active ? '作用中' : '載入'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {preset.domainLabel}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-slate-800/80 pt-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-slate-300 tracking-wide">
            02. 即時異常與物理應力觸發
          </h2>
          <span className="text-[11px] font-mono tabular-nums text-slate-400">
            故障域: {faultCount}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onInjectRandomSeu}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md border border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
            <span>注入 SEU 故障</span>
          </button>

          <button
            type="button"
            onClick={onTriggerPlp}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              plpActive
                ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                : 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
            }`}
          >
            <Zap className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{plpActive ? 'PLP 放電快照中' : '模擬異常斷電'}</span>
          </button>
        </div>

        {faultCount > 0 && (
          <button
            type="button"
            onClick={onResetFaults}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-700 bg-[#07090E] text-slate-300 hover:text-white hover:border-slate-600 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" aria-hidden="true" />
            <span>清除注入故障與 eFuse 紀錄</span>
          </button>
        )}
      </div>

      {/* Group 1: Layers 1-2 */}
      <div className="border-t border-slate-800/80 pt-3">
        <button
          type="button"
          onClick={() => toggleGroup('ioPool')}
          className="w-full flex items-center justify-between py-1 text-xs font-semibold text-slate-200 hover:text-cyan-300 cursor-pointer"
        >
          <span>層級 1–2 · FDP 租賃與 Y 型分叉</span>
          {openGroups.ioPool ? (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {openGroups.ioPool && (
          <div className="mt-3 space-y-3.5">
            <SliderRow
              label="NAND 通道資產數量 (M)"
              valueDisplay={`${params.channelCount} Ch`}
              value={params.channelCount}
              min={4}
              max={32}
              step={4}
              hint="arch-io_asset() 平行通道數"
              onChange={(v) => onUpdateParam('channelCount', v)}
            />
            <SliderRow
              label="FDP 區塊租賃長度 (ℓₖ)"
              valueDisplay={`${params.leasingLengthMb} MB`}
              value={params.leasingLengthMb}
              min={64}
              max={1024}
              step={64}
              hint="group-leasing_len 冷熱生命週期隔離粒度"
              onChange={(v) => onUpdateParam('leasingLengthMb', v)}
            />
            <SliderRow
              label="Y-Port 前台 DMA 頻寬權重"
              valueDisplay={`${params.yPortDmaShare}% / ${100 - params.yPortDmaShare}% GC`}
              value={params.yPortDmaShare}
              min={50}
              max={90}
              step={2}
              hint="Y-sculped_port 讀寫 DMA 與後台 GC 物理隔離比例"
              onChange={(v) => onUpdateParam('yPortDmaShare', v)}
            />
            <SliderRow
              label="4K 隨機讀取負載強度"
              valueDisplay={`${params.randomRead4kRatio}%`}
              value={params.randomRead4kRatio}
              min={10}
              max={95}
              step={5}
              onChange={(v) => onUpdateParam('randomRead4kRatio', v)}
            />
          </div>
        )}
      </div>

      {/* Group 2: Layers 3-5 */}
      <div className="border-t border-slate-800/80 pt-3">
        <button
          type="button"
          onClick={() => toggleGroup('pipeline')}
          className="w-full flex items-center justify-between py-1 text-xs font-semibold text-slate-200 hover:text-cyan-300 cursor-pointer"
        >
          <span>層級 3–5 · 超前預取、懸置鎖與 ASIC</span>
          {openGroups.pipeline ? (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {openGroups.pipeline && (
          <div className="mt-3 space-y-3.5">
            <SliderRow
              label="i-partial_lead 超前預取深度"
              valueDisplay={`${params.partialLeadDepth}%`}
              value={params.partialLeadDepth}
              min={0}
              max={100}
              step={5}
              hint="L2P Offset 提前擷取與 tR 感測時間隱藏率"
              onChange={(v) => onUpdateParam('partialLeadDepth', v)}
            />

            <div className="flex items-center justify-between gap-3 py-1">
              <div>
                <div className="text-xs font-medium text-slate-300">
                  i-lock_perspensed 擦寫懸置
                </div>
                <div className="text-[11px] text-slate-500">
                  4KB 細粒度互斥鎖 + 高優先讀取搶占
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={params.subPageSuspendEnabled}
                onClick={() =>
                  onUpdateParam('subPageSuspendEnabled', !params.subPageSuspendEnabled)
                }
                className={`px-3 py-1.5 text-xs font-mono rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  params.subPageSuspendEnabled
                    ? 'bg-amber-500/15 border-amber-400/70 text-amber-300'
                    : 'bg-[#07090E] border-slate-700 text-slate-400'
                }`}
              >
                {params.subPageSuspendEnabled ? '啟用中' : '已停用'}
              </button>
            </div>

            <SliderRow
              label="ascend-site 硬體 ASIC 卸載率"
              valueDisplay={`${params.asicOffloadRatio}%`}
              value={params.asicOffloadRatio}
              min={0}
              max={100}
              step={5}
              hint="LDPC 軟解碼與運算儲存算子提升至專用 ASIC"
              onChange={(v) => onUpdateParam('asicOffloadRatio', v)}
            />
          </div>
        )}
      </div>

      {/* Group 3: Layers 6-7 */}
      <div className="border-t border-slate-800/80 pt-3">
        <button
          type="button"
          onClick={() => toggleGroup('physical')}
          className="w-full flex items-center justify-between py-1 text-xs font-semibold text-slate-200 hover:text-cyan-300 cursor-pointer"
        >
          <span>層級 6–7 · 3D NAND 應力與自癒閉環</span>
          {openGroups.physical ? (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {openGroups.physical && (
          <div className="mt-3 space-y-3.5">
            <SliderRow
              label="NAND 核心工作溫度"
              valueDisplay={`${params.temperatureC} °C`}
              value={params.temperatureC}
              min={-55}
              max={125}
              step={5}
              onChange={(v) => onUpdateParam('temperatureC', v)}
            />
            <SliderRow
              label="HARC 通道傾斜角度 (Tilt)"
              valueDisplay={`${params.tiltAngleDeg.toFixed(1)}°`}
              value={params.tiltAngleDeg}
              min={0}
              max={2.5}
              step={0.1}
              hint="200+ 層 Multi-Deck 蝕刻通道偏移量"
              onChange={(v) => onUpdateParam('tiltAngleDeg', v)}
            />
            <SliderRow
              label="累積 P/E 抹寫週期"
              valueDisplay={`${params.peCycles.toLocaleString()} cyc`}
              value={params.peCycles}
              min={100}
              max={30000}
              step={500}
              onChange={(v) => onUpdateParam('peCycles', v)}
            />

            <div className="flex items-center justify-between gap-3 py-1">
              <div>
                <div className="text-xs font-medium text-slate-300">
                  healed_ 電洞自癒與 Slit 隔離
                </div>
                <div className="text-[11px] text-slate-500">
                  局部熱載子退火與 eFuse 冗餘替換
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={params.selfHealingEnabled}
                onClick={() =>
                  onUpdateParam('selfHealingEnabled', !params.selfHealingEnabled)
                }
                className={`px-3 py-1.5 text-xs font-mono rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  params.selfHealingEnabled
                    ? 'bg-emerald-500/15 border-emerald-400/70 text-emerald-300'
                    : 'bg-[#07090E] border-slate-700 text-slate-400'
                }`}
              >
                {params.selfHealingEnabled ? '修復啟動' : '旁路關閉'}
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
