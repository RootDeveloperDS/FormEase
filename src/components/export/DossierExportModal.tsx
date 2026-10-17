import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, ShieldCheck, CheckCircle2, AlertTriangle, ArrowDownToLine } from 'lucide-react';
import { useDossierStore } from '../../store/useDossierStore';
import { usePresetStore } from '../../store/usePresetStore';
import { formatBytes, formatDimensions } from '../../utils/byteFormatter';
import { bundleAndDownloadDossierZip, getStandardizedFileName } from '../../utils/zipBundler';
import type { DossierExportItem } from '../../utils/zipBundler';
import { ActionButton } from '../common/ActionButton';
import { FormEaseLogo } from '../common/FormEaseLogo';
import { saveAs } from '../../utils/fileSaver';

interface DossierExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DossierExportModal: React.FC<DossierExportModalProps> = ({ isOpen, onClose }) => {
  const { photoSlot, signatureSlot, documentSlot, activeMode, sandboxQueue } = useDossierStore();
  const activePreset = usePresetStore((s) => s.getActivePreset());
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Gather items to export based on active mode
  const exportItems: DossierExportItem[] = [];

  if (activeMode === 'dossier') {
    if (photoSlot.processedBlob && activePreset.slots.photo) {
      exportItems.push({
        id: 'photo',
        slotType: 'photo',
        title: activePreset.slots.photo.title,
        originalFileName: photoSlot.file?.name || 'camera_photo.jpg',
        blob: photoSlot.processedBlob,
        finalBytes: photoSlot.processedBytes,
        targetMaxBytes: photoSlot.customTargetMaxKB
          ? photoSlot.customTargetMaxKB * 1024
          : activePreset.slots.photo.targetMaxBytes,
        width: photoSlot.processedWidth,
        height: photoSlot.processedHeight,
        mimeType: photoSlot.mimeType,
        quality: photoSlot.quality,
        passed: photoSlot.status === 'valid',
        bracketPercentage: photoSlot.bracketPercentage,
      });
    }

    if (signatureSlot.processedBlob && activePreset.slots.signature) {
      exportItems.push({
        id: 'signature',
        slotType: 'signature',
        title: activePreset.slots.signature.title,
        originalFileName: signatureSlot.file?.name || 'phone_signature.jpg',
        blob: signatureSlot.processedBlob,
        finalBytes: signatureSlot.processedBytes,
        targetMaxBytes: signatureSlot.customTargetMaxKB
          ? signatureSlot.customTargetMaxKB * 1024
          : activePreset.slots.signature.targetMaxBytes,
        width: signatureSlot.processedWidth,
        height: signatureSlot.processedHeight,
        mimeType: signatureSlot.mimeType,
        quality: signatureSlot.quality,
        passed: signatureSlot.status === 'valid',
        bracketPercentage: signatureSlot.bracketPercentage,
      });
    }

    if (documentSlot.processedBlob && activePreset.slots.document) {
      exportItems.push({
        id: 'document',
        slotType: 'document',
        title: activePreset.slots.document.title,
        originalFileName: documentSlot.file?.name || 'marksheet_scan.pdf',
        blob: documentSlot.processedBlob,
        finalBytes: documentSlot.processedBytes,
        targetMaxBytes: documentSlot.customTargetMaxKB
          ? documentSlot.customTargetMaxKB * 1024
          : activePreset.slots.document.targetMaxBytes,
        width: documentSlot.processedWidth,
        height: documentSlot.processedHeight,
        mimeType: documentSlot.mimeType,
        passed: documentSlot.status === 'valid',
        bracketPercentage: documentSlot.bracketPercentage,
      });
    }
  } else {
    // Sandbox mode
    sandboxQueue.forEach((card, idx) => {
      if (card.processedBlob) {
        exportItems.push({
          id: card.id,
          slotType: 'custom',
          title: card.name,
          originalFileName: card.file?.name || `file_${idx + 1}.jpg`,
          blob: card.processedBlob,
          finalBytes: card.processedBytes,
          targetMaxBytes: card.targetMaxKB * 1024,
          width: card.processedWidth,
          height: card.processedHeight,
          mimeType: card.format,
          quality: card.quality,
          passed: card.status === 'valid',
          bracketPercentage: card.bracketPercentage,
        });
      }
    });
  }

  const handleDownloadSingle = (item: DossierExportItem, idx: number) => {
    const filename = getStandardizedFileName(item, idx);
    saveAs(item.blob, filename);
  };

  const handleDownloadMasterZip = async () => {
    setIsExporting(true);
    try {
      await bundleAndDownloadDossierZip(exportItems, {
        presetName: activeMode === 'dossier' ? activePreset.name : 'Multi-Batch Sandbox Package',
        presetId: activeMode === 'dossier' ? activePreset.id : 'sandbox-batch',
        authority: activePreset.authority,
        timestamp: new Date().toISOString(),
      });
      onClose();
    } catch (err) {
      console.error('Failed to export zip:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <FormEaseLogo size={36} />
            <div>
              <h2 id="export-modal-title" className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Verified Dossier Pre-Flight Audit</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  v3.0.1.1 • Ready to Bundle
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                All files formatted, verified, and bundled for portal submission
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

        {/* Audit Checklist Table */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {exportItems.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              No processed files found. Please upload documents to begin.
            </div>
          ) : (
            exportItems.map((item, idx) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {item.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
                    )}
                    <span className="text-sm font-bold text-slate-100 truncate">
                      {item.title}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-slate-400 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    <span>File: {getStandardizedFileName(item, idx)}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold">
                      {formatBytes(item.finalBytes)}
                    </span>
                    <span>(Limit: {formatBytes(item.targetMaxBytes)})</span>
                    <span>•</span>
                    <span>{formatDimensions(item.width, item.height)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDownloadSingle(item, idx)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 shrink-0 border border-slate-700"
                  title="Download single file"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5" /> Save
                </button>
              </div>
            ))
          )}

          {/* Validation Manifest Notice */}
          <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-200 font-semibold">Includes VALIDATION_SUMMARY.txt: </span>
              A machine-readable and human-readable audit manifest detailing byte counts, pixel dimensions, and mathematical convergence proof is automatically included in the ZIP archive.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Total Package Size:{' '}
            <span className="text-slate-200 font-bold font-mono">
              {formatBytes(exportItems.reduce((acc, i) => acc + i.finalBytes, 0))}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-semibold"
            >
              Cancel
            </button>
            <ActionButton
              onClick={handleDownloadMasterZip}
              variant="primary"
              size="md"
              isLoading={isExporting}
              disabled={exportItems.length === 0}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Download Complete Dossier (.ZIP)
            </ActionButton>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};
