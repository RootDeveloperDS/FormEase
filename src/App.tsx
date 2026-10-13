import React, { useState } from 'react';
import { useDossierStore } from './store/useDossierStore';
import { usePresetStore } from './store/usePresetStore';
import { Header } from './components/layout/Header';
import { StepGuide } from './components/layout/StepGuide';
import { Footer } from './components/layout/Footer';
import { DossierSlotsView } from './components/queue/DossierSlotsView';
import { SandboxQueueView } from './components/queue/SandboxQueueView';
import { DossierExportModal } from './components/export/DossierExportModal';
import { Zap } from 'lucide-react';

export const App: React.FC = () => {
  const { activeMode } = useDossierStore();
  const activePreset = usePresetStore((s) => s.getActivePreset());
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-emerald-500 selection:text-slate-950">
      {/* Sovereign Header */}
      <Header onOpenExportModal={() => setIsExportModalOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* High-Aura Problem-Targeting Hero Banner */}
        <div className="relative rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/90 p-6 sm:p-10 pt-8 sm:pt-11 shadow-2xl overflow-hidden mt-1">
          {/* Subtle Ambient Radial Glow backdrop */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            {/* ONE Crisp Glowing Security Pill (properly padded, never clipped) */}
            <div>
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wide shadow-sm shadow-emerald-500/10 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">
                <Zap className="w-3.5 h-3.5 fill-emerald-400/30" />
                <span>⚡ 100% Offline • Zero Data Leaves Your Device</span>
              </span>
            </div>

            {/* Display Typography */}
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#F8FAFC] leading-[1.15]">
              Format, Cleanse & Bundle Application Documents in 3 Clicks
            </h1>

            {/* High-Converting, Direct Problem-Targeting Subtitle */}
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl font-normal">
              NO more portal errors {' '}
              <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold text-rose-300 bg-rose-500/20 border border-rose-500/40 shadow-sm shadow-rose-500/20">
                "File Exceeds 50 KB"
              </span>{' '}
              or{' '}
              <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold text-rose-300 bg-rose-500/20 border border-rose-500/40 shadow-sm shadow-rose-500/20">
                "Wrong Photo Size"
              </span>
              . Just drop your phone camera photos, signatures, or documents. FormEase cleans up shadowy backgrounds to clean white, aligns face framing, and fits the exact size requirements right in your browser.
            </p>

            {/* Active Portal Badge */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 font-semibold">Active Portal:</span>
                <strong className="text-white font-bold">{activePreset.name}</strong>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400 font-mono text-[11px]">{activePreset.authority}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3-Step Visual Progress Bar */}
        <StepGuide />

        {/* Workspaces: Mode A (Guided Dossier Slots) vs Mode B (Multi-Batch Sandbox) */}
        {activeMode === 'dossier' ? (
          <section aria-label="Guided application dossier workspace">
            <DossierSlotsView />
          </section>
        ) : (
          <section aria-label="Multi-batch sandbox workspace">
            <SandboxQueueView onOpenExportModal={() => setIsExportModalOpen(true)} />
          </section>
        )}
      </main>

      {/* Pre-Flight Export Modal */}
      <DossierExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      {/* Accessible Footer */}
      <Footer />
    </div>
  );
};

export default App;
