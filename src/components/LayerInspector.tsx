import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  ARCHITECTURE_LAYERS,
  LayerId,
  SimulationMetrics,
  SimulationParams,
} from '../data/ssdArchitecture';

interface LayerInspectorProps {
  selectedLayerId: LayerId;
  params: SimulationParams;
  metrics: SimulationMetrics;
  plpActive: boolean;
  onSelectLayer: (id: LayerId) => void;
}

export const LayerInspector: React.FC<LayerInspectorProps> = ({
  selectedLayerId,
  params,
  metrics,
  plpActive,
  onSelectLayer,
}) => {
  const layer = ARCHITECTURE_LAYERS.find((l) => l.id === selectedLayerId)!;

  const getLayerLiveReadouts = (id: LayerId): { label: string; value: string }[] => {
    switch (id) {
      case 1:
        return [
          { label: '並行通道資產 M', value: `${params.channelCount} Channels` },
          { label: 'FDP 租賃長度 ℓₖ', value: `${params.leasingLengthMb} MB` },
          { label: '即時寫入放大 WAF', value: `${metrics.waf} (基線 ${metrics.wafBaseline})` },
        ];
      case 2:
        return [
          { label: 'DMA 前台頻寬', value: `${metrics.dmaBandwidthGbps} GB/s (${params.yPortDmaShare}%)` },
          { label: 'GC/Meta 隔離頻寬', value: `${metrics.gcIsolationBandwidthGbps} GB/s` },
          { label: '匯流排總有效吞吐', value: `${metrics.effectiveBandwidthGbps} GB/s` },
        ];
      case 3:
        return [
          { label: '超前預取深度', value: `${params.partialLeadDepth}%` },
          { label: 'tR 感測隱藏率', value: `${metrics.trHiddenRatioPct}%` },
          { label: 'P50 讀取延遲', value: `${metrics.p50LatencyUs} μs` },
        ];
      case 4:
        return [
          { label: '擦寫懸置狀態', value: params.subPageSuspendEnabled ? '● 搶占啟用' : '○ 已停用' },
          { label: '懸置操作吞吐', value: `${metrics.suspendedOpsPerSec} ops/s` },
          { label: 'QoS P99.99 尾端延遲', value: `${metrics.p9999LatencyUs} μs` },
        ];
      case 5:
        return [
          { label: 'ASIC 硬體卸載率', value: `${params.asicOffloadRatio}%` },
          { label: '通用 CPU 負載', value: `${metrics.cpuUtilizationPct}%` },
          { label: '核心算力節省', value: `${metrics.asicOffloadSavingPct}%` },
        ];
      case 6:
        return [
          { label: 'PLP 電容保持窗口', value: `${metrics.plpHoldWindowMs} ms` },
          { label: 'Journal 原子快照', value: `${metrics.plpJournalFlushPct}%` },
          { label: '斷電保護狀態', value: plpActive ? '▲ 電容放電寫入 SLC' : '● 電容充飽待機' },
        ];
      case 7:
        return [
          { label: 'HARC 傾斜殘差', value: `${metrics.tiltCompensationPs} ps (${params.tiltAngleDeg.toFixed(1)}°)` },
          { label: '修復前 / 後 BER', value: `${metrics.rawBer} → ${metrics.healedBer}` },
          { label: 'Slit 隔離故障 / 壽命增益', value: `${metrics.isolatedFaultCount} 域 · ${metrics.enduranceGainFactor}×` },
        ];
    }
  };

  const liveReadouts = getLayerLiveReadouts(layer.id);

  return (
    <section
      aria-label="架構層級詳細檢視器"
      className="bg-[#0D121B] border border-slate-800 rounded-lg p-5 space-y-5"
    >
      {/* Layer Stepper Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/90 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-mono font-semibold" style={{ color: layer.accentHex }}>
              {layer.rankLabel}
            </span>
            <span aria-hidden="true">·</span>
            <span>{layer.subsystemName}</span>
          </div>
          <h3 className="text-lg font-semibold text-slate-100">
            {layer.title}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={layer.id === 1}
            onClick={() => onSelectLayer((layer.id - 1) as LayerId)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded border border-slate-700 bg-[#07090E] text-slate-300 hover:text-white hover:border-slate-600 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition-colors whitespace-nowrap shrink-0"
          >
            <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>往內層</span>
          </button>

          <div className="flex items-center gap-1 px-1.5 py-1 bg-[#07090E] border border-slate-800 rounded">
            {ARCHITECTURE_LAYERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectLayer(item.id)}
                className={`w-6 h-6 text-[11px] font-mono rounded transition-colors cursor-pointer ${
                  item.id === layer.id
                    ? 'bg-slate-800 text-white font-bold ring-1 ring-cyan-400/70'
                    : 'text-slate-500 hover:text-slate-200'
                }`}
                style={item.id === layer.id ? { color: item.accentHex } : undefined}
                aria-label={`跳至第 ${item.id} 層`}
              >
                L{item.id}
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={layer.id === 7}
            onClick={() => onSelectLayer((layer.id + 1) as LayerId)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded border border-slate-700 bg-[#07090E] text-slate-300 hover:text-white hover:border-slate-600 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition-colors whitespace-nowrap shrink-0"
          >
            <span>往外層</span>
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Primitive & Mapping Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#07090E] border border-slate-800/80 rounded-md p-3.5 space-y-1.5">
          <div className="text-[11px] font-mono text-slate-400">原語識別符 (Primitive)</div>
          <div className="font-mono text-sm font-semibold break-all" style={{ color: layer.accentHex }}>
            {layer.primitive}
          </div>
          <div className="text-[11px] font-mono text-slate-500 pt-1">
            數學算子: {layer.mathFullForm}
          </div>
        </div>

        <div className="bg-[#07090E] border border-slate-800/80 rounded-md p-3.5 space-y-1.5">
          <div className="text-[11px] font-mono text-slate-400">SSD 前沿架構映射</div>
          <div className="text-sm font-medium text-slate-100 leading-snug">
            {layer.ssdMapping}
          </div>
          <div className="text-[11px] text-slate-400 pt-1">
            核心不變量: {layer.keyInvariant}
          </div>
        </div>
      </div>

      {/* Live Telemetry for Selected Layer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {liveReadouts.map((ro, idx) => (
          <div
            key={idx}
            className="bg-[#07090E] border border-slate-800/80 rounded-md px-3.5 py-2.5"
          >
            <div className="text-[11px] text-slate-400">{ro.label}</div>
            <div className="text-sm font-mono font-semibold tabular-nums text-slate-100 mt-1">
              {ro.value}
            </div>
          </div>
        ))}
      </div>

      {/* Prose Summary & Mechanisms */}
      <div className="space-y-3">
        <p className="text-sm text-slate-300 leading-relaxed">{layer.summary}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {layer.mechanisms.map((mech, idx) => (
            <div
              key={idx}
              className="border-t border-slate-800/80 pt-2.5 space-y-1"
            >
              <div className="font-mono text-xs font-semibold text-slate-200">
                {mech.term}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{mech.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
