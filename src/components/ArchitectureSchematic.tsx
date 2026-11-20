import React, { useState } from 'react';
import {
  ARCHITECTURE_LAYERS,
  LayerId,
  SimulationMetrics,
  SimulationParams,
} from '../data/ssdArchitecture';

interface ArchitectureSchematicProps {
  selectedLayerId: LayerId;
  hoveredLayerId: LayerId | null;
  params: SimulationParams;
  metrics: SimulationMetrics;
  isSimulating: boolean;
  plpActive: boolean;
  onSelectLayer: (id: LayerId) => void;
  onHoverLayer: (id: LayerId | null) => void;
}

export const ArchitectureSchematic: React.FC<ArchitectureSchematicProps> = ({
  selectedLayerId,
  hoveredLayerId,
  params,
  metrics,
  isSimulating,
  plpActive,
  onSelectLayer,
  onHoverLayer,
}) => {
  const [viewMode, setViewMode] = useState<'concentric' | 'cross-section'>('concentric');
  const [cursorCoord, setCursorCoord] = useState<{ x: number; y: number } | null>(null);

  const effectiveActiveId = hoveredLayerId ?? selectedLayerId;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 620);
    setCursorCoord({ x, y });
  };

  // Ring geometry for concentric 7-layer nested architecture (SVG viewBox 0 0 1000 620, center 500, 310)
  const cx = 500;
  const cy = 310;
  const layerRadii: Record<LayerId, { rx: number; ry: number }> = {
    7: { rx: 455, ry: 278 },
    6: { rx: 392, ry: 238 },
    5: { rx: 332, ry: 200 },
    4: { rx: 274, ry: 164 },
    3: { rx: 218, ry: 129 },
    2: { rx: 164, ry: 96 },
    1: { rx: 108, ry: 62 },
  };

  const flowClass = isSimulating ? 'animate-flow' : '';
  const fastFlowClass = isSimulating ? 'animate-flow-fast' : '';

  return (
    <section
      aria-label="SSD 7 層架構互動拓撲畫布"
      className="bg-[#0D121B] border border-slate-800 rounded-lg overflow-hidden flex flex-col"
    >
      {/* Canvas Stage Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-800 bg-[#0A0E16]">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-sm font-semibold text-slate-100 whitespace-nowrap">
            架構互動圖譜視口
          </h2>
          <span className="text-xs text-slate-500 hidden sm:inline">
            點擊任一嵌套層級或物理模組檢視映射狀態
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-0.5 bg-[#07090E] border border-slate-800 rounded-md">
            <button
              type="button"
              onClick={() => setViewMode('concentric')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                viewMode === 'concentric'
                  ? 'bg-slate-800 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              7 層嵌套拓撲
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cross-section')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                viewMode === 'cross-section'
                  ? 'bg-slate-800 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              訊號路徑與 3D NAND 剖面
            </button>
          </div>
        </div>
      </div>

      {/* Interactive SVG Canvas */}
      <div className="relative bg-[#07090E] select-none">
        {/* Precision Corner Telemetry HUD */}
        <div className="pointer-events-none absolute top-3 left-4 z-10 flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-400 tabular-nums">
          <span>
            ACTIVE LAYER: L{effectiveActiveId}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {plpActive
              ? '▲ PLP 電容放電原子寫入中'
              : metrics.isolatedFaultCount > 0
              ? `▲ SLIT 故障域隔離: ${metrics.isolatedFaultCount}`
              : '● 系統拓撲穩態'}
          </span>
          {cursorCoord && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-slate-500">
                X:{cursorCoord.x.toString().padStart(3, '0')} Y:{cursorCoord.y.toString().padStart(3, '0')}
              </span>
            </>
          )}
        </div>

        <div className="pointer-events-none absolute bottom-3 right-4 z-10 flex items-center gap-4 text-[11px] font-mono text-slate-400 tabular-nums">
          <span>M = {params.channelCount} Ch</span>
          <span>ℓₖ = {params.leasingLengthMb} MB</span>
          <span>Tilt = {params.tiltAngleDeg.toFixed(1)}°</span>
        </div>

        {viewMode === 'concentric' ? (
          <svg
            viewBox="0 0 1000 620"
            className="w-full h-auto block cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setCursorCoord(null)}
            role="img"
            aria-label="SSD 7 層同心嵌套架構互動圖"
          >
            <defs>
              <pattern id="labGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="#131B29"
                  strokeWidth="0.75"
                />
              </pattern>
              <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.14" />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Background Coordinate Grid */}
            <rect width="1000" height="620" fill="url(#labGrid)" />
            <circle cx={cx} cy={cy} r="280" fill="url(#coreGlow)" />

            {/* Coordinate Crosshair Axes */}
            <line x1="20" y1={cy} x2="980" y2={cy} stroke="#162032" strokeWidth="1" strokeDasharray="3 5" />
            <line x1={cx} y1="20" x2={cx} y2="600" stroke="#162032" strokeWidth="1" strokeDasharray="3 5" />

            {/* Render Nested Rings from Outer (7) to Inner (1) */}
            {[7, 6, 5, 4, 3, 2, 1].map((idNum) => {
              const id = idNum as LayerId;
              const layer = ARCHITECTURE_LAYERS.find((l) => l.id === id)!;
              const { rx, ry } = layerRadii[id];
              const isSelected = selectedLayerId === id;
              const isHovered = hoveredLayerId === id;
              const highlight = isSelected || isHovered;

              return (
                <g
                  key={id}
                  className="cursor-pointer"
                  onClick={() => onSelectLayer(id)}
                  onMouseEnter={() => onHoverLayer(id)}
                  onMouseLeave={() => onHoverLayer(null)}
                >
                  {/* Rounded Hardware Frame per Layer */}
                  <rect
                    x={cx - rx}
                    y={cy - ry}
                    width={rx * 2}
                    height={ry * 2}
                    rx={Math.max(12, Math.round(ry * 0.22))}
                    fill={
                      isSelected
                        ? `${layer.accentHex}14`
                        : isHovered
                        ? `${layer.accentHex}0D`
                        : '#090D15'
                    }
                    fillOpacity={isSelected || isHovered ? 1 : 0.72}
                    stroke={highlight ? layer.accentHex : '#1E293B'}
                    strokeWidth={isSelected ? 2 : isHovered ? 1.5 : 1}
                    strokeDasharray={id === 7 && metrics.isolatedFaultCount > 0 ? '8 4' : undefined}
                  />

                  {/* Layer Tag along top arc */}
                  <text
                    x={cx - rx + 18}
                    y={cy - ry + 18}
                    fill={highlight ? layer.accentHex : '#64748B'}
                    fontSize="11"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight={isSelected ? '700' : '500'}
                  >
                    L{id} · {layer.primitive.split('[')[0]}
                  </text>

                  {/* Math symbol on top-right corner of ring */}
                  <text
                    x={cx + rx - 18}
                    y={cy - ry + 18}
                    textAnchor="end"
                    fill={highlight ? layer.accentHex : '#475569'}
                    fontSize="11"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {layer.mathSymbol}
                  </text>
                </g>
              );
            })}

            {/* Layer 7 Physical Features: Slit Fault Isolation Trenches & Tilt Alignment Brackets */}
            <g className="pointer-events-none">
              {/* Slit isolation boundaries */}
              {[-280, -140, 140, 280].map((dx, idx) => (
                <line
                  key={idx}
                  x1={cx + dx}
                  y1={cy - 278}
                  x2={cx + dx + params.tiltAngleDeg * 8}
                  y2={cy - 246}
                  stroke={metrics.isolatedFaultCount > 0 ? '#F43F5E' : '#334155'}
                  strokeWidth={metrics.isolatedFaultCount > 0 ? 1.75 : 1}
                  strokeDasharray="3 2"
                />
              ))}
              {/* Self-Healing indicator badge inside L7 bottom */}
              <text
                x={cx}
                y={cy + 266}
                textAnchor="middle"
                fill={params.selfHealingEnabled ? '#10B981' : '#64748B'}
                fontSize="11"
                fontFamily="JetBrains Mono, monospace"
              >
                {params.selfHealingEnabled
                  ? `HEAL LOOP ACTIVE · TILT COMP ${metrics.tiltCompensationPs} ps · BER ${metrics.healedBer}`
                  : `SELF-HEAL BYPASSED · RAW BER ${metrics.rawBer}`}
              </text>
            </g>

            {/* Layer 6 PLP Capacitors & Root Set Nodes */}
            <g className="pointer-events-none">
              {[-360, 360].map((dx, idx) => (
                <g key={idx}>
                  <rect
                    x={cx + dx - 22}
                    y={cy - 18}
                    width="44"
                    height="36"
                    rx="4"
                    fill={plpActive ? '#F59E0B26' : '#0D1420'}
                    stroke={plpActive ? '#F59E0B' : '#10B981'}
                    strokeWidth={plpActive ? 1.8 : 1}
                  />
                  <text
                    x={cx + dx}
                    y={cy - 2}
                    textAnchor="middle"
                    fill={plpActive ? '#FCD34D' : '#34D399'}
                    fontSize="9.5"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="600"
                  >
                    PLP
                  </text>
                  <text
                    x={cx + dx}
                    y={cy + 11}
                    textAnchor="middle"
                    fill="#94A3B8"
                    fontSize="8.5"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {metrics.plpHoldWindowMs}ms
                  </text>
                </g>
              ))}
            </g>

            {/* Layer 5 Held-Port & ASIC Offload Escalation Bridge */}
            <g className="pointer-events-none">
              <rect
                x={cx + 185}
                y={cy + 148}
                width="132"
                height="34"
                rx="4"
                fill="#A78BFA18"
                stroke="#A78BFA"
                strokeWidth="1"
              />
              <text
                x={cx + 251}
                y={cy + 163}
                textAnchor="middle"
                fill="#C4B5FD"
                fontSize="9.5"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="600"
              >
                ASIC ESCALATION
              </text>
              <text
                x={cx + 251}
                y={cy + 176}
                textAnchor="middle"
                fill="#94A3B8"
                fontSize="9"
                fontFamily="JetBrains Mono, monospace"
              >
                Offload {params.asicOffloadRatio}% · CPU {metrics.cpuUtilizationPct}%
              </text>
            </g>

            {/* Layer 4 Sub-page Mutex & Erase Suspend Gate */}
            <g className="pointer-events-none">
              <rect
                x={cx - 260}
                y={cy + 124}
                width="148"
                height="28"
                rx="4"
                fill={params.subPageSuspendEnabled ? '#F59E0B1A' : '#0D1420'}
                stroke={params.subPageSuspendEnabled ? '#F59E0B' : '#475569'}
                strokeWidth="1"
              />
              <text
                x={cx - 186}
                y={cy + 142}
                textAnchor="middle"
                fill={params.subPageSuspendEnabled ? '#FBBF24' : '#64748B'}
                fontSize="9.5"
                fontFamily="JetBrains Mono, monospace"
              >
                {params.subPageSuspendEnabled
                  ? `SUSPEND: ${metrics.suspendedOpsPerSec} ops/s`
                  : 'SUSPEND: OFF'}
              </text>
            </g>

            {/* Layer 3 Partial Lead Speculative Vectors */}
            <g className="pointer-events-none">
              <path
                d={`M ${cx - 190} ${cy - 70} L ${cx - 120} ${cy - 34}`}
                stroke="#38BDF8"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                className={fastFlowClass}
              />
              <text
                x={cx - 196}
                y={cy - 76}
                fill="#38BDF8"
                fontSize="9.5"
                fontFamily="JetBrains Mono, monospace"
              >
                tR Hiding {metrics.trHiddenRatioPct}%
              </text>
            </g>

            {/* Layer 2 Y-Sculped Port Bifurcation Lines */}
            <g className="pointer-events-none">
              {/* Main DMA High-Throughput Branch */}
              <path
                d={`M ${cx - 164} ${cy} L ${cx - 108} ${cy} M ${cx + 108} ${cy} L ${cx + 164} ${cy}`}
                stroke="#06B6D4"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                className={fastFlowClass}
              />
              {/* Asymmetric GC / Metadata Isolation Branch */}
              <path
                d={`M ${cx} ${cy + 62} Q ${cx + 42} ${cy + 84} ${cx + 95} ${cy + 88}`}
                fill="none"
                stroke="#F59E0B"
                strokeWidth="1.75"
                strokeDasharray="4 4"
                className={flowClass}
              />
              <text
                x={cx + 102}
                y={cy + 91}
                fill="#F59E0B"
                fontSize="9.5"
                fontFamily="JetBrains Mono, monospace"
              >
                GC Isolation {metrics.gcIsolationBandwidthGbps} GB/s
              </text>
            </g>

            {/* Layer 1 Core: M-Channel FDP Pool Nodes */}
            <g
              className="cursor-pointer"
              onClick={() => onSelectLayer(1)}
              onMouseEnter={() => onHoverLayer(1)}
              onMouseLeave={() => onHoverLayer(null)}
            >
              {Array.from({ length: Math.min(16, params.channelCount) }).map((_, i) => {
                const cols = 8;
                const row = Math.floor(i / cols);
                const col = i % cols;
                const cellW = 18;
                const cellH = 12;
                const startX = cx - (cols * 21) / 2 + 1.5;
                const startY = cy - 16 + row * 17;
                const hasFault = metrics.dieMatrix.some(
                  (d) => d.channel === i && d.faultType !== 'none'
                );
                return (
                  <rect
                    key={i}
                    x={startX + col * 21}
                    y={startY}
                    width={cellW}
                    height={cellH}
                    rx="2"
                    fill={hasFault ? '#F43F5E' : i % 3 === 0 ? '#06B6D4' : '#1E293B'}
                    fillOpacity={hasFault ? 0.85 : i % 3 === 0 ? 0.45 : 0.85}
                    stroke={hasFault ? '#FDA4AF' : '#06B6D4'}
                    strokeWidth="0.75"
                  />
                );
              })}
              <text
                x={cx}
                y={cy + 36}
                textAnchor="middle"
                fill="#E2E8F0"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="600"
              >
                FDP {params.channelCount}Ch · WAF {metrics.waf}
              </text>
            </g>
          </svg>
        ) : (
          /* Mode 2: Signal Pipeline & 200+ Layer 3D NAND HARC Cross-Section */
          <svg
            viewBox="0 0 1000 620"
            className="w-full h-auto block cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setCursorCoord(null)}
            role="img"
            aria-label="SSD 資料路徑與 3D NAND 物理剖面圖"
          >
            <defs>
              <pattern id="labGridCross" width="40" height="40" patternUnits="userSpaceOnUse">
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="#131B29"
                  strokeWidth="0.75"
                />
              </pattern>
            </defs>
            <rect width="1000" height="620" fill="url(#labGridCross)" />

            {/* Top Section Label */}
            <text x="32" y="36" fill="#94A3B8" fontSize="11" fontFamily="JetBrains Mono, monospace">
              HOST INTERFACE (PCIe Gen5/Gen6 · CXL.mem / CXL.io) → CONTROLLER PIPELINE → 3D NAND MULTI-DECK STACK
            </text>

            {/* Block 1: Host + Held-Port (Layer 5) & Root Set PLP (Layer 6) */}
            <g
              className="cursor-pointer"
              onClick={() => onSelectLayer(5)}
              onMouseEnter={() => onHoverLayer(5)}
              onMouseLeave={() => onHoverLayer(null)}
            >
              <rect
                x="32"
                y="70"
                width="175"
                height="210"
                rx="6"
                fill={effectiveActiveId === 5 ? '#A78BFA1A' : '#0D1420'}
                stroke={effectiveActiveId === 5 ? '#A78BFA' : '#1E293B'}
                strokeWidth={effectiveActiveId === 5 ? 2 : 1}
              />
              <text x="46" y="94" fill="#C4B5FD" fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="700">
                L5 · held-port_ascend
              </text>
              <rect x="46" y="110" width="147" height="38" rx="4" fill="#07090E" stroke="#334155" />
              <text x="56" y="127" fill="#E2E8F0" fontSize="10" fontFamily="JetBrains Mono, monospace">
                NVMe SQ/CQ Doorbell
              </text>
              <text x="56" y="141" fill="#64748B" fontSize="9.5" fontFamily="JetBrains Mono, monospace">
                4K Read Load: {params.randomRead4kRatio}%
              </text>

              {/* ASIC Escalation Box */}
              <rect x="46" y="168" width="147" height="96" rx="4" fill="#A78BFA14" stroke="#A78BFA" strokeDasharray="3 2" />
              <text x="56" y="188" fill="#DDD6FE" fontSize="10" fontFamily="JetBrains Mono, monospace" fontWeight="600">
                ASIC 運算特權提升
              </text>
              <text x="56" y="206" fill="#94A3B8" fontSize="9.5" fontFamily="JetBrains Mono, monospace">
                LDPC Soft-Decode
              </text>
              <text x="56" y="222" fill="#94A3B8" fontSize="9.5" fontFamily="JetBrains Mono, monospace">
                Inline Crypto / CS
              </text>
              <text x="56" y="246" fill="#C4B5FD" fontSize="10" fontFamily="JetBrains Mono, monospace" fontWeight="600">
                卸載率: {params.asicOffloadRatio}%
              </text>
            </g>

            {/* Layer 6: Root Set & PLP Bar below Block 1 */}
            <g
              className="cursor-pointer"
              onClick={() => onSelectLayer(6)}
              onMouseEnter={() => onHoverLayer(6)}
              onMouseLeave={() => onHoverLayer(null)}
            >
              <rect
                x="32"
                y="302"
                width="390"
                height="96"
                rx="6"
                fill={plpActive ? '#F59E0B22' : effectiveActiveId === 6 ? '#10B9811A' : '#0D1420'}
                stroke={plpActive ? '#F59E0B' : effectiveActiveId === 6 ? '#10B981' : '#1E293B'}
                strokeWidth={effectiveActiveId === 6 || plpActive ? 2 : 1}
              />
              <text x="48" y="326" fill={plpActive ? '#FCD34D' : '#34D399'} fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="700">
                L6 · root_set[ L2P Global Root & PLP ]
              </text>
              <text x="48" y="348" fill="#CBD5E1" fontSize="10.5" fontFamily="JetBrains Mono, monospace">
                {plpActive
                  ? `▲ PLP 電容緊急供電中 · 剩餘保持窗口 ${metrics.plpHoldWindowMs} ms`
                  : `PLP 電容就緒 (${metrics.plpHoldWindowMs} ms Hold-up) · Journal 原子快照 ${metrics.plpJournalFlushPct}%`}
              </text>
              <text x="48" y="370" fill="#64748B" fontSize="10" fontFamily="JetBrains Mono, monospace">
                Namespace Root Tree ➔ 斷電瞬間刷入保留 SLC Cache
              </text>
            </g>

            {/* Block 2: Layer 3 (Partial Lead) & Layer 4 (Sub-page Lock Suspend) */}
            <g
              className="cursor-pointer"
              onClick={() => onSelectLayer(3)}
              onMouseEnter={() => onHoverLayer(3)}
              onMouseLeave={() => onHoverLayer(null)}
            >
              <rect
                x="244"
                y="70"
                width="178"
                height="98"
                rx="6"
                fill={effectiveActiveId === 3 ? '#38BDF81A' : '#0D1420'}
                stroke={effectiveActiveId === 3 ? '#38BDF8' : '#1E293B'}
                strokeWidth={effectiveActiveId === 3 ? 2 : 1}
              />
              <text x="258" y="94" fill="#38BDF8" fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="700">
                L3 · i-partial_lead
              </text>
              <text x="258" y="116" fill="#CBD5E1" fontSize="10" fontFamily="JetBrains Mono, monospace">
                超前擷取 Offset 預發 Read
              </text>
              <text x="258" y="136" fill="#38BDF8" fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="600">
                tR 隱藏率: {metrics.trHiddenRatioPct}%
              </text>
              <text x="258" y="154" fill="#94A3B8" fontSize="9.5" fontFamily="JetBrains Mono, monospace">
                P50: {metrics.p50LatencyUs} μs
              </text>
            </g>

            <g
              className="cursor-pointer"
              onClick={() => onSelectLayer(4)}
              onMouseEnter={() => onHoverLayer(4)}
              onMouseLeave={() => onHoverLayer(null)}
            >
              <rect
                x="244"
                y="182"
                width="178"
                height="98"
                rx="6"
                fill={effectiveActiveId === 4 ? '#F59E0B1A' : '#0D1420'}
                stroke={effectiveActiveId === 4 ? '#F59E0B' : '#1E293B'}
                strokeWidth={effectiveActiveId === 4 ? 2 : 1}
              />
              <text x="258" y="206" fill="#FBBF24" fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="700">
                L4 · i-lock_perspensed
              </text>
              <text x="258" y="226" fill="#CBD5E1" fontSize="10" fontFamily="JetBrains Mono, monospace">
                4KB Mutex · Erase Suspend
              </text>
              <text x="258" y="246" fill="#FBBF24" fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="600">
                P99.99: {metrics.p9999LatencyUs} μs
              </text>
              <text x="258" y="264" fill="#94A3B8" fontSize="9.5" fontFamily="JetBrains Mono, monospace">
                懸置搶占: {metrics.suspendedOpsPerSec} ops/s
              </text>
            </g>

            {/* Block 3: Layer 2 Y-Sculped Port Bifurcation */}
            <g
              className="cursor-pointer"
              onClick={() => onSelectLayer(2)}
              onMouseEnter={() => onHoverLayer(2)}
              onMouseLeave={() => onHoverLayer(null)}
            >
              <rect
                x="458"
                y="70"
                width="175"
                height="328"
                rx="6"
                fill={effectiveActiveId === 2 ? '#22D3EE14' : '#0D1420'}
                stroke={effectiveActiveId === 2 ? '#22D3EE' : '#1E293B'}
                strokeWidth={effectiveActiveId === 2 ? 2 : 1}
              />
              <text x="472" y="94" fill="#22D3EE" fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="700">
                L2 · Y-sculped_port
              </text>
              <text x="472" y="114" fill="#94A3B8" fontSize="9.5" fontFamily="JetBrains Mono, monospace">
                非對稱 I/O 流量分叉
              </text>

              {/* Y-Shape Bifurcation SVG Paths */}
              <path
                d="M 475 215 L 525 215 L 575 155 L 615 155"
                fill="none"
                stroke="#06B6D4"
                strokeWidth="3"
                strokeDasharray="6 4"
                className={fastFlowClass}
              />
              <path
                d="M 525 215 L 575 295 L 615 295"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2"
                strokeDasharray="5 4"
                className={flowClass}
              />
              <circle cx="525" cy="215" r="5" fill="#22D3EE" />

              <text x="476" y="142" fill="#22D3EE" fontSize="9.5" fontFamily="JetBrains Mono, monospace">
                DMA 連續讀寫引擎
              </text>
              <text x="476" y="178" fill="#E2E8F0" fontSize="10" fontFamily="JetBrains Mono, monospace">
                {metrics.dmaBandwidthGbps} GB/s ({params.yPortDmaShare}%)
              </text>

              <text x="476" y="325" fill="#FBBF24" fontSize="9.5" fontFamily="JetBrains Mono, monospace">
                後台 GC / Metadata
              </text>
              <text x="476" y="343" fill="#E2E8F0" fontSize="10" fontFamily="JetBrains Mono, monospace">
                {metrics.gcIsolationBandwidthGbps} GB/s ({100 - params.yPortDmaShare}%)
              </text>
            </g>

            {/* Connecting Signal Arrows */}
            <path d="M 207 120 L 244 120" stroke="#38BDF8" strokeWidth="2" strokeDasharray="4 3" className={fastFlowClass} />
            <path d="M 207 230 L 244 230" stroke="#F59E0B" strokeWidth="2" strokeDasharray="4 3" className={flowClass} />
            <path d="M 422 155 L 458 155" stroke="#06B6D4" strokeWidth="2" strokeDasharray="4 3" className={fastFlowClass} />
            <path d="M 422 230 L 458 230" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="4 3" className={flowClass} />

            {/* Block 4: Layer 1 (FDP Multi-Channel) + Layer 7 (3D NAND Multi-Deck HARC Cross Section) */}
            <g
              className="cursor-pointer"
              onClick={() => onSelectLayer(1)}
              onMouseEnter={() => onHoverLayer(1)}
              onMouseLeave={() => onHoverLayer(null)}
            >
              <rect
                x="668"
                y="70"
                width="300"
                height="136"
                rx="6"
                fill={effectiveActiveId === 1 ? '#06B6D41A' : '#0D1420'}
                stroke={effectiveActiveId === 1 ? '#06B6D4' : '#1E293B'}
                strokeWidth={effectiveActiveId === 1 ? 2 : 1}
              />
              <text x="684" y="94" fill="#06B6D4" fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="700">
                L1 · arch-io_asset()_group-leasing
              </text>
              <text x="684" y="114" fill="#CBD5E1" fontSize="10" fontFamily="JetBrains Mono, monospace">
                FDP Reclaim Groups ({params.channelCount} Channels)
              </text>
              {/* FDP Stream Bars */}
              {[
                { label: 'Hot Stream', color: '#06B6D4', w: 220 },
                { label: 'Warm KV', color: '#38BDF8', w: 175 },
                { label: 'Cold / PLP', color: '#10B981', w: 140 },
              ].map((stream, i) => (
                <g key={i} transform={`translate(684, ${126 + i * 24})`}>
                  <rect width="268" height="16" rx="2" fill="#07090E" stroke="#1E293B" />
                  <rect width={stream.w} height="16" rx="2" fill={stream.color} fillOpacity="0.35" />
                  <text x="8" y="11.5" fill="#E2E8F0" fontSize="9.5" fontFamily="JetBrains Mono, monospace">
                    {stream.label} · ℓₖ={params.leasingLengthMb}MB
                  </text>
                </g>
              ))}
            </g>

            {/* Layer 7: 3D NAND HARC Cross-Section */}
            <g
              className="cursor-pointer"
              onClick={() => onSelectLayer(7)}
              onMouseEnter={() => onHoverLayer(7)}
              onMouseLeave={() => onHoverLayer(null)}
            >
              <rect
                x="668"
                y="222"
                width="300"
                height="360"
                rx="6"
                fill={effectiveActiveId === 7 ? '#F43F5E14' : '#0D1420'}
                stroke={effectiveActiveId === 7 ? '#F43F5E' : '#1E293B'}
                strokeWidth={effectiveActiveId === 7 ? 2 : 1}
              />
              <text x="684" y="246" fill="#FDA4AF" fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="700">
                L7 · 200+L 3D NAND 物理剖面
              </text>
              <text x="684" y="264" fill="#94A3B8" fontSize="9.5" fontFamily="JetBrains Mono, monospace">
                HARC 傾斜 {params.tiltAngleDeg.toFixed(1)}° · Slit 隔離域 · 電洞退火
              </text>

              {/* Multi-Deck Wordline Layers */}
              {[0, 1, 2, 3, 4, 5, 6, 7].map((wl) => (
                <line
                  key={wl}
                  x1="686"
                  y1={290 + wl * 22}
                  x2="950"
                  y2={290 + wl * 22}
                  stroke={wl === 3 ? '#334155' : '#1E293B'}
                  strokeWidth={wl === 3 ? 2 : 1}
                  strokeDasharray={wl === 3 ? '6 3' : undefined}
                />
              ))}

              {/* Tilted HARC Channels (showing tiltAngleDeg dynamically!) */}
              {[0, 1, 2, 3, 4, 5].map((chIdx) => {
                const baseX = 710 + chIdx * 42;
                const tiltOffset = params.tiltAngleDeg * 14;
                const isFaultChannel = chIdx === 2 && metrics.isolatedFaultCount > 0;
                return (
                  <g key={chIdx}>
                    <line
                      x1={baseX}
                      y1="280"
                      x2={baseX + tiltOffset}
                      y2="464"
                      stroke={isFaultChannel ? '#F43F5E' : '#06B6D4'}
                      strokeWidth="4"
                      strokeOpacity={isFaultChannel ? 0.9 : 0.65}
                    />
                    {/* Tilt-aligned compensation vector */}
                    {params.tiltAngleDeg > 0.2 && (
                      <line
                        x1={baseX + tiltOffset}
                        y1="464"
                        x2={baseX}
                        y2="464"
                        stroke="#10B981"
                        strokeWidth="1.5"
                      />
                    )}
                  </g>
                );
              })}

              {/* Gate Line Slit Fault Isolation Trenches */}
              {[774, 858].map((slitX, idx) => (
                <g key={idx}>
                  <rect
                    x={slitX}
                    y="278"
                    width="6"
                    height="190"
                    fill="#07090E"
                    stroke={metrics.isolatedFaultCount > 0 ? '#F43F5E' : '#475569'}
                    strokeWidth="1"
                  />
                  <text
                    x={slitX + 3}
                    y="482"
                    textAnchor="middle"
                    fill="#94A3B8"
                    fontSize="8.5"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    SLIT
                  </text>
                </g>
              ))}

              {/* Self-Healing Readout Box */}
              <rect x="684" y="498" width="268" height="68" rx="4" fill="#07090E" stroke="#1E293B" />
              <text x="696" y="518" fill="#E2E8F0" fontSize="10" fontFamily="JetBrains Mono, monospace">
                Raw BER: {metrics.rawBer}
              </text>
              <text
                x="696"
                y="536"
                fill={params.selfHealingEnabled ? '#34D399' : '#94A3B8'}
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="600"
              >
                Healed BER: {metrics.healedBer}
              </text>
              <text x="696" y="554" fill="#64748B" fontSize="9.5" fontFamily="JetBrains Mono, monospace">
                {params.selfHealingEnabled
                  ? `電洞修復與 eFuse 啟用 · 壽命增益 ${metrics.enduranceGainFactor}×`
                  : '自我癒合迴路已旁路'}
              </text>
            </g>

            {/* Pipeline Connection to NAND */}
            <path d="M 633 155 L 668 155" stroke="#06B6D4" strokeWidth="2.5" strokeDasharray="5 3" className={fastFlowClass} />
            <path d="M 633 295 L 668 295" stroke="#F59E0B" strokeWidth="2" strokeDasharray="5 3" className={flowClass} />

            {/* Bottom Summary Legend inside Cross-Section */}
            <g transform="translate(32, 422)">
              <rect width="601" height="160" rx="6" fill="#0D1420" stroke="#1E293B" />
              <text x="16" y="26" fill="#E2E8F0" fontSize="11.5" fontWeight="600">
                全鏈路即時狀態轉移遙測 (End-to-End State Transfer)
              </text>
              <text x="16" y="52" fill="#94A3B8" fontSize="10.5" fontFamily="JetBrains Mono, monospace">
                1. FDP 租賃隔離: WAF {metrics.waf} (傳統無 FDP 基線: {metrics.wafBaseline})
              </text>
              <text x="16" y="76" fill="#94A3B8" fontSize="10.5" fontFamily="JetBrains Mono, monospace">
                2. Y-Port 雙路徑: 總有效頻寬 {metrics.effectiveBandwidthGbps} GB/s (DMA {metrics.dmaBandwidthGbps} + GC {metrics.gcIsolationBandwidthGbps})
              </text>
              <text x="16" y="100" fill="#94A3B8" fontSize="10.5" fontFamily="JetBrains Mono, monospace">
                3. Partial Lead + Suspend: QoS P99.99 = {metrics.p9999LatencyUs} μs (未最佳化基線: {metrics.p9999BaselineUs} μs)
              </text>
              <text x="16" y="124" fill="#94A3B8" fontSize="10.5" fontFamily="JetBrains Mono, monospace">
                4. Tilt 對齊與自癒: 時序補償殘差 {metrics.tiltCompensationPs} ps · 修復區塊 {metrics.healedBlockCount} Dies
              </text>
              <text x="16" y="146" fill="#64748B" fontSize="10" fontFamily="JetBrains Mono, monospace">
                溫度: {params.temperatureC}°C · P/E: {params.peCycles.toLocaleString()} cycles · Sub-page 鎖衝突: {metrics.subPageMutexConflictsPerK}/1k
              </text>
            </g>
          </svg>
        )}
      </div>
    </section>
  );
};
