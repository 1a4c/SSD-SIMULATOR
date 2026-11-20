import React, { useState } from 'react';
import {
  DieCellState,
  SimulationMetrics,
  SimulationParams,
} from '../data/ssdArchitecture';

interface TelemetryChartsProps {
  params: SimulationParams;
  metrics: SimulationMetrics;
  onToggleDieFault: (dieId: string) => void;
  showMatrixOnly?: boolean;
}

export const TelemetryCharts: React.FC<TelemetryChartsProps> = ({
  params,
  metrics,
  onToggleDieFault,
  showMatrixOnly = false,
}) => {
  const [hoveredCurveIdx, setHoveredCurveIdx] = useState<number | null>(null);
  const [selectedDie, setSelectedDie] = useState<DieCellState | null>(null);

  // Latency chart geometry (SVG 460 x 210)
  const chartW = 460;
  const chartH = 210;
  const padL = 48;
  const padR = 20;
  const padT = 18;
  const padB = 34;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const maxLat = Math.max(
    100,
    ...metrics.latencyCurve.map((p) => Math.max(p.baselineUs, p.optimizedUs))
  );
  const xForIdx = (i: number) =>
    padL + (i / Math.max(1, metrics.latencyCurve.length - 1)) * plotW;
  const yForVal = (v: number) => padT + plotH - (v / maxLat) * plotH;

  const baselinePath = metrics.latencyCurve
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xForIdx(i).toFixed(1)} ${yForVal(p.baselineUs).toFixed(1)}`)
    .join(' ');

  const optimizedPath = metrics.latencyCurve
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xForIdx(i).toFixed(1)} ${yForVal(p.optimizedUs).toFixed(1)}`)
    .join(' ');

  const areaPath = `${optimizedPath} L ${xForIdx(metrics.latencyCurve.length - 1).toFixed(1)} ${(padT + plotH).toFixed(1)} L ${xForIdx(0).toFixed(1)} ${(padT + plotH).toFixed(1)} Z`;

  // Spider radar geometry (SVG 300 x 235)
  const rCx = 150;
  const rCy = 118;
  const rMax = 74;
  const axes = metrics.radarDimensions;
  const angleForAxis = (idx: number) => (Math.PI * 2 * idx) / axes.length - Math.PI / 2;

  const polygonPoints = (scores: number[]) =>
    scores
      .map((s, idx) => {
        const a = angleForAxis(idx);
        const r = (s / 100) * rMax;
        return `${(rCx + r * Math.cos(a)).toFixed(1)},${(rCy + r * Math.sin(a)).toFixed(1)}`;
      })
      .join(' ');

  const currentDie =
    selectedDie
      ? metrics.dieMatrix.find((d) => d.id === selectedDie.id) ?? metrics.dieMatrix[0]
      : metrics.dieMatrix[0];

  const getDieCellColor = (die: DieCellState) => {
    if (die.faultType === 'wl-short') return 'bg-rose-500/80 border-rose-300 text-white';
    if (die.faultType === 'seu') return 'bg-amber-500/75 border-amber-300 text-slate-950';
    if (die.suspendedErase) return 'bg-amber-400/25 border-amber-400/60 text-amber-200';
    if (die.reclaimGroup === 'PLP-SLC') return 'bg-emerald-500/30 border-emerald-400/60 text-emerald-200';
    if (die.wearPercent > 70) return 'bg-cyan-500/20 border-cyan-500/40 text-cyan-200';
    return 'bg-[#0A101A] border-slate-800 text-slate-400 hover:border-cyan-500/60';
  };

  return (
    <div className="space-y-4">
      {/* 4-Column KPI Strip */}
      {!showMatrixOnly && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="bg-[#0D121B] border border-slate-800 rounded-lg p-4">
            <div className="text-xs text-slate-400">寫入放大係數 (WAF)</div>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-2xl font-mono font-bold tabular-nums text-slate-100">
                {metrics.waf.toFixed(2)}
              </span>
              <span className="text-xs font-mono text-slate-400">×</span>
            </div>
            <div className="text-[11px] font-mono tabular-nums text-emerald-400 mt-1">
              DELTA: -{(metrics.wafBaseline - metrics.waf).toFixed(2)} vs 無 FDP 基線
            </div>
          </div>

          <div className="bg-[#0D121B] border border-slate-800 rounded-lg p-4">
            <div className="text-xs text-slate-400">QoS 99.99% 尾端讀取延遲</div>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-2xl font-mono font-bold tabular-nums text-cyan-300">
                {metrics.p9999LatencyUs}
              </span>
              <span className="text-xs font-mono text-slate-400">μs</span>
            </div>
            <div className="text-[11px] font-mono tabular-nums text-cyan-400/90 mt-1">
              tR 隱藏 {metrics.trHiddenRatioPct}% · P50 {metrics.p50LatencyUs} μs
            </div>
          </div>

          <div className="bg-[#0D121B] border border-slate-800 rounded-lg p-4">
            <div className="text-xs text-slate-400">Y-Port 總有效吞吐頻寬</div>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-2xl font-mono font-bold tabular-nums text-slate-100">
                {metrics.effectiveBandwidthGbps.toFixed(2)}
              </span>
              <span className="text-xs font-mono text-slate-400">GB/s</span>
            </div>
            <div className="text-[11px] font-mono tabular-nums text-slate-400 mt-1">
              DMA {metrics.dmaBandwidthGbps} GB/s · GC {metrics.gcIsolationBandwidthGbps} GB/s
            </div>
          </div>

          <div className="bg-[#0D121B] border border-slate-800 rounded-lg p-4">
            <div className="text-xs text-slate-400">3D NAND 修復後位元錯誤率</div>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-2xl font-mono font-bold tabular-nums text-emerald-400">
                {metrics.healedBer}
              </span>
              <span className="text-xs font-mono text-slate-400">BER</span>
            </div>
            <div className="text-[11px] font-mono tabular-nums text-slate-400 mt-1">
              {params.selfHealingEnabled
                ? `原始 ${metrics.rawBer} · 壽命 ${metrics.enduranceGainFactor}×`
                : `自我修復旁路 · 原始 ${metrics.rawBer}`}
            </div>
          </div>
        </div>
      )}

      {/* Dual Charts: Latency Curve + Radar Calibration */}
      {!showMatrixOnly && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          {/* Latency Distribution Chart */}
          <div className="xl:col-span-7 bg-[#0D121B] border border-slate-800 rounded-lg p-4 flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">
                  03. QoS 尾端延遲與 tR 隱藏對比曲線
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  實線為啟用 i-partial_lead 與 i-lock_perspensed；虛線為傳統阻塞基線
                </p>
              </div>
              {hoveredCurveIdx !== null && (
                <div className="font-mono text-[11px] tabular-nums bg-[#07090E] border border-slate-800 rounded px-2.5 py-1 text-slate-200">
                  {metrics.latencyCurve[hoveredCurveIdx].percentile}:{' '}
                  <span className="text-cyan-300">
                    {metrics.latencyCurve[hoveredCurveIdx].optimizedUs} μs
                  </span>{' '}
                  / 基線{' '}
                  <span className="text-amber-400">
                    {metrics.latencyCurve[hoveredCurveIdx].baselineUs} μs
                  </span>
                </div>
              )}
            </div>

            <div className="w-full overflow-x-auto">
              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto min-w-[360px]">
                {/* Y-axis Gridlines */}
                {[0, 0.25, 0.5, 0.75, 1].map((t, idx) => {
                  const y = padT + plotH * (1 - t);
                  const val = Math.round(maxLat * t);
                  return (
                    <g key={idx}>
                      <line
                        x1={padL}
                        y1={y}
                        x2={chartW - padR}
                        y2={y}
                        stroke="#1E293B"
                        strokeWidth="0.75"
                      />
                      <text
                        x={padL - 8}
                        y={y + 3}
                        textAnchor="end"
                        fill="#64748B"
                        fontSize="9.5"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}

                <text
                  x="12"
                  y={padT + 8}
                  fill="#64748B"
                  fontSize="9"
                  fontFamily="JetBrains Mono, monospace"
                >
                  μs
                </text>

                {/* Optimized Area Fill */}
                <path d={areaPath} fill="#06B6D4" fillOpacity="0.12" />

                {/* Baseline Dashed Line */}
                <path
                  d={baselinePath}
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="1.75"
                  strokeDasharray="5 4"
                />

                {/* Optimized Solid Line */}
                <path d={optimizedPath} fill="none" stroke="#06B6D4" strokeWidth="2.25" />

                {/* Interactive Crosshair & Nodes */}
                {metrics.latencyCurve.map((pt, idx) => {
                  const x = xForIdx(idx);
                  const yOpt = yForVal(pt.optimizedUs);
                  const yBase = yForVal(pt.baselineUs);
                  const isHover = hoveredCurveIdx === idx;
                  return (
                    <g
                      key={pt.percentile}
                      className="cursor-crosshair"
                      onMouseEnter={() => setHoveredCurveIdx(idx)}
                      onMouseLeave={() => setHoveredCurveIdx(null)}
                    >
                      <rect
                        x={x - 28}
                        y={padT}
                        width="56"
                        height={plotH + padB}
                        fill="transparent"
                      />
                      {isHover && (
                        <line
                          x1={x}
                          y1={padT}
                          x2={x}
                          y2={padT + plotH}
                          stroke="#475569"
                          strokeWidth="1"
                          strokeDasharray="2 2"
                        />
                      )}
                      <circle
                        cx={x}
                        cy={yBase}
                        r={isHover ? 4.5 : 3}
                        fill="#07090E"
                        stroke="#F59E0B"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx={x}
                        cy={yOpt}
                        r={isHover ? 5 : 3.5}
                        fill="#06B6D4"
                        stroke="#07090E"
                        strokeWidth="1.5"
                      />
                      <text
                        x={x}
                        y={chartH - 12}
                        textAnchor="middle"
                        fill={isHover ? '#E2E8F0' : '#94A3B8'}
                        fontSize="10"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {pt.percentile}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* 6-Axis Spider Calibration Radar */}
          <div className="xl:col-span-5 bg-[#0D121B] border border-slate-800 rounded-lg p-4 flex flex-col">
            <div className="mb-2">
              <h3 className="text-sm font-semibold text-slate-100">
                04. 六維架構校準雷達圖
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                青色多邊形為當前配置；虛線為傳統單一佇列 SSD
              </p>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <svg viewBox="0 0 300 235" className="w-full max-w-[320px] h-auto">
                {/* Concentric Hexagonal Grids */}
                {[0.25, 0.5, 0.75, 1].map((scale, sIdx) => (
                  <polygon
                    key={sIdx}
                    points={axes
                      .map((_, idx) => {
                        const a = angleForAxis(idx);
                        const r = rMax * scale;
                        return `${(rCx + r * Math.cos(a)).toFixed(1)},${(rCy + r * Math.sin(a)).toFixed(1)}`;
                      })
                      .join(' ')}
                    fill="none"
                    stroke="#1E293B"
                    strokeWidth="0.75"
                  />
                ))}

                {/* Radial Axes */}
                {axes.map((axis, idx) => {
                  const a = angleForAxis(idx);
                  const x2 = rCx + rMax * Math.cos(a);
                  const y2 = rCy + rMax * Math.sin(a);
                  const lx = rCx + (rMax + 24) * Math.cos(a);
                  const ly = rCy + (rMax + 18) * Math.sin(a);
                  return (
                    <g key={axis.shortLabel}>
                      <line x1={rCx} y1={rCy} x2={x2} y2={y2} stroke="#1E293B" strokeWidth="0.75" />
                      <text
                        x={lx}
                        y={ly}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#94A3B8"
                        fontSize="9.5"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {axis.shortLabel}
                      </text>
                    </g>
                  );
                })}

                {/* Legacy Baseline Polygon */}
                <polygon
                  points={polygonPoints(axes.map((a) => a.legacyScore))}
                  fill="#64748B"
                  fillOpacity="0.1"
                  stroke="#64748B"
                  strokeWidth="1.25"
                  strokeDasharray="3 3"
                />

                {/* Current Active Polygon */}
                <polygon
                  points={polygonPoints(axes.map((a) => a.currentScore))}
                  fill="#06B6D4"
                  fillOpacity="0.22"
                  stroke="#06B6D4"
                  strokeWidth="2"
                />

                {/* Vertex Points */}
                {axes.map((axis, idx) => {
                  const a = angleForAxis(idx);
                  const r = (axis.currentScore / 100) * rMax;
                  return (
                    <circle
                      key={idx}
                      cx={rCx + r * Math.cos(a)}
                      cy={rCy + r * Math.sin(a)}
                      r="3"
                      fill="#22D3EE"
                    />
                  );
                })}
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Channel x Die Matrix Heatmap */}
      <section className="bg-[#0D121B] border border-slate-800 rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              05. 多通道 NAND Die 租賃群組與 Slit 隔離矩陣 ({params.channelCount} Channels × 4 Dies)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              點擊任一 Die 晶粒即可循環注入或清除故障（SEU 單粒子翻轉 / Wordline 短路），驗證 slit-abstructed 隔離與自癒機制
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-400">
            <span>● 正常租賃</span>
            <span className="text-amber-300">▲ 懸置 / SEU</span>
            <span className="text-rose-400">✖ WL 短路隔離</span>
            <span className="text-emerald-400">■ PLP SLC 保留區</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Matrix Grid */}
          <div className="lg:col-span-8 overflow-x-auto">
            <div
              className="grid gap-1.5 min-w-[460px]"
              style={{
                gridTemplateColumns: `repeat(${Math.min(8, params.channelCount)}, minmax(0, 1fr))`,
              }}
            >
              {metrics.dieMatrix.map((die) => (
                <button
                  key={die.id}
                  type="button"
                  onClick={() => {
                    onToggleDieFault(die.id);
                    setSelectedDie(die);
                  }}
                  onMouseEnter={() => setSelectedDie(die)}
                  className={`px-2 py-2 rounded border text-left transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-cyan-400 ${getDieCellColor(
                    die
                  )}`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-[10px] font-semibold">{die.id}</span>
                    <span className="font-mono text-[9.5px] tabular-nums">
                      {die.faultType === 'wl-short'
                        ? 'WL!'
                        : die.faultType === 'seu'
                        ? 'SEU'
                        : `${die.wearPercent}%`}
                    </span>
                  </div>
                  <div className="font-mono text-[9px] opacity-80 mt-0.5 truncate">
                    {die.reclaimGroup}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Die Telemetry Detail */}
          <div className="lg:col-span-4 bg-[#07090E] border border-slate-800 rounded-md p-3.5 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-mono text-xs font-semibold text-cyan-300">
                晶粒探針: {currentDie.id}
              </span>
              <span className="font-mono text-[11px] text-slate-400">
                {currentDie.reclaimGroup}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono tabular-nums">
              <div>
                <div className="text-[10.5px] text-slate-500">FDP 租賃長度</div>
                <div className="text-slate-200">{currentDie.leasedLengthMb} MB</div>
              </div>
              <div>
                <div className="text-[10.5px] text-slate-500">預估磨損度</div>
                <div className="text-slate-200">{currentDie.wearPercent}%</div>
              </div>
              <div>
                <div className="text-[10.5px] text-slate-500">原始 BER (Log10)</div>
                <div className="text-amber-300">10^{currentDie.rawBerLog10}</div>
              </div>
              <div>
                <div className="text-[10.5px] text-slate-500">修復後 BER (Log10)</div>
                <div className="text-emerald-400">10^{currentDie.healedBerLog10}</div>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-2 text-[11px] text-slate-300 space-y-1">
              <div>
                故障狀態:{' '}
                <span className="font-mono">
                  {currentDie.faultType === 'none'
                    ? '● 正常'
                    : currentDie.faultType === 'seu'
                    ? '▲ 單粒子翻轉 (SEU) · Slit 域隔離中'
                    : '✖ 字元線短路 · eFuse 重映射至 OP Spare'}
                </span>
              </div>
              <div>
                自我修復迴路:{' '}
                <span className="font-mono text-slate-400">
                  {currentDie.healingActive
                    ? '局部電洞注入退火作用中'
                    : '待機監測中'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
