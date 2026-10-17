import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Save, Download, Upload, Trash2, Copy, Sliders } from 'lucide-react';
import { usePresetStore } from '../../store/usePresetStore';
import { useDossierStore } from '../../store/useDossierStore';
import type { PortalPreset, OutputFormat } from '../../core/presets/presetTypes';
import { ActionButton } from '../common/ActionButton';

interface CustomPresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPreset?: PortalPreset | null;
}

export const CustomPresetModal: React.FC<CustomPresetModalProps> = ({ isOpen, onClose, initialPreset }) => {
  const { customPresets, saveCustomPreset, deleteCustomPreset, duplicateCustomPreset, exportPresetsJson, importPresetsJson, setActivePreset } = usePresetStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
  const [sigWidth, setSigWidth] = useState(280);
  const [sigHeight, setSigHeight] = useState(120);
  const [sigRatio, setSigRatio] = useState('2:1');

  const [hasDocument, setHasDocument] = useState(false);
  const [docMaxKB, setDocMaxKB] = useState(300);
  const [docWidth, setDocWidth] = useState(1200);
  const [docHeight, setDocHeight] = useState(1600);
  const [docRatio, setDocRatio] = useState('Free');
  const [docGrayscale, setDocGrayscale] = useState(true);
  const [docFormat, setDocFormat] = useState<OutputFormat>('application/pdf');

  const [importError, setImportError] = useState('');

  // Dynamically initialize form inputs from initialPreset OR currently active preset & active slots
  useEffect(() => {
    if (isOpen) {
      if (initialPreset) {
        setName(initialPreset.name);
        const pSlot = initialPreset.slots.photo;
        if (pSlot) {
          setPhotoMaxKB(Math.round(pSlot.targetMaxBytes / 1024));
          setPhotoMinKB(pSlot.targetMinBytes ? Math.round(pSlot.targetMinBytes / 1024) : 0);
          setPhotoWidth(pSlot.width || 350);
          setPhotoHeight(pSlot.height || 350);
          setPhotoRatio(pSlot.aspectRatio || '1:1');
          setPhotoFormat(pSlot.defaultFormat || 'image/jpeg');
        }
        const sSlot = initialPreset.slots.signature;
        setHasSignature(!!sSlot);
        if (sSlot) {
          setSigMaxKB(Math.round(sSlot.targetMaxBytes / 1024));
          setSigMinKB(sSlot.targetMinBytes ? Math.round(sSlot.targetMinBytes / 1024) : 0);
          setSigWidth(sSlot.width || 280);
          setSigHeight(sSlot.height || 120);
          setSigRatio(sSlot.aspectRatio || '2:1');
        }
        const dSlot = initialPreset.slots.document;
        setHasDocument(!!dSlot);
        if (dSlot) {
          setDocMaxKB(Math.round(dSlot.targetMaxBytes / 1024));
          setDocWidth(dSlot.width || 1200);
          setDocHeight(dSlot.height || 1600);
          setDocRatio(dSlot.aspectRatio || 'Free');
          setDocFormat(dSlot.defaultFormat || 'application/pdf');
          setDocGrayscale(dSlot.isGrayscaleDoc ?? true);
        }
        setActiveTab('create');
        return;
      }

      const activePreset = usePresetStore.getState().getActivePreset();
      const { photoSlot, signatureSlot, documentSlot } = useDossierStore.getState();

      setName('');
      // Photo slot values
      const pMax = photoSlot.customTargetMaxKB || (activePreset.slots.photo ? Math.round(activePreset.slots.photo.targetMaxBytes / 1024) : 50);
      const pMin = photoSlot.customTargetMinKB || (activePreset.slots.photo?.targetMinBytes ? Math.round(activePreset.slots.photo.targetMinBytes / 1024) : 20);
      const pW = photoSlot.customWidth || activePreset.slots.photo?.width || 350;
      const pH = photoSlot.customHeight || activePreset.slots.photo?.height || 350;
      const pRatio = photoSlot.customAspectRatio || activePreset.slots.photo?.aspectRatio || '1:1';
      setPhotoMaxKB(pMax);
      setPhotoMinKB(pMin);
      setPhotoWidth(pW);
      setPhotoHeight(pH);
      setPhotoRatio(pRatio);
      setPhotoFormat(activePreset.slots.photo?.defaultFormat || 'image/jpeg');

      // Signature slot values
      const hasSig = !!activePreset.slots.signature || !!signatureSlot.customTargetMaxKB || !!signatureSlot.file;
      setHasSignature(hasSig);
      const sMax = signatureSlot.customTargetMaxKB || (activePreset.slots.signature ? Math.round(activePreset.slots.signature.targetMaxBytes / 1024) : 20);
      const sMin = signatureSlot.customTargetMinKB || (activePreset.slots.signature?.targetMinBytes ? Math.round(activePreset.slots.signature.targetMinBytes / 1024) : 10);
      const sW = signatureSlot.customWidth || activePreset.slots.signature?.width || 280;
      const sH = signatureSlot.customHeight || activePreset.slots.signature?.height || 120;
      const sRatio = signatureSlot.customAspectRatio || activePreset.slots.signature?.aspectRatio || '2:1';
      setSigMaxKB(sMax);
      setSigMinKB(sMin);
      setSigWidth(sW);
      setSigHeight(sH);
      setSigRatio(sRatio);

      // Document slot values
      const hasDoc = !!activePreset.slots.document || !!documentSlot.customTargetMaxKB || !!documentSlot.file;
      setHasDocument(hasDoc);
      const dMax = documentSlot.customTargetMaxKB || (activePreset.slots.document ? Math.round(activePreset.slots.document.targetMaxBytes / 1024) : 300);
      const dW = documentSlot.customWidth || activePreset.slots.document?.width || 1200;
      const dH = documentSlot.customHeight || activePreset.slots.document?.height || 1600;
      const dRatio = documentSlot.customAspectRatio || activePreset.slots.document?.aspectRatio || 'Free';
      const dFormat = activePreset.slots.document?.defaultFormat || 'application/pdf';
      setDocMaxKB(dMax);
      setDocWidth(dW);
      setDocHeight(dH);
      setDocRatio(dRatio);
      setDocFormat(dFormat);
      setDocGrayscale(activePreset.slots.document?.isGrayscaleDoc ?? true);
    }
  }, [isOpen, initialPreset]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const presetId = initialPreset?.id || `custom_${Date.now()}`;
    const newPreset: PortalPreset = {
      id: presetId,
      name: name.trim(),
      country: initialPreset?.country || 'CUSTOM',
      countryFlag: initialPreset?.countryFlag || '⚙️',
      authority: initialPreset?.authority || 'User Custom Preset',
      category: initialPreset?.category || 'general',
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
                description: `Max ${sigMaxKB} KB • ${sigWidth}×${sigHeight} px (${sigRatio})`,
                targetMaxBytes: sigMaxKB * 1024,
                targetMinBytes: sigMinKB > 0 ? sigMinKB * 1024 : undefined,
                width: sigWidth,
                height: sigHeight,
                aspectRatio: sigRatio,
                aspectRatioValue: sigWidth / sigHeight,
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
                description: `Max ${docMaxKB} KB • ${docWidth}×${docHeight} px • ${docFormat === 'application/pdf' ? 'PDF' : 'JPEG'}`,
                targetMaxBytes: docMaxKB * 1024,
                width: docWidth,
                height: docHeight,
                aspectRatio: docRatio || 'Custom',
                aspectRatioValue: docWidth / docHeight,
                allowedFormats: [docFormat],
                defaultFormat: docFormat,
                isGrayscaleDoc: docGrayscale,
              },
            }
          : {}),
      },
    };

    saveCustomPreset(newPreset);
    const { resetAllSlotCustomTargets, optimizeAllSlots } = useDossierStore.getState();
    resetAllSlotCustomTargets();
    setActivePreset(presetId);
    optimizeAllSlots();
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

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="preset-builder-title"
      className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col text-foreground animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-card/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-soft border border-primary/25 flex items-center justify-center text-primary">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 id="preset-builder-title" className="text-base font-bold text-foreground">
                Custom Preset Manager & Builder
              </h2>
              <p className="text-xs text-muted-foreground">
                Define exact file bounds and save to browser localStorage
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-border bg-muted/30 px-5 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'create'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Plus className="w-4 h-4" /> Create New Preset
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manage')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'manage'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
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
                <label htmlFor="preset-name" className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                  Preset Profile Name
                </label>
                <input
                  id="preset-name"
                  type="text"
                  required
                  placeholder="e.g. State Scholarship Portal 2026, MIT Application, etc."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary outline-none transition-all"
                />
              </div>

              {/* Photo Constraints */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-3">
                <div className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  Slot 1: Photograph Constraints
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-1">Max Ceiling (KB)</label>
                    <input
                      type="number"
                      min="5"
                      max="10000"
                      value={photoMaxKB}
                      onChange={(e) => setPhotoMaxKB(Number(e.target.value))}
                      className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus-visible:ring-2 focus-visible:ring-primary outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-1">Min Floor (KB)</label>
                    <input
                      type="number"
                      min="0"
                      max={photoMaxKB}
                      value={photoMinKB}
                      onChange={(e) => setPhotoMinKB(Number(e.target.value))}
                      className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus-visible:ring-2 focus-visible:ring-primary outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-1">Width (px)</label>
                    <input
                      type="number"
                      min="50"
                      max="5000"
                      value={photoWidth}
                      onChange={(e) => setPhotoWidth(Number(e.target.value))}
                      className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground font-mono focus-visible:ring-2 focus-visible:ring-primary outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-1">Height (px)</label>
                    <input
                      type="number"
                      min="50"
                      max="5000"
                      value={photoHeight}
                      onChange={(e) => setPhotoHeight(Number(e.target.value))}
                      className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground font-mono focus-visible:ring-2 focus-visible:ring-primary outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-1">Aspect Ratio</label>
                    <select
                      value={photoRatio}
                      onChange={(e) => {
                        const r = e.target.value;
                        setPhotoRatio(r);
                        if (r === '1:1') { setPhotoWidth(500); setPhotoHeight(500); }
                        else if (r === '35:45') { setPhotoWidth(350); setPhotoHeight(450); }
                        else if (r === '4:3') { setPhotoWidth(600); setPhotoHeight(450); }
                      }}
                      className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus-visible:ring-2 focus-visible:ring-primary outline-none transition-all"
                    >
                      <option value="1:1">1:1 Square</option>
                      <option value="35:45">35:45 Passport</option>
                      <option value="4:3">4:3 Standard</option>
                      <option value="Free">Freeform</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-1">Output Format</label>
                    <select
                      value={photoFormat}
                      onChange={(e) => setPhotoFormat(e.target.value as OutputFormat)}
                      className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus-visible:ring-2 focus-visible:ring-primary outline-none transition-all"
                    >
                      <option value="image/jpeg">JPEG (Standard)</option>
                      <option value="image/png">PNG</option>
                      <option value="image/webp">WebP</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Signature Constraints */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">
                    Slot 2: Signature Constraints
                  </span>
                  <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasSignature}
                      onChange={(e) => setHasSignature(e.target.checked)}
                      className="rounded accent-primary"
                    />
                    Include Signature Slot
                  </label>
                </div>
                {hasSignature && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[11px] text-muted-foreground block mb-1">Max Ceiling (KB)</label>
                      <input
                        type="number"
                        value={sigMaxKB}
                        onChange={(e) => setSigMaxKB(Number(e.target.value))}
                        className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus-visible:ring-2 focus-visible:ring-primary outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground block mb-1">Min Floor (KB)</label>
                      <input
                        type="number"
                        value={sigMinKB}
                        onChange={(e) => setSigMinKB(Number(e.target.value))}
                        className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus-visible:ring-2 focus-visible:ring-primary outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground block mb-1">Width (px)</label>
                      <input
                        type="number"
                        min="50"
                        max="5000"
                        value={sigWidth}
                        onChange={(e) => setSigWidth(Number(e.target.value))}
                        className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground font-mono focus-visible:ring-2 focus-visible:ring-primary outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground block mb-1">Height (px)</label>
                      <input
                        type="number"
                        min="20"
                        max="5000"
                        value={sigHeight}
                        onChange={(e) => setSigHeight(Number(e.target.value))}
                        className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground font-mono focus-visible:ring-2 focus-visible:ring-primary outline-none transition-all"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Document Constraints */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">
                    Slot 3: Document / Marksheet Constraints
                  </span>
                  <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasDocument}
                      onChange={(e) => setHasDocument(e.target.checked)}
                      className="rounded accent-primary"
                    />
                    Include Document Slot
                  </label>
                </div>
                {hasDocument && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[11px] text-muted-foreground block mb-1">Max Ceiling (KB)</label>
                      <input
                        type="number"
                        min="5"
                        max="20000"
                        value={docMaxKB}
                        onChange={(e) => setDocMaxKB(Number(e.target.value))}
                        className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus-visible:ring-2 focus-visible:ring-primary outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground block mb-1">Width (px)</label>
                      <input
                        type="number"
                        min="50"
                        max="10000"
                        value={docWidth}
                        onChange={(e) => setDocWidth(Number(e.target.value))}
                        className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground font-mono focus-visible:ring-2 focus-visible:ring-primary outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground block mb-1">Height (px)</label>
                      <input
                        type="number"
                        min="50"
                        max="10000"
                        value={docHeight}
                        onChange={(e) => setDocHeight(Number(e.target.value))}
                        className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground font-mono focus-visible:ring-2 focus-visible:ring-primary outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground block mb-1">Output Format</label>
                      <select
                        value={docFormat}
                        onChange={(e) => setDocFormat(e.target.value as any)}
                        className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus-visible:ring-2 focus-visible:ring-primary outline-none transition-all"
                      >
                        <option value="application/pdf">PDF Document</option>
                        <option value="image/jpeg">JPEG Image</option>
                      </select>
                    </div>
                    <div className="flex items-center pt-2 col-span-2 sm:col-span-4">
                      <label className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={docGrayscale}
                          onChange={(e) => setDocGrayscale(e.target.checked)}
                          className="rounded accent-primary"
                        />
                        Grayscale Desaturate (-60% payload size)
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-muted text-foreground hover:bg-muted/80 text-sm font-medium transition-colors"
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
                <div className="text-xs text-muted-foreground">
                  Presets are stored in browser localStorage and persist across restarts.
                </div>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-muted hover:bg-card text-xs font-semibold text-foreground border border-border flex items-center gap-1.5 transition-colors">
                    <Upload className="w-3.5 h-3.5" /> Import JSON
                    <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
                  </label>
                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="px-3 py-1.5 rounded-lg bg-muted hover:bg-card text-xs font-semibold text-foreground border border-border flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Export JSON
                  </button>
                </div>
              </div>

              {importError && (
                <div className="p-3 rounded-xl bg-destructive-soft border border-destructive/30 text-destructive text-xs">
                  {importError}
                </div>
              )}

              {customPresets.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  No custom presets saved yet. Switch to "Create New Preset" to configure your first profile.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {customPresets.map((preset) => (
                    <div
                      key={preset.id}
                      className="p-3.5 rounded-xl bg-card border border-border flex items-center justify-between hover:border-primary/40 transition-colors"
                    >
                      <div>
                        <div className="text-sm font-bold text-foreground">{preset.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{preset.description}</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setActivePreset(preset.id);
                            onClose();
                          }}
                          className="px-3 py-1 rounded-lg bg-primary-soft text-primary hover:bg-primary/20 text-xs font-semibold transition-colors"
                        >
                          Select
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicateCustomPreset(preset.id)}
                          className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteCustomPreset(preset.id)}
                          className="p-1.5 rounded-lg bg-muted text-destructive hover:bg-destructive-soft transition-colors"
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

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};
