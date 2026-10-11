import React, { useState } from 'react';
import { Camera, PenLine, FileText, Upload, Sparkles, Columns3, ArrowDownToLine, RefreshCw, Scissors, Trash2 } from 'lucide-react';
import { useDossierStore } from '../../store/useDossierStore';
import { usePresetStore } from '../../store/usePresetStore';
import { formatBytes, formatDimensions } from '../../utils/byteFormatter';
import { ByteCounter } from '../common/ByteCounter';
import { StatusBadge } from '../common/StatusBadge';
import { BiometricCanvas } from '../canvas/BiometricCanvas';
import { SignatureEnhancer } from '../canvas/SignatureEnhancer';
import { DiffViewer } from '../canvas/DiffViewer';
import { saveAs } from '../../utils/fileSaver';
import { getStandardizedFileName } from '../../utils/zipBundler';

export const DossierSlotsView: React.FC = () => {
  const {
    photoSlot,
    signatureSlot,
    documentSlot,
    setSlotFile,
    clearSlot,
    updateSlotCrop,
    updateSlotFilters,
    optimizeSlot,
  } = useDossierStore();

  const activePreset = usePresetStore((s) => s.getActivePreset());

  // Modal inspection states
  const [activeCropSlot, setActiveCropSlot] = useState<'photo' | null>(null);
  const [activeDiffSlot, setActiveDiffSlot] = useState<'photo' | 'signature' | 'document' | null>(null);

  const handleFileDrop = (slotKey: 'photo' | 'signature' | 'document', e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSlotFile(slotKey, e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (slotKey: 'photo' | 'signature' | 'document', e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSlotFile(slotKey, e.target.files[0]);
    }
  };

  const handleDownloadSingle = (slotKey: 'photo' | 'signature' | 'document') => {
    const slot = slotKey === 'photo' ? photoSlot : slotKey === 'signature' ? signatureSlot : documentSlot;
    const req = activePreset.slots[slotKey];
    if (!slot.processedBlob || !req) return;

    const item = {
      id: slotKey,
      slotType: slotKey,
      title: req.title,
      originalFileName: slot.file?.name || 'file.jpg',
      blob: slot.processedBlob,
      finalBytes: slot.processedBytes,
      targetMaxBytes: req.targetMaxBytes,
      width: slot.processedWidth,
      height: slot.processedHeight,
      mimeType: slot.mimeType,
      passed: slot.status === 'valid',
    };

    const fileName = getStandardizedFileName(item, slotKey === 'photo' ? 0 : slotKey === 'signature' ? 1 : 2);
    saveAs(slot.processedBlob, fileName);
  };

  return (
    <div className="space-y-6">
      {/* 3 Guided Slots Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ================= SLOT 1: PHOTOGRAPH ================= */}
        {activePreset.slots.photo && (
          <div className="flex flex-col bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-colors">
            {/* Slot Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                    Slot 1: Photograph
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {activePreset.slots.photo.width}×{activePreset.slots.photo.height} px • {activePreset.slots.photo.aspectRatio}
                  </p>
                </div>
              </div>
              <StatusBadge status={photoSlot.status} />
            </div>

            {/* Slot Body */}
            {photoSlot.file ? (
              <div className="flex-1 flex flex-col justify-between space-y-4">
                {/* Photo Preview Stage */}
                <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center min-h-[220px]">
                  {photoSlot.processedDataUrl ? (
                    <img
                      src={photoSlot.processedDataUrl}
                      alt="Processed biometric photo"
                      className="max-h-[200px] w-auto object-contain rounded-lg shadow-md"
                    />
                  ) : (
                    <div className="text-xs text-slate-500 animate-pulse">Rendering preview...</div>
                  )}

                  {/* Dimension pill */}
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-[10px] font-mono text-slate-300">
                    {formatDimensions(photoSlot.processedWidth, photoSlot.processedHeight)}
                  </div>
                </div>

                {/* Live Byte Counter Fuel Gauge */}
                <ByteCounter
                  currentBytes={photoSlot.processedBytes}
                  targetMaxBytes={activePreset.slots.photo.targetMaxBytes}
                  targetMinBytes={activePreset.slots.photo.targetMinBytes}
                  bracketPercentage={photoSlot.bracketPercentage}
                />

                {/* Slot Actions Toolbar */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveCropSlot('photo')}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5"
                  >
                    <Scissors className="w-3.5 h-3.5 text-emerald-400" /> Biometric Guides
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveDiffSlot('photo')}
                    disabled={!photoSlot.sourceUrl}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    <Columns3 className="w-3.5 h-3.5 text-blue-400" /> A/B Diff Slider
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <label className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5" /> Replace Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileInput('photo', e)}
                      className="hidden"
                    />
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => clearSlot('photo')}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadSingle('photo')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1 border border-emerald-500/30"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5" /> Save
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Empty Drop Zone */
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleFileDrop('photo', e)}
                className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-800 rounded-2xl hover:border-emerald-500/40 hover:bg-emerald-950/10 transition-colors cursor-pointer text-center group"
              >
                <label className="cursor-pointer flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/80 group-hover:bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 transition-transform group-hover:scale-105">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-400">
                    Drop Raw Camera Photo
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
                    Auto-locks to {formatBytes(activePreset.slots.photo.targetMaxBytes)} & official proportions
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileInput('photo', e)}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
        )}

        {/* ================= SLOT 2: SIGNATURE ================= */}
        {activePreset.slots.signature && (
          <div className="flex flex-col bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-colors">
            {/* Slot Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <PenLine className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                    Slot 2: Signature
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Proportion: {activePreset.slots.signature.aspectRatio} • Limit: {formatBytes(activePreset.slots.signature.targetMaxBytes)}
                  </p>
                </div>
              </div>
              <StatusBadge status={signatureSlot.status} />
            </div>

            {/* Slot Body */}
            {signatureSlot.file ? (
              <div className="flex-1 flex flex-col justify-between space-y-4">
                {/* Signature Preview Stage */}
                <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center min-h-[160px] p-2">
                  {signatureSlot.processedDataUrl ? (
                    <img
                      src={signatureSlot.processedDataUrl}
                      alt="Processed bleached signature"
                      className="max-h-[140px] w-auto object-contain rounded-md shadow-sm bg-white"
                    />
                  ) : (
                    <div className="text-xs text-slate-500 animate-pulse">Binarizing ink...</div>
                  )}

                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-[10px] font-mono text-slate-300">
                    {formatDimensions(signatureSlot.processedWidth, signatureSlot.processedHeight)}
                  </div>
                </div>

                {/* Byte Counter Fuel Gauge */}
                <ByteCounter
                  currentBytes={signatureSlot.processedBytes}
                  targetMaxBytes={activePreset.slots.signature.targetMaxBytes}
                  targetMinBytes={activePreset.slots.signature.targetMinBytes}
                  bracketPercentage={signatureSlot.bracketPercentage}
                />

                {/* Signature Paper Bleach Workspace */}
                <SignatureEnhancer
                  filters={signatureSlot.filters}
                  onFilterChange={(f) => updateSlotFilters('signature', f)}
                  onApply={() => optimizeSlot('signature')}
                />

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveDiffSlot('signature')}
                    disabled={!signatureSlot.sourceUrl}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    <Columns3 className="w-3.5 h-3.5 text-blue-400" /> A/B Diff Slider
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadSingle('signature')}
                    className="px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1 border border-emerald-500/30"
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5" /> Save Signature
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <label className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5" /> Replace Signature
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileInput('signature', e)}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => clearSlot('signature')}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                    title="Remove signature"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Empty Drop Zone */
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleFileDrop('signature', e)}
                className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-800 rounded-2xl hover:border-blue-500/40 hover:bg-blue-950/10 transition-colors cursor-pointer text-center group"
              >
                <label className="cursor-pointer flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/80 group-hover:bg-blue-500/20 text-blue-400 flex items-center justify-center mb-3 transition-transform group-hover:scale-105">
                    <PenLine className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-200 group-hover:text-blue-400">
                    Drop Phone Photo of Signature
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
                    Auto-bleaches desk shadows to #FFFFFF & sets 2:1 ratio
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileInput('signature', e)}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
        )}

        {/* ================= SLOT 3: CERTIFICATE / ID ================= */}
        {activePreset.slots.document && (
          <div className="flex flex-col bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-colors">
            {/* Slot Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                    Slot 3: Document / Marksheet
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Target: &lt; {formatBytes(activePreset.slots.document.targetMaxBytes)} • {activePreset.slots.document.defaultFormat === 'application/pdf' ? 'Grayscale PDF' : 'JPEG'}
                  </p>
                </div>
              </div>
              <StatusBadge status={documentSlot.status} />
            </div>

            {/* Slot Body */}
            {documentSlot.file ? (
              <div className="flex-1 flex flex-col justify-between space-y-4">
                {/* Document Preview Stage */}
                <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center min-h-[160px] p-2">
                  {documentSlot.processedDataUrl ? (
                    documentSlot.isPdf ? (
                      <div className="flex flex-col items-center justify-center p-4 text-center">
                        <FileText className="w-12 h-12 text-yellow-400 mb-1" />
                        <span className="text-xs font-bold text-slate-200">
                          Compiled Single-Page PDF
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {formatBytes(documentSlot.processedBytes)}
                        </span>
                      </div>
                    ) : (
                      <img
                        src={documentSlot.processedDataUrl}
                        alt="Processed document preview"
                        className="max-h-[140px] w-auto object-contain rounded-md shadow-sm"
                      />
                    )
                  ) : (
                    <div className="text-xs text-slate-500 animate-pulse">Optimizing document...</div>
                  )}

                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-[10px] font-mono text-slate-300">
                    {documentSlot.isPdf ? 'PDF Format' : formatDimensions(documentSlot.processedWidth, documentSlot.processedHeight)}
                  </div>
                </div>

                {/* Byte Counter Fuel Gauge */}
                <ByteCounter
                  currentBytes={documentSlot.processedBytes}
                  targetMaxBytes={activePreset.slots.document.targetMaxBytes}
                  targetMinBytes={activePreset.slots.document.targetMinBytes}
                  bracketPercentage={documentSlot.bracketPercentage}
                />

                {/* Document Enhancer Controls */}
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Text Clarifier & Desaturation
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <label className="text-xs text-slate-300 flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={documentSlot.filters.grayscale}
                        onChange={(e) => {
                          updateSlotFilters('document', { grayscale: e.target.checked });
                          optimizeSlot('document');
                        }}
                        className="rounded accent-emerald-500"
                      />
                      Grayscale Mode (-60% bytes)
                    </label>

                    <label className="text-xs text-slate-300 flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={documentSlot.filters.sharpenText}
                        onChange={(e) => {
                          updateSlotFilters('document', { sharpenText: e.target.checked });
                          optimizeSlot('document');
                        }}
                        className="rounded accent-emerald-500"
                      />
                      Unsharp Text Filter
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveDiffSlot('document')}
                    disabled={!documentSlot.sourceUrl || documentSlot.isPdf}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    <Columns3 className="w-3.5 h-3.5 text-blue-400" /> A/B Diff Slider
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadSingle('document')}
                    className="px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1 border border-emerald-500/30"
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5" /> Save Document
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <label className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5" /> Replace Document
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileInput('document', e)}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => clearSlot('document')}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                    title="Remove document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Empty Drop Zone */
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleFileDrop('document', e)}
                className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-800 rounded-2xl hover:border-yellow-500/40 hover:bg-yellow-950/10 transition-colors cursor-pointer text-center group"
              >
                <label className="cursor-pointer flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/80 group-hover:bg-yellow-500/20 text-yellow-400 flex items-center justify-center mb-3 transition-transform group-hover:scale-105">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-200 group-hover:text-yellow-400">
                    Drop PDF or Photo of Document
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
                    Auto-optimizes to &lt; {formatBytes(activePreset.slots.document.targetMaxBytes)} grayscale
                  </span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileInput('document', e)}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Biometric Interactive Guides Modal */}
      {activeCropSlot === 'photo' && photoSlot.sourceUrl && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl flex flex-col items-center gap-4">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Biometric Alignment Stage
            </h3>
            <BiometricCanvas
              sourceUrl={photoSlot.sourceUrl}
              crop={photoSlot.crop}
              aspectRatioValue={activePreset.slots.photo?.aspectRatioValue || 1.0}
              aspectRatioLabel={activePreset.slots.photo?.aspectRatio || '1:1'}
              faceCoverage={activePreset.slots.photo?.faceCoverage}
              onCropChange={(c) => updateSlotCrop('photo', c)}
              onApplyCrop={() => optimizeSlot('photo')}
            />
            <button
              type="button"
              onClick={() => setActiveCropSlot(null)}
              className="w-full py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-colors"
            >
              Done & Apply Biometrics
            </button>
          </div>
        </div>
      )}

      {/* A/B Diff Inspector Modal */}
      {activeDiffSlot && (
        <DiffViewer
          originalUrl={
            activeDiffSlot === 'photo'
              ? photoSlot.sourceUrl!
              : activeDiffSlot === 'signature'
              ? signatureSlot.sourceUrl!
              : documentSlot.sourceUrl!
          }
          originalBytes={
            activeDiffSlot === 'photo'
              ? photoSlot.sourceBytes
              : activeDiffSlot === 'signature'
              ? signatureSlot.sourceBytes
              : documentSlot.sourceBytes
          }
          compressedUrl={
            activeDiffSlot === 'photo'
              ? photoSlot.processedDataUrl!
              : activeDiffSlot === 'signature'
              ? signatureSlot.processedDataUrl!
              : documentSlot.processedDataUrl!
          }
          compressedBytes={
            activeDiffSlot === 'photo'
              ? photoSlot.processedBytes
              : activeDiffSlot === 'signature'
              ? signatureSlot.processedBytes
              : documentSlot.processedBytes
          }
          title={
            activeDiffSlot === 'photo'
              ? 'Photograph Fidelity'
              : activeDiffSlot === 'signature'
              ? 'Signature Ink Cleanliness'
              : 'Certificate Text Readability'
          }
          onClose={() => setActiveDiffSlot(null)}
        />
      )}
    </div>
  );
};
