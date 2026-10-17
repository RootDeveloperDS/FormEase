import React from 'react';
import { FolderArchive, Layers, LayoutGrid } from 'lucide-react';
import { useDossierStore } from '../../store/useDossierStore';
import { PresetSelector } from '../presets/PresetSelector';
import { ActionButton } from '../common/ActionButton';
import { FormEaseLogo } from '../common/FormEaseLogo';

interface HeaderProps {
  onOpenExportModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenExportModal }) => {
  const { activeMode, setMode, photoSlot, signatureSlot, documentSlot, sandboxQueue } =
    useDossierStore();

  const hasItems =
    activeMode === 'dossier'
      ? !!(photoSlot.processedBlob || signatureSlot.processedBlob || documentSlot.processedBlob)
      : sandboxQueue.length > 0;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
        {/* Brand & Identity */}
        <div className="flex items-center gap-2.5 shrink-0">
          <FormEaseLogo size={32} />
          <div className="flex items-center gap-2">
            <span className="text-base font-extrabold tracking-tight text-white">
              Form<span className="text-emerald-400">Ease</span>
            </span>
            <span className="inline-flex items-center text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 uppercase tracking-wider">
              v3.1
            </span>
            {/* <span className="hidden sm:inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-850 border border-slate-800 text-slate-400 uppercase tracking-wider">
              Client-Side
            </span> */}
          </div>
        </div>

        {/* Center: Mode Switcher Tabs */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-2xl border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setMode('dossier')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeMode === 'dossier'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Guided Dossier</span>
            <span className="sm:hidden">Slots</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('sandbox')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeMode === 'sandbox'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Batch Sandbox</span>
            <span className="sm:hidden">Batch</span>
          </button>
        </div>

        {/* Right: Controls & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Preset Selector */}
          {activeMode === 'dossier' && <PresetSelector />}


          {/* Master Export Button */}
          <ActionButton
            onClick={onOpenExportModal}
            disabled={!hasItems}
            variant="primary"
            size="sm"
            leftIcon={<FolderArchive className="w-4 h-4" />}
          >
            Export
          </ActionButton>
        </div>
      </div>
    </header>
  );
};
