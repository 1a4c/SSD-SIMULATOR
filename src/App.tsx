import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ARCHITECTURE_LAYERS,
  LayerId,
  NavTabId,
  SCENARIO_PRESETS,
  ScenarioId,
  SimulationParams,
  computeSimulationMetrics,
} from './data/ssdArchitecture';
import { TopBar } from './components/TopBar';
import { FormalEquationBar } from './components/FormalEquationBar';
import { ControlSidebar } from './components/ControlSidebar';
import { ArchitectureSchematic } from './components/ArchitectureSchematic';
import { LayerInspector } from './components/LayerInspector';
import { TelemetryCharts } from './components/TelemetryCharts';
import { ScenarioShowcase } from './components/ScenarioShowcase';
import { FormalModelView } from './components/FormalModelView';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTabId>('topology');
  const [selectedLayerId, setSelectedLayerId] = useState<LayerId>(1);
  const [hoveredLayerId, setHoveredLayerId] = useState<LayerId | null>(null);
  const [params, setParams] = useState<SimulationParams>(SCENARIO_PRESETS[0].params);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [plpActive, setPlpActive] = useState<boolean>(false);
  const [injectedFaultDies, setInjectedFaultDies] = useState<Record<string, 'seu' | 'wl-short'>>({});
  const [noticeText, setNoticeText] = useState<string | null>(null);

  const metrics = useMemo(
    () => computeSimulationMetrics(params, injectedFaultDies, plpActive),
    [params, injectedFaultDies, plpActive]
  );

  // Auto-clear transient PLP discharge animation state after 3.5 seconds
  useEffect(() => {
    if (!plpActive) return;
    const timer = window.setTimeout(() => setPlpActive(false), 3500);
    return () => window.clearTimeout(timer);
  }, [plpActive]);

  // Auto-clear brief action notice
  useEffect(() => {
    if (!noticeText) return;
    const timer = window.setTimeout(() => setNoticeText(null), 2800);
    return () => window.clearTimeout(timer);
  }, [noticeText]);

  const handleApplyScenario = useCallback((scenarioId: ScenarioId) => {
    const preset = SCENARIO_PRESETS.find((s) => s.id === scenarioId);
    if (!preset) return;
    setParams(preset.params);
    setSelectedLayerId(preset.focusLayers[0]);
    if (scenarioId === 'rad-hard-space') {
      setInjectedFaultDies({ 'CH02-D1': 'seu', 'CH07-D2': 'wl-short' });
    } else {
      setInjectedFaultDies({});
    }
    setNoticeText(`已載入場景配置：${preset.shortName}`);
  }, []);

  const handleUpdateParam = useCallback(
    <K extends keyof SimulationParams>(key: K, value: SimulationParams[K]) => {
      setParams((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleTriggerPlp = useCallback(() => {
    setPlpActive(true);
    setSelectedLayerId(6);
    setNoticeText('已觸發異常斷電保護 (PLP)：root_set 正以電容殘餘電力原子寫入 SLC Cache');
  }, []);

  const handleInjectRandomSeu = useCallback(() => {
    const channels = params.channelCount;
    const existingCount = Object.keys(injectedFaultDies).length;
    const ch = (existingCount * 3 + 1) % channels;
    const d = (existingCount + 1) % 4;
    const id = `CH${ch.toString().padStart(2, '0')}-D${d}`;
    const type: 'seu' | 'wl-short' = existingCount % 2 === 0 ? 'seu' : 'wl-short';
    setInjectedFaultDies((prev) => ({ ...prev, [id]: type }));
    setSelectedLayerId(7);
    setNoticeText(
      `已於 ${id} 注入${type === 'seu' ? '單粒子翻轉 (SEU)' : '字元線短路'}，slit-abstructed 域級隔離已介入`
    );
  }, [params.channelCount, injectedFaultDies]);

  const handleToggleDieFault = useCallback((dieId: string) => {
    setInjectedFaultDies((prev) => {
      const current = prev[dieId];
      const next = { ...prev };
      if (!current) {
        next[dieId] = 'seu';
      } else if (current === 'seu') {
        next[dieId] = 'wl-short';
      } else {
        delete next[dieId];
      }
      return next;
    });
  }, []);

  const handleResetFaults = useCallback(() => {
    setInjectedFaultDies({});
    setPlpActive(false);
    setNoticeText('已清除所有注入故障域與 PLP 快照警報');
  }, []);

  const handleExportSnapshot = useCallback(() => {
    const payload = {
      exportedAt: new Date().toISOString(),
      formalExpression:
        'S_SSD = H_heal o A_align(R_root(E_ascend(L_suspend(P_lead(T_Y-port(U Lease(I_k, l_k)))))))',
      activeLayer: ARCHITECTURE_LAYERS.find((l) => l.id === selectedLayerId),
      parameters: params,
      injectedFaults: injectedFaultDies,
      telemetryMetrics: {
        waf: metrics.waf,
        wafBaseline: metrics.wafBaseline,
        p50LatencyUs: metrics.p50LatencyUs,
        p99LatencyUs: metrics.p99LatencyUs,
        p9999LatencyUs: metrics.p9999LatencyUs,
        trHiddenRatioPct: metrics.trHiddenRatioPct,
        effectiveBandwidthGbps: metrics.effectiveBandwidthGbps,
        asicOffloadSavingPct: metrics.asicOffloadSavingPct,
        plpHoldWindowMs: metrics.plpHoldWindowMs,
        rawBer: metrics.rawBer,
        healedBer: metrics.healedBer,
        enduranceGainFactor: metrics.enduranceGainFactor,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ssd-arch-snapshot-${params.scenarioId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setNoticeText('已匯出系統架構狀態與形式化遙測快照 (JSON)');
  }, [selectedLayerId, params, injectedFaultDies, metrics]);

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col">
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onExportSnapshot={handleExportSnapshot}
      />

      {/* Mobile Nav Strip (< md) */}
      <nav
        className="flex md:hidden items-center gap-1 overflow-x-auto px-4 py-2 border-b border-slate-800 bg-[#0A0E16]"
        aria-label="行動裝置檢視切換"
      >
        {(
          [
            { id: 'topology', label: '系統拓撲' },
            { id: 'formal', label: '形式化數學' },
            { id: 'scenarios', label: '落地場景' },
            { id: 'matrix', label: '物理矩陣' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap shrink-0 ${
              activeTab === tab.id
                ? 'bg-slate-800 text-cyan-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-4 space-y-4">
        {/* Hero / Header Summary & Formal Equation Bar */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1 max-w-3xl">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-100 [text-wrap:balance]">
              次世代 SSD 控制器 7 層嵌套架構與形式化狀態模擬儀表板
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              從最內層 FDP 多通道租賃到最外層 200+ 層 3D NAND 通道傾斜對齊、Slit 故障隔離與電洞自我修復的即時跨層級調校控制台。
            </p>
          </div>

          {noticeText && (
            <div
              role="status"
              className="text-xs font-mono text-cyan-300 bg-[#0D121B] border border-cyan-500/40 rounded-md px-3 py-1.5"
            >
              {noticeText}
            </div>
          )}
        </div>

        <FormalEquationBar
          selectedLayerId={selectedLayerId}
          hoveredLayerId={hoveredLayerId}
          onSelectLayer={setSelectedLayerId}
          onHoverLayer={setHoveredLayerId}
        />

        {/* Main Asymmetric Split Console */}
        <div className="flex flex-col lg:flex-row gap-4 items-start">
          <ControlSidebar
            params={params}
            isSimulating={isSimulating}
            plpActive={plpActive}
            faultCount={Object.keys(injectedFaultDies).length}
            onApplyScenario={handleApplyScenario}
            onUpdateParam={handleUpdateParam}
            onToggleSimulation={() => setIsSimulating((prev) => !prev)}
            onTriggerPlp={handleTriggerPlp}
            onInjectRandomSeu={handleInjectRandomSeu}
            onResetFaults={handleResetFaults}
          />

          <div className="flex-1 min-w-0 w-full space-y-4">
            {activeTab === 'topology' && (
              <>
                <ArchitectureSchematic
                  selectedLayerId={selectedLayerId}
                  hoveredLayerId={hoveredLayerId}
                  params={params}
                  metrics={metrics}
                  isSimulating={isSimulating}
                  plpActive={plpActive}
                  onSelectLayer={setSelectedLayerId}
                  onHoverLayer={setHoveredLayerId}
                />
                <LayerInspector
                  selectedLayerId={selectedLayerId}
                  params={params}
                  metrics={metrics}
                  plpActive={plpActive}
                  onSelectLayer={setSelectedLayerId}
                />
                <TelemetryCharts
                  params={params}
                  metrics={metrics}
                  onToggleDieFault={handleToggleDieFault}
                />
              </>
            )}

            {activeTab === 'formal' && (
              <>
                <FormalModelView
                  selectedLayerId={selectedLayerId}
                  params={params}
                  metrics={metrics}
                  onSelectLayer={setSelectedLayerId}
                />
                <LayerInspector
                  selectedLayerId={selectedLayerId}
                  params={params}
                  metrics={metrics}
                  plpActive={plpActive}
                  onSelectLayer={setSelectedLayerId}
                />
              </>
            )}

            {activeTab === 'scenarios' && (
              <>
                <ScenarioShowcase
                  activeScenarioId={params.scenarioId}
                  onApplyScenario={handleApplyScenario}
                  onInspectLayer={(lid) => {
                    setSelectedLayerId(lid);
                    setActiveTab('topology');
                  }}
                />
                <TelemetryCharts
                  params={params}
                  metrics={metrics}
                  onToggleDieFault={handleToggleDieFault}
                />
              </>
            )}

            {activeTab === 'matrix' && (
              <>
                <TelemetryCharts
                  params={params}
                  metrics={metrics}
                  onToggleDieFault={handleToggleDieFault}
                  showMatrixOnly={false}
                />
                <LayerInspector
                  selectedLayerId={selectedLayerId}
                  params={params}
                  metrics={metrics}
                  plpActive={plpActive}
                  onSelectLayer={setSelectedLayerId}
                />
              </>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800/80 py-4 px-6 mt-6">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>SSD 架構實驗室 · 7 層嵌套控制器與 3D NAND 物理層分析平台</span>
          <span className="font-mono text-[11px]">
            NVMe 2.1 FDP · PCIe Gen5/Gen6 · CXL.mem · 200+ Layer HARC 3D NAND
          </span>
        </div>
      </footer>
    </div>
  );
}
