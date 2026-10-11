import React, { useState } from 'react';
import { ShieldCheck, Sparkles, FolderArchive, Layers, LayoutGrid } from 'lucide-react';
import { useDossierStore } from '../../store/useDossierStore';
import { useOfflineTelemetry } from '../../hooks/useOfflineTelemetry';
import { PresetSelector } from '../presets/PresetSelector';
import { ActionButton } from '../common/ActionButton';

interface HeaderProps {
  onOpenExportModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenExportModal }) => {
  const { activeMode, setMode, loadDemoDossier, photoSlot, signatureSlot, documentSlot, sandboxQueue } = useDossierStore();
  const { isFullyOffline, requestCount } = useOfflineTelemetry();
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

  const hasItems =
    activeMode === 'dossier'
      ? !!(photoSlot.processedBlob || signatureSlot.processedBlob || documentSlot.processedBlob)
      : sandboxQueue.length > 0;

  const handleDemoClick = async () => {
    setIsLoadingDemo(true);
    try {
      await loadDemoDossier();
    } catch (err) {
      console.error('Failed to load demo dossier:', err);
    } finally {
      setIsLoadingDemo(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20 font-black text-xl tracking-tighter">
            FE
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-white">
                FormEase
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 uppercase tracking-widest">
                Dossier Engine
              </span>
            </div>
            <div className="text-[11px] text-slate-400 hidden sm:block">
              Zero-Knowledge Biometric & Application Prep
            </div>
          </div>
        </div>

        {/* Mode Switcher Tabs (Guided Slots vs Multi-Batch) */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setMode('dossier')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeMode === 'dossier'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Guided</span> Dossier Slots
          </button>

          <button
            type="button"
            onClick={() => setMode('sandbox')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeMode === 'sandbox'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Multi-Batch</span> Sandbox
          </button>
        </div>

        {/* Controls, Telemetry & Export Actions */}
        <div className="flex items-center gap-2.5">
          {/* Preset Selector (in Dossier mode) */}
          {activeMode === 'dossier' && <PresetSelector />}

          {/* Try Demo Files Button */}
          <button
            type="button"
            onClick={handleDemoClick}
            disabled={isLoadingDemo}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30 transition-all hover:scale-102"
            title="Load instant test photos, signature, and certificate"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline">Try Demo Documents</span>
            <span className="md:hidden">Demo</span>
          </button>

          {/* Sovereign Privacy Monitor Badge */}
          <div
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300"
            title="FormEase processes 100% locally in browser memory. No files are uploaded to any server."
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isFullyOffline ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isFullyOffline ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </span>
            <span className="text-emerald-400 font-bold">{requestCount} Network Requests</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Sovereign Sandbox
            </span>
          </div>

          {/* Master Export Button */}
          <ActionButton
            onClick={onOpenExportModal}
            disabled={!hasItems}
            variant="primary"
            size="sm"
            leftIcon={<FolderArchive className="w-4 h-4" />}
          >
            Export Dossier
          </ActionButton>
        </div>
      </div>
    </header>
  );
};
