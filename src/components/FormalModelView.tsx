import React from 'react';
import {
  ARCHITECTURE_LAYERS,
  LayerId,
  SimulationMetrics,
  SimulationParams,
} from '../data/ssdArchitecture';

interface FormalModelViewProps {
  selectedLayerId: LayerId;
  params: SimulationParams;
  metrics: SimulationMetrics;
  onSelectLayer: (id: LayerId) => void;
}

export const FormalModelView: React.FC<FormalModelViewProps> = ({
  selectedLayerId,
  params,
  metrics,
  onSelectLayer,
}) => {
  const outputValueForLayer = (id: LayerId) => {
    switch (id) {
      case 1:
        return `M=${params.channelCount}, ℓₖ=${params.leasingLengthMb}MB → WAF ${metrics.waf}`;
      case 2:
        return `DMA ${metrics.dmaBandwidthGbps} GB/s · GC ${metrics.gcIsolationBandwidthGbps} GB/s`;
      case 3:
        return `tR Hiding ${metrics.trHiddenRatioPct}% · P50 ${metrics.p50LatencyUs} μs`;
      case 4:
        return `Suspend ${metrics.suspendedOpsPerSec} ops/s · P99.99 ${metrics.p9999LatencyUs} μs`;
      case 5:
        return `ASIC ${params.asicOffloadRatio}% · CPU ${metrics.cpuUtilizationPct}%`;
      case 6:
        return `PLP ${metrics.plpHoldWindowMs} ms · Journal ${metrics.plpJournalFlushPct}%`;
      case 7:
        return `Tilt ${metrics.tiltCompensationPs} ps · BER ${metrics.healedBer}`;
    }
  };

  return (
    <section
      aria-label="形式化狀態轉移與原語對照矩陣"
      className="bg-[#0D121B] border border-slate-800 rounded-lg overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-slate-800">
        <h2 className="text-base font-semibold text-slate-100">
          系統架構形式化對照表 (最內層 → 最外層)
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          每一層嵌套原語皆對應至具體的 SSD 控制器狀態轉移算子與即時數值輸出；點選任意列可同步聚焦結構圖譜。
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[780px]">
          <thead>
            <tr className="border-b border-slate-800 bg-[#0A0E16] text-[11px] font-mono text-slate-400">
              <th className="py-2.5 px-4 font-medium">層級</th>
              <th className="py-2.5 px-4 font-medium">原語語法 (Primitive)</th>
              <th className="py-2.5 px-4 font-medium">形式化算子</th>
              <th className="py-2.5 px-4 font-medium">SSD 前沿架構映射</th>
              <th className="py-2.5 px-4 font-medium text-right">即時狀態轉移輸出</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70 text-xs">
            {ARCHITECTURE_LAYERS.map((layer) => {
              const isSelected = layer.id === selectedLayerId;
              return (
                <tr
                  key={layer.id}
                  onClick={() => onSelectLayer(layer.id)}
                  className={`transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/10'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  <td className="py-3 px-4 font-mono whitespace-nowrap">
                    <span className="font-semibold" style={{ color: layer.accentHex }}>
                      L{layer.id}
                    </span>
                    <span className="text-slate-400 ml-2">{layer.title}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-200 whitespace-nowrap">
                    {layer.primitive}
                  </td>
                  <td
                    className="py-3 px-4 font-mono text-xs font-semibold whitespace-nowrap"
                    style={{ color: layer.accentHex }}
                  >
                    {layer.mathFullForm}
                  </td>
                  <td className="py-3 px-4 text-slate-300 max-w-md">
                    {layer.ssdMapping}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] tabular-nums text-right text-cyan-300 whitespace-nowrap">
                    {outputValueForLayer(layer.id)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
