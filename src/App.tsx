import React, { useState } from 'react';
import { useDossierStore } from './store/useDossierStore';
import { usePresetStore } from './store/usePresetStore';
import { Header } from './components/layout/Header';
import { StepGuide } from './components/layout/StepGuide';
import { Footer } from './components/layout/Footer';
import { DossierSlotsView } from './components/queue/DossierSlotsView';
import { SandboxQueueView } from './components/queue/SandboxQueueView';
import { DossierExportModal } from './components/export/DossierExportModal';
import { Sparkles, Shield, Zap, CheckCircle2 } from 'lucide-react';

export const App: React.FC = () => {
  const { activeMode } = useDossierStore();
  const activePreset = usePresetStore((s) => s.getActivePreset());
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-emerald-500 selection:text-slate-950">
      {/* Sovereign Header */}
      <Header onOpenExportModal={() => setIsExportModalOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Beginner-Friendly Hero Banner */}
        <div className="relative rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8 shadow-2xl overflow-hidden">
          {/* Subtle Glow backdrop */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Adaptive Near-Ceiling Sizing (92% - 98% Bracket Guarantee)</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Format, Cleanse & Bundle Application Documents in 3 Clicks
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              No more cryptic <span className="text-rose-400 font-mono font-semibold">"File Exceeds 50 KB"</span> portal rejections. Drop your raw photos, signatures, or certificates. FormEase bleaches ink shadows, normalizes official aspect ratios, and converges to the maximum allowable quality ceiling client-side.
            </p>

            {/* Micro Feature Badges */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-300 font-medium">
              <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Active Portal: <strong className="text-white">{activePreset.name}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span>100% Offline Canvas Sandbox</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
                <Zap className="w-3.5 h-3.5 text-yellow-400" />
                <span>One-Click Dossier (.ZIP) Bundle</span>
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
