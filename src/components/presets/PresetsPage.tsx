import React, { useRef, useState } from 'react';
import {
  Plus,
  Upload,
  Download,
  Copy,
  Pencil,
  Trash2,
  FileCheck,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { usePresetStore } from '../../store/usePresetStore';
import { useNavigationStore } from '../../store/useNavigationStore';
import { useDossierStore } from '../../store/useDossierStore';
import { DEFAULT_PRESETS } from '../../core/presets/defaultPresets';
import type { PortalPreset } from '../../core/presets/presetTypes';
import { CustomPresetModal } from './CustomPresetModal';

export const PresetsPage: React.FC = () => {
  const { customPresets, duplicateCustomPreset, deleteCustomPreset, setActivePreset, saveCustomPreset } =
    usePresetStore();
  const { navigateTo } = useNavigationStore();
  const { resetAllSlotCustomTargets, optimizeAllSlots } = useDossierStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<PortalPreset | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleUsePreset = async (id: string) => {
    resetAllSlotCustomTargets();
    setActivePreset(id);
    await optimizeAllSlots();
    navigateTo('prepare');
  };

  const handleDuplicate = (id: string) => {
    duplicateCustomPreset(id);
    showToast('Preset duplicated to "Saved by you"!');
  };

  const handleExportSingle = (preset: PortalPreset) => {
    const data = JSON.stringify(preset, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${preset.id}_preset.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported "${preset.name}" backup.`);
  };

  const handleExportAll = () => {
    const data = JSON.stringify(customPresets, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'FormEase_Custom_Presets.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('All custom presets backed up to JSON.');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          parsed.forEach((p) => saveCustomPreset(p));
          showToast(`Imported ${parsed.length} presets.`);
        } else if (parsed && parsed.name && parsed.slots) {
          saveCustomPreset(parsed);
          showToast(`Imported "${parsed.name}".`);
        } else {
          showToast('Invalid preset file format.');
        }
      } catch {
        showToast('Error reading preset file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const PresetCard: React.FC<{ preset: PortalPreset; isCustom?: boolean }> = ({
    preset,
    isCustom,
  }) => (
    <li className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-card hover:shadow-lift transition-all">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">
            <span>{preset.countryFlag}</span>
            <span>{preset.country}</span>
          </span>
          <span className="text-xs text-muted-foreground font-mono">{preset.authority}</span>
        </div>

        <h3 className="font-display text-lg font-bold text-foreground leading-snug">
          {preset.name}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2">{preset.description}</p>

        <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground border-t border-border/70 pt-2.5">
          {preset.slots.photo && (
            <li className="flex items-center justify-between gap-2">
              <span className="font-semibold text-foreground">Photo:</span>
              <span className="font-mono text-[11px]">
                &lt; {Math.round(preset.slots.photo.targetMaxBytes / 1024)} KB • {preset.slots.photo.width}×{preset.slots.photo.height} px
              </span>
            </li>
          )}
          {preset.slots.signature && (
            <li className="flex items-center justify-between gap-2">
              <span className="font-semibold text-foreground">Signature:</span>
              <span className="font-mono text-[11px]">
                &lt; {Math.round(preset.slots.signature.targetMaxBytes / 1024)} KB • {preset.slots.signature.aspectRatio}
              </span>
            </li>
          )}
          {preset.slots.document && (
            <li className="flex items-center justify-between gap-2">
              <span className="font-semibold text-foreground">Document:</span>
              <span className="font-mono text-[11px]">
                &lt; {Math.round(preset.slots.document.targetMaxBytes / 1024)} KB PDF
              </span>
            </li>
          )}
        </ul>
      </div>

      <div className="mt-3 pt-3 border-t border-border/70 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => handleUsePreset(preset.id)}
          className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1 shadow-sm hover:opacity-90 transition-all"
        >
          <span>Use Preset</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => handleDuplicate(preset.id)}
          className="px-2.5 py-1.5 rounded-xl border border-border bg-muted hover:bg-card text-foreground text-xs font-semibold flex items-center gap-1 transition-all"
          title="Duplicate to My Presets"
        >
          <Copy className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Duplicate</span>
        </button>

        {isCustom && (
          <>
            <button
              type="button"
              onClick={() => {
                setEditingPreset(preset);
                setIsModalOpen(true);
              }}
              className="px-2.5 py-1.5 rounded-xl border border-border bg-muted hover:bg-card text-foreground text-xs font-semibold flex items-center gap-1 transition-all"
              title="Edit preset"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Edit</span>
            </button>

            <button
              type="button"
              onClick={() => handleExportSingle(preset)}
              className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Download JSON backup"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Delete preset "${preset.name}"?`)) {
                  deleteCustomPreset(preset.id);
                  showToast('Preset deleted.');
                }
              }}
              className="p-1.5 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors ml-auto"
              title="Delete preset"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </li>
  );

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-2xl bg-card border border-border text-foreground text-xs font-bold shadow-lift flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-150">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header & Actions Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 border-b border-border pb-8">
        <div className="space-y-2 max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-foreground">
            My Presets & Rules Hub
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage custom rules for any government exam, job, or university portal.
            Saved privately in this browser — export backup files or share with colleagues.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-semibold text-xs flex items-center gap-1.5 shadow-card transition-all"
          >
            <Upload className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Import JSON</span>
          </button>

          <button
            type="button"
            onClick={handleExportAll}
            disabled={customPresets.length === 0}
            className="px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-semibold text-xs flex items-center gap-1.5 shadow-card transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Backup All</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingPreset(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Preset</span>
          </button>
        </div>
      </div>

      {/* Section 1: Saved By You */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-display text-foreground">
            Saved by You ({customPresets.length})
          </h2>
          <span className="text-xs text-muted-foreground">Stored locally in browser</span>
        </div>

        {customPresets.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {customPresets.map((p) => (
              <PresetCard key={p.id} preset={p} isCustom />
            ))}
          </ul>
        ) : (
          <div className="rounded-3xl border-2 border-dashed border-border p-10 text-center space-y-3 bg-card/50">
            <div className="w-12 h-12 rounded-2xl bg-muted text-muted-foreground mx-auto flex items-center justify-center">
              <FileCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display font-semibold text-foreground text-sm">No custom presets saved yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Create a custom preset from scratch, or click "Duplicate" on any official preset below to customize limits.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingPreset(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Your First Preset</span>
            </button>
          </div>
        )}
      </section>

      {/* Section 2: Official Form Presets */}
      <section className="space-y-4 pt-6 border-t border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-display text-foreground">
            Official Pre-Configured Presets ({DEFAULT_PRESETS.length})
          </h2>
          <span className="text-xs text-muted-foreground">Standardized government bounds</span>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DEFAULT_PRESETS.map((p) => (
            <PresetCard key={p.id} preset={p} />
          ))}
        </ul>
      </section>

      {/* Modal for creating / editing presets */}
      <CustomPresetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPreset(null);
        }}
        initialPreset={editingPreset || undefined}
      />
    </main>
  );
};
