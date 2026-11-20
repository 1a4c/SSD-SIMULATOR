import React from 'react';
import { Check, ArrowRight } from 'lucide-react';
import {
  ARCHITECTURE_LAYERS,
  LayerId,
  SCENARIO_PRESETS,
  ScenarioId,
} from '../data/ssdArchitecture';

interface ScenarioShowcaseProps {
  activeScenarioId: ScenarioId;
  onApplyScenario: (id: ScenarioId) => void;
  onInspectLayer: (layerId: LayerId) => void;
}

export const ScenarioShowcase: React.FC<ScenarioShowcaseProps> = ({
  activeScenarioId,
  onApplyScenario,
  onInspectLayer,
}) => {
  return (
    <section aria-label="前沿開發落地場景" className="space-y-4">
      <div className="bg-[#0D121B] border border-slate-800 rounded-lg p-5">
        <h2 className="text-base font-semibold text-slate-100">
          三大前沿開發落地場景與機制收益鏈
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          每一項商業與極端環境落地場景皆對應一組嵌套原語的精準組合。點選場景配置可即時重載系統參數並觀察各層級指標變化。
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          {SCENARIO_PRESETS.map((preset, idx) => {
            const isActive = preset.id === activeScenarioId;
            return (
              <div
                key={preset.id}
                className={`rounded-lg border p-4 flex flex-col justify-between gap-4 transition-colors ${
                  isActive
                    ? 'bg-cyan-500/8 border-cyan-400/70'
                    : 'bg-[#07090E] border-slate-800'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-cyan-400">
                      0{idx + 1}. {preset.shortName}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      重點層級: {preset.focusLayers.map((l) => `L${l}`).join(' · ')}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-100 leading-snug">
                    {preset.name}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {preset.targetDescription}
                  </p>

                  {/* Mechanism-to-Outcome Chain */}
                  <div className="border-t border-slate-800/80 pt-3 space-y-2 text-xs">
                    <div>
                      <span className="text-slate-500">核心目標: </span>
                      <span className="text-slate-200">{preset.mechanismChain.goal}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">關鍵原語: </span>
                      <span className="font-mono text-[11px] text-cyan-300">
                        {preset.mechanismChain.primitives}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">量化收益: </span>
                      <span className="text-emerald-400 font-medium">
                        {preset.mechanismChain.outcome}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {preset.focusLayers.map((lid) => {
                      const layerSpec = ARCHITECTURE_LAYERS.find((l) => l.id === lid)!;
                      return (
                        <button
                          key={lid}
                          type="button"
                          onClick={() => onInspectLayer(lid)}
                          className="text-[11px] font-mono px-2 py-1 rounded border border-slate-800 bg-[#0D121B] text-slate-300 hover:border-cyan-500/60 hover:text-cyan-300 transition-colors cursor-pointer"
                        >
                          L{lid} {layerSpec.mathSymbol}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => onApplyScenario(preset.id)}
                    className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-cyan-400 text-slate-950 font-semibold'
                        : 'bg-slate-800 text-slate-100 hover:bg-slate-700'
                    }`}
                  >
                    {isActive ? (
                      <>
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>目前運行中配置</span>
                      </>
                    ) : (
                      <>
                        <span>套用此場景配置</span>
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
