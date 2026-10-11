import React, { useState } from 'react';
import { X, Plus, Save, Download, Upload, Trash2, Copy, Sliders } from 'lucide-react';
import { usePresetStore } from '../../store/usePresetStore';
import type { PortalPreset, OutputFormat } from '../../core/presets/presetTypes';
import { ActionButton } from '../common/ActionButton';

interface CustomPresetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomPresetModal: React.FC<CustomPresetModalProps> = ({ isOpen, onClose }) => {
  const { customPresets, saveCustomPreset, deleteCustomPreset, duplicateCustomPreset, exportPresetsJson, importPresetsJson, setActivePreset } = usePresetStore();

  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  const [name, setName] = useState('');
  const [photoMaxKB, setPhotoMaxKB] = useState(50);
  const [photoMinKB, setPhotoMinKB] = useState(20);
  const [photoWidth, setPhotoWidth] = useState(350);
  const [photoHeight, setPhotoHeight] = useState(350);
  const [photoRatio, setPhotoRatio] = useState('1:1');
  const [photoFormat, setPhotoFormat] = useState<OutputFormat>('image/jpeg');

  const [hasSignature, setHasSignature] = useState(true);
  const [sigMaxKB, setSigMaxKB] = useState(20);
  const [sigMinKB, setSigMinKB] = useState(10);
  const [sigRatio, setSigRatio] = useState('2:1');

  const [hasDocument, setHasDocument] = useState(false);
  const [docMaxKB, setDocMaxKB] = useState(200);
  const [docGrayscale, setDocGrayscale] = useState(true);
  const [docFormat, setDocFormat] = useState<OutputFormat>('application/pdf');

  const [importError, setImportError] = useState('');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const presetId = `custom_${Date.now()}`;
    const newPreset: PortalPreset = {
      id: presetId,
      name: name.trim(),
      country: 'CUSTOM',
      countryFlag: '⚙️',
      authority: 'User Custom Preset',
      category: 'general',
      description: `Custom: Photo < ${photoMaxKB} KB${hasSignature ? `, Signature < ${sigMaxKB} KB` : ''}${hasDocument ? `, Doc < ${docMaxKB} KB` : ''}`,
      isCustom: true,
      slots: {
        photo: {
          id: `${presetId}-photo`,
          type: 'photo',
          title: 'Custom Photo Target',
          description: `Max ${photoMaxKB} KB • ${photoWidth}×${photoHeight} px • ${photoRatio}`,
          targetMaxBytes: photoMaxKB * 1024,
          targetMinBytes: photoMinKB > 0 ? photoMinKB * 1024 : undefined,
          width: photoWidth,
          height: photoHeight,
          aspectRatio: photoRatio,
          aspectRatioValue: photoWidth / photoHeight,
          allowedFormats: [photoFormat],
          defaultFormat: photoFormat,
          biometricOverlay: true,
        },
        ...(hasSignature
          ? {
              signature: {
                id: `${presetId}-sig`,
                type: 'signature',
                title: 'Custom Signature Target',
                description: `Max ${sigMaxKB} KB • ${sigRatio} Ratio`,
                targetMaxBytes: sigMaxKB * 1024,
                targetMinBytes: sigMinKB > 0 ? sigMinKB * 1024 : undefined,
                width: 360,
                height: sigRatio === '2:1' ? 180 : 360,
                aspectRatio: sigRatio,
                aspectRatioValue: sigRatio === '2:1' ? 2.0 : 1.0,
                allowedFormats: ['image/jpeg'],
                defaultFormat: 'image/jpeg',
              },
            }
          : {}),
        ...(hasDocument
          ? {
              document: {
                id: `${presetId}-doc`,
                type: 'document',
                title: 'Custom Document Target',
                description: `Max ${docMaxKB} KB • ${docFormat === 'application/pdf' ? 'PDF' : 'JPEG'}`,
                targetMaxBytes: docMaxKB * 1024,
                width: 1200,
                height: 1600,
                aspectRatio: 'Free',
                aspectRatioValue: 1200 / 1600,
                allowedFormats: [docFormat],
                defaultFormat: docFormat,
                isGrayscaleDoc: docGrayscale,
              },
            }
          : {}),
      },
    };

    saveCustomPreset(newPreset);
    setActivePreset(presetId);
    setName('');
    onClose();
  };

  const handleExportJson = () => {
    const jsonStr = exportPresetsJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FormEase_Presets_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError('');
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importPresetsJson(content);
      if (!success) {
        setImportError('Invalid preset JSON file format');
      } else {
        setActiveTab('manage');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="preset-builder-title"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 id="preset-builder-title" className="text-base font-bold text-slate-100">
                Custom Preset Manager & Builder
              </h2>
              <p className="text-xs text-slate-400">
                Define exact file bounds and save to browser localStorage
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-800 bg-slate-950/20 px-5 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'create'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-4 h-4" /> Create New Preset
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manage')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'manage'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Saved Presets ({customPresets.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'create' ? (
            <form onSubmit={handleSave} className="space-y-5">
              {/* Preset Name */}
              <div>
                <label htmlFor="preset-name" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Preset Profile Name
                </label>
                <input
                  id="preset-name"
                  type="text"
                  required
                  placeholder="e.g. State Scholarship Portal 2026, MIT Application, etc."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus-visible:ring-2 focus-visible:ring-emerald-400"
                />
              </div>

              {/* Photo Constraints */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  Slot 1: Photograph Constraints
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Max Ceiling (KB)</label>
                    <input
                      type="number"
                      min="5"
                      max="10000"
                      value={photoMaxKB}
                      onChange={(e) => setPhotoMaxKB(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Min Floor (KB)</label>
                    <input
                      type="number"
                      min="0"
                      max={photoMaxKB}
                      value={photoMinKB}
                      onChange={(e) => setPhotoMinKB(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Aspect Ratio</label>
                    <select
                      value={photoRatio}
                      onChange={(e) => {
                        const r = e.target.value;
                        setPhotoRatio(r);
                        if (r === '1:1') { setPhotoWidth(500); setPhotoHeight(500); }
                        else if (r === '35:45') { setPhotoWidth(350); setPhotoHeight(450); }
                        else if (r === '4:3') { setPhotoWidth(600); setPhotoHeight(450); }
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                    >
                      <option value="1:1">1:1 Square</option>
                      <option value="35:45">35:45 Passport</option>
                      <option value="4:3">4:3 Standard</option>
                      <option value="Free">Freeform</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Output Format</label>
                    <select
                      value={photoFormat}
                      onChange={(e) => setPhotoFormat(e.target.value as OutputFormat)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                    >
                      <option value="image/jpeg">JPEG (Standard)</option>
                      <option value="image/png">PNG</option>
                      <option value="image/webp">WebP</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Signature Constraints */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                    Slot 2: Signature Constraints
                  </span>
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasSignature}
                      onChange={(e) => setHasSignature(e.target.checked)}
                      className="rounded accent-emerald-500"
                    />
                    Include Signature Slot
                  </label>
                </div>
                {hasSignature && (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Max Ceiling (KB)</label>
                      <input
                        type="number"
                        value={sigMaxKB}
                        onChange={(e) => setSigMaxKB(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Min Floor (KB)</label>
                      <input
                        type="number"
                        value={sigMinKB}
                        onChange={(e) => setSigMinKB(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Proportion</label>
                      <select
                        value={sigRatio}
                        onChange={(e) => setSigRatio(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                      >
                        <option value="2:1">2:1 Official</option>
                        <option value="1:1">1:1 Square</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Document Constraints */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">
                    Slot 3: Document / Marksheet Constraints
                  </span>
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasDocument}
                      onChange={(e) => setHasDocument(e.target.checked)}
                      className="rounded accent-emerald-500"
                    />
                    Include Document Slot
                  </label>
                </div>
                {hasDocument && (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Max Ceiling (KB)</label>
                      <input
                        type="number"
                        value={docMaxKB}
                        onChange={(e) => setDocMaxKB(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Output Format</label>
                      <select
                        value={docFormat}
                        onChange={(e) => setDocFormat(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                      >
                        <option value="application/pdf">PDF Document</option>
                        <option value="image/jpeg">JPEG Image</option>
                      </select>
                    </div>
                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={docGrayscale}
                          onChange={(e) => setDocGrayscale(e.target.checked)}
                          className="rounded accent-emerald-500"
                        />
                        Grayscale Desaturate
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-medium"
                >
                  Cancel
                </button>
                <ActionButton type="submit" variant="primary" leftIcon={<Save className="w-4 h-4" />}>
                  Save & Apply Preset
                </ActionButton>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  Presets are stored in browser localStorage and persist across restarts.
                </div>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" /> Import JSON
                    <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
                  </label>
                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Export JSON
                  </button>
                </div>
              </div>

              {importError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                  {importError}
                </div>
              )}

              {customPresets.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  No custom presets saved yet. Switch to "Create New Preset" to configure your first profile.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {customPresets.map((preset) => (
                    <div
                      key={preset.id}
                      className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-sm font-bold text-slate-100">{preset.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{preset.description}</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setActivePreset(preset.id);
                            onClose();
                          }}
                          className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-semibold"
                        >
                          Select
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicateCustomPreset(preset.id)}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteCustomPreset(preset.id)}
                          className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:bg-rose-500/20"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
