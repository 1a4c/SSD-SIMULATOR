import React, { useState } from 'react';
import { ARCHITECTURE_LAYERS, LayerId } from '../data/ssdArchitecture';

interface FormalEquationBarProps {
  selectedLayerId: LayerId;
  hoveredLayerId: LayerId | null;
  onSelectLayer: (id: LayerId) => void;
  onHoverLayer: (id: LayerId | null) => void;
}

export const FormalEquationBar: React.FC<FormalEquationBarProps> = ({
  selectedLayerId,
  hoveredLayerId,
  onSelectLayer,
  onHoverLayer,
}) => {
  const [notationMode, setNotationMode] = useState<'math' | 'primitive'>('math');
  const activeLayer = ARCHITECTURE_LAYERS.find((l) => l.id === (hoveredLayerId ?? selectedLayerId))!;

  const tokenStyle = (layerId: LayerId) => {
    const isSelected = selectedLayerId === layerId;
    const isHovered = hoveredLayerId === layerId;
    const layer = ARCHITECTURE_LAYERS.find((l) => l.id === layerId)!;

    return {
      className: `inline-flex items-center px-1.5 py-0.5 rounded transition-colors cursor-pointer font-mono text-xs sm:text-sm whitespace-nowrap focus-visible:outline-2 focus-visible:outline-cyan-500 ${
        isSelected
          ? 'bg-slate-800 text-white ring-1 ring-cyan-400/70'
          : isHovered
          ? 'bg-slate-800/80 text-cyan-300'
          : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
      }`,
      style: isSelected || isHovered ? { color: layer.accentHex } : undefined,
      onClick: () => onSelectLayer(layerId),
      onMouseEnter: () => onHoverLayer(layerId),
      onMouseLeave: () => onHoverLayer(null),
    };
  };

  const renderParen = (layerId: LayerId, char: string) => {
    const active = selectedLayerId === layerId || hoveredLayerId === layerId;
    const layer = ARCHITECTURE_LAYERS.find((l) => l.id === layerId)!;
    return (
      <span
        className="font-mono text-xs sm:text-sm transition-colors select-none"
        style={{ color: active ? layer.accentHex : '#475569' }}
      >
        {char}
      </span>
    );
  };

  return (
    <section
      aria-label="系統架構形式化表達式"
      className="bg-[#0D121B] border border-slate-800 rounded-lg px-4 py-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="font-medium text-slate-200">形式化狀態轉移表達式</span>
          <span aria-hidden="true">·</span>
          <span>點擊任一算子或原語以定位對應架構層</span>
        </div>

        <div className="flex items-center gap-1 p-0.5 bg-[#07090E] border border-slate-800 rounded-md">
          <button
            type="button"
            onClick={() => setNotationMode('math')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              notationMode === 'math'
                ? 'bg-slate-800 text-cyan-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            數學算子表示
          </button>
          <button
            type="button"
            onClick={() => setNotationMode('primitive')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              notationMode === 'primitive'
                ? 'bg-slate-800 text-cyan-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            原語嵌套結構
          </button>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        {notationMode === 'math' ? (
          <div className="inline-flex items-center gap-0.5 py-1.5 px-2 bg-[#07090E] border border-slate-800/80 rounded-md min-w-max">
            <span className="font-mono text-xs sm:text-sm text-slate-400 mr-1.5 select-none">
              𝒮<sub className="text-[10px]">SSD</sub> =
            </span>
            <button type="button" {...tokenStyle(7)}>
              ℋ<sub className="text-[10px]">heal</sub> ∘ 𝒜<sub className="text-[10px]">align</sub>
            </button>
            {renderParen(7, '(')}
            <button type="button" {...tokenStyle(6)}>
              ℛ<sub className="text-[10px]">root</sub>
            </button>
            {renderParen(6, '(')}
            <button type="button" {...tokenStyle(5)}>
              ℰ<sub className="text-[10px]">ascend</sub>
            </button>
            {renderParen(5, '(')}
            <button type="button" {...tokenStyle(4)}>
              ℒ<sub className="text-[10px]">suspend</sub>
            </button>
            {renderParen(4, '(')}
            <button type="button" {...tokenStyle(3)}>
              𝒫<sub className="text-[10px]">lead</sub>
            </button>
            {renderParen(3, '(')}
            <button type="button" {...tokenStyle(2)}>
              𝒯<sub className="text-[10px]">Y-port</sub>
            </button>
            {renderParen(2, '(')}
            <button type="button" {...tokenStyle(1)}>
              ⋃<sub className="text-[10px]">k=1..M</sub> Lease(ℐ<sub className="text-[10px]">k</sub>, ℓ<sub className="text-[10px]">k</sub>)
            </button>
            {renderParen(2, ')')}
            {renderParen(3, ')')}
            {renderParen(4, ')')}
            {renderParen(5, ')')}
            {renderParen(6, ')')}
            {renderParen(7, ')')}
          </div>
        ) : (
          <div className="inline-flex items-center gap-1 py-1.5 px-2 bg-[#07090E] border border-slate-800/80 rounded-md min-w-max">
            <button type="button" {...tokenStyle(7)}>
              healed_slit-abstructed_tilt-aligned-core_assembly
            </button>
            {renderParen(7, '[')}
            <button type="button" {...tokenStyle(6)}>
              root_set
            </button>
            {renderParen(6, '[')}
            <button type="button" {...tokenStyle(5)}>
              held-port_ascend-site
            </button>
            {renderParen(5, '[')}
            <button type="button" {...tokenStyle(4)}>
              i-lock_perspensed
            </button>
            {renderParen(4, '[')}
            <button type="button" {...tokenStyle(3)}>
              i-partial_lead
            </button>
            {renderParen(3, '[')}
            <button type="button" {...tokenStyle(2)}>
              Y-sculped_port
            </button>
            {renderParen(2, '[')}
            <button type="button" {...tokenStyle(1)}>
              arch-io_asset()_group-leasing_len
            </button>
            {renderParen(2, ']')}
            {renderParen(3, ']')}
            {renderParen(4, ']')}
            {renderParen(5, ']')}
            {renderParen(6, ']')}
            {renderParen(7, ']')}
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="font-mono font-semibold shrink-0"
            style={{ color: activeLayer.accentHex }}
          >
            {activeLayer.rankLabel}
          </span>
          <span aria-hidden="true">·</span>
          <span className="text-slate-200 truncate">{activeLayer.mathSummary}</span>
        </div>
        <span className="font-mono text-[11px] text-slate-500 shrink-0">
          {activeLayer.primitive}
        </span>
      </div>
    </section>
  );
};
