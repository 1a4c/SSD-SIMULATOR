import React from 'react';
import { Download } from 'lucide-react';
import { NavTabId } from '../data/ssdArchitecture';

interface TopBarProps {
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  onExportSnapshot: () => void;
}

const NAV_ITEMS: { id: NavTabId; label: string }[] = [
  { id: 'topology', label: '系統拓撲與剖面' },
  { id: 'formal', label: '形式化數學模型' },
  { id: 'scenarios', label: '前沿落地場景' },
  { id: 'matrix', label: '通道與物理矩陣' },
];

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onSelectTab,
  onExportSnapshot,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-3.5 bg-[#07090E]/95 backdrop-blur-sm border-b border-slate-800/90">
      {/* Zone 1: Single text element wordmark */}
      <button
        type="button"
        onClick={() => onSelectTab('topology')}
        className="text-base font-semibold tracking-tight text-slate-100 hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-cyan-500"
      >
        SSD 架構實驗室
      </button>

      {/* Zone 2: 4 concise single-line text nav links */}
      <nav className="hidden md:flex items-center gap-6" aria-label="主要檢視模式">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`relative py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-cyan-500 ${
                isActive
                  ? 'text-cyan-400'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              {item.label}
              {isActive && (
                <span className="absolute inset-x-0 -bottom-[15px] h-[2px] bg-cyan-400" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={onExportSnapshot}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
        >
          <Download className="w-3.5 h-3.5" aria-hidden="true" />
          <span>匯出快照</span>
        </button>
      </div>
    </header>
  );
};
