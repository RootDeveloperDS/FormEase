import React, { useState } from 'react';
import { useDossierStore } from './store/useDossierStore';
import { usePresetStore } from './store/usePresetStore';
import { useNavigationStore } from './store/useNavigationStore';
import { useThemeStore } from './store/useThemeStore';
import { Header } from './components/layout/Header';
import { StepGuide } from './components/layout/StepGuide';
import { Footer } from './components/layout/Footer';
import { ModeTabBar } from './components/home/ModeTabBar';
import { DossierSlotsView } from './components/queue/DossierSlotsView';
import { SandboxQueueView } from './components/queue/SandboxQueueView';
import { PresetsPage } from './components/presets/PresetsPage';
import { AboutPage } from './components/about/AboutPage';
import { PresetSelector } from './components/presets/PresetSelector';
import { DossierExportModal } from './components/export/DossierExportModal';
import { Sparkles, ChevronDown } from 'lucide-react';

export const App: React.FC = () => {
  const { activeMode } = useDossierStore();
  const activePreset = usePresetStore((s) => s.getActivePreset());
  const { currentPage } = useNavigationStore();
  // Ensure theme store is active
  useThemeStore();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased selection:bg-primary/20 selection:text-primary transition-colors duration-200">
      {/* Universal Responsive Header */}
      <Header onOpenExportModal={() => setIsExportModalOpen(true)} />

      {/* Dynamic Multi-Route Content */}
      <div className="flex-1 flex flex-col">
        {currentPage === 'prepare' && (
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
            {/* High-Aura Problem-Targeting Hero Banner with Paper Grid checker pattern */}
            <div className="relative rounded-3xl bg-card border border-border p-6 sm:p-10 pt-8 sm:pt-11 shadow-card hover:shadow-lift overflow-hidden mt-1 transition-all">
              {/* FormEase Paper Grid Checker Pattern (28px graph lines with soft radial mask) */}
              <div
                className="paper-grid absolute inset-0 -z-0 opacity-60 dark:opacity-30 [mask-image:radial-gradient(ellipse_at_top,black,transparent_75%)] pointer-events-none"
                aria-hidden="true"
              />

              {/* Ambient Radial Glows */}
              <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-3xl space-y-4">
                {/* ONE Crisp Glowing Security Pill */}
                <div>
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-soft text-primary text-xs sm:text-sm font-semibold tracking-wide shadow-sm">
                    <Sparkles className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                    <span>No sign-up • Works offline • Free</span>
                  </span>
                </div>

                {/* Display Typography */}
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground font-display leading-[1.15]">
                  Your photos, <span className="text-primary">exactly</span> the size the form wants.
                </h1>

                {/* High-Converting, Direct Problem-Targeting Subtitle */}
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl font-normal">
                  NO more portal errors{' '}
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold text-rose-500 bg-rose-500/10 border border-rose-500/30 shadow-sm">
                    "File Exceeds 50 KB"
                  </span>{' '}
                  or{' '}
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold text-rose-500 bg-rose-500/10 border border-rose-500/30 shadow-sm">
                    "Wrong Photo Size"
                  </span>
                  . Just drop your phone camera photos, signatures, or documents. FormEase cleans up shadowy backgrounds to clean white, aligns face framing, and fits the exact size requirements right in your browser.
                </p>

                {/* Active Portal Badge & Instant Switcher Trigger */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-card border border-border text-xs text-foreground shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-primary font-semibold">Active Portal:</span>
                    <strong className="text-foreground font-bold">{activePreset.name}</strong>
                    <span className="text-border">•</span>
                    <span className="text-muted-foreground font-mono text-[11px]">{activePreset.authority}</span>
                  </div>

                  {/* 1-Click Fast Preset Selector Trigger */}
                  <PresetSelector
                    customTrigger={(open) => (
                      <button
                        type="button"
                        onClick={open}
                        className="px-3.5 py-2 rounded-2xl bg-muted hover:bg-card border border-border text-xs font-bold text-foreground flex items-center gap-1.5 shadow-sm hover:border-primary/40 transition-all"
                      >
                        <span>Change Target Form</span>
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* 3-Step Visual Progress Bar */}
            <StepGuide />

            {/* Mode Switcher: Guided Preset Dossier vs Many Files My Rules */}
            <ModeTabBar />

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
        )}

        {currentPage === 'presets' && <PresetsPage />}

        {currentPage === 'about' && <AboutPage />}
      </div>

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
