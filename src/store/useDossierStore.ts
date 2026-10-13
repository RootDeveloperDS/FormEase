import { create } from 'zustand';
import type { SlotRequirement } from '../core/presets/presetTypes';
import { createOrientedCanvas } from '../core/algorithms/exifCorrector';
import { renderPdfToCanvas, wrapCanvasToCompliantPdf } from '../core/algorithms/pdfProcessor';
import { binarizeSignatureCanvas } from '../core/algorithms/binarizeSignature';
import { enhanceDocumentCanvas } from '../core/algorithms/documentEnhancer';
import { workerBridge } from '../core/workers/workerBridge';
import { generateDemoDossierFiles } from '../utils/sampleDataGenerator';
import { usePresetStore } from './usePresetStore';

export interface CropState {
  zoom: number; // 1.0 to 3.0
  panX: number; // offset in px
  panY: number; // offset in px
  rotation: number; // 0, 90, 180, 270
}

export interface FilterState {
  bleachThreshold: number; // 0 to 255
  inkDarkness: number; // 0.5 to 2.5
  grayscale: boolean;
  contrast: number; // 1.0 to 2.0
  sharpenText: boolean;
  brightness: number; // -50 to 50
}

export interface SlotProcessingState {
  file: File | null;
  sourceUrl: string | null;
  sourceBytes: number;
  sourceWidth: number;
  sourceHeight: number;
  isPdf: boolean;
  crop: CropState;
  filters: FilterState;
  processedBlob: Blob | null;
  processedDataUrl: string | null;
  processedBytes: number;
  processedWidth: number;
  processedHeight: number;
  mimeType: string;
  quality: number;
  iterations: number;
  bracketPercentage: number;
  status: 'idle' | 'optimizing' | 'valid' | 'warning' | 'error';
  statusMessage: string;
  customTargetMaxKB?: number;
  customTargetMinKB?: number;
  customWidth?: number;
  customHeight?: number;
  customAspectRatio?: string;
  customAspectRatioValue?: number;
}

export interface SandboxCardState extends SlotProcessingState {
  id: string;
  name: string;
  targetMaxKB: number;
  targetMinKB?: number;
  targetWidth: number;
  targetHeight: number;
  aspectRatio: string;
  format: 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf';
}

interface DossierState {
  activeMode: 'dossier' | 'sandbox';
  setMode: (mode: 'dossier' | 'sandbox') => void;

  // Mode A: Guided Dossier Slots
  photoSlot: SlotProcessingState;
  signatureSlot: SlotProcessingState;
  documentSlot: SlotProcessingState;

  // Mode B: Sandbox Queue
  sandboxQueue: SandboxCardState[];

  // Actions
  setSlotFile: (slotKey: 'photo' | 'signature' | 'document', file: File) => Promise<void>;
  clearSlot: (slotKey: 'photo' | 'signature' | 'document') => void;
  updateSlotCrop: (slotKey: 'photo' | 'signature' | 'document', crop: Partial<CropState>) => void;
  updateSlotFilters: (slotKey: 'photo' | 'signature' | 'document', filters: Partial<FilterState>) => void;
  updateSlotTarget: (
    slotKey: 'photo' | 'signature' | 'document',
    updates: {
      maxKB?: number;
      minKB?: number;
      width?: number;
      height?: number;
      aspectRatio?: string;
      aspectRatioValue?: number;
    }
  ) => Promise<void>;
  resetSlotCustomTarget: (slotKey: 'photo' | 'signature' | 'document') => Promise<void>;
  saveCurrentAsCustomPreset: (presetName: string) => string;
  optimizeSlot: (slotKey: 'photo' | 'signature' | 'document') => Promise<void>;
  optimizeAllSlots: () => Promise<void>;
  loadDemoDossier: () => Promise<void>;

  // Sandbox Actions
  addSandboxFiles: (files: File[]) => Promise<void>;
  removeSandboxCard: (id: string) => void;
  updateSandboxCardCrop: (id: string, crop: Partial<CropState>) => void;
  updateSandboxCardFilters: (id: string, filters: Partial<FilterState>) => void;
  updateSandboxCardTarget: (id: string, updates: Partial<SandboxCardState>) => void;
  optimizeSandboxCard: (id: string) => Promise<void>;
  batchApplySandboxTarget: (
    targetMaxKB: number,
    format?: any,
    dimensions?: { width: number; height: number; aspectRatio?: string }
  ) => Promise<void>;
  clearAllSandbox: () => void;
}

const initialCrop: CropState = { zoom: 1.0, panX: 0, panY: 0, rotation: 0 };
const initialFilters: FilterState = {
  bleachThreshold: 185,
  inkDarkness: 1.3,
  grayscale: false,
  contrast: 1.1,
  sharpenText: true,
  brightness: 0,
};

// Concurrency guard to prevent asynchronous race conditions and jumping images
const slotOptimizationSeq: Record<'photo' | 'signature' | 'document', number> = {
  photo: 0,
  signature: 0,
  document: 0,
};
const sandboxOptimizationSeq: Record<string, number> = {};

function createEmptySlot(): SlotProcessingState {
  return {
    file: null,
    sourceUrl: null,
    sourceBytes: 0,
    sourceWidth: 0,
    sourceHeight: 0,
    isPdf: false,
    crop: { ...initialCrop },
    filters: { ...initialFilters },
    processedBlob: null,
    processedDataUrl: null,
    processedBytes: 0,
    processedWidth: 0,
    processedHeight: 0,
    mimeType: 'image/jpeg',
    quality: 0.9,
    iterations: 0,
    bracketPercentage: 0,
    status: 'idle',
    statusMessage: 'Ready for upload',
  };
}

export const useDossierStore = create<DossierState>((set, get) => ({
  activeMode: 'dossier',
  setMode: (mode) => set({ activeMode: mode }),

  photoSlot: createEmptySlot(),
  signatureSlot: createEmptySlot(),
  documentSlot: createEmptySlot(),
  sandboxQueue: [],

  setSlotFile: async (slotKey, file) => {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const sourceUrl = URL.createObjectURL(file);

    let width = 800;
    let height = 800;

    if (isPdf) {
      try {
        const tempCanvas = await renderPdfToCanvas(file, 1.0);
        width = tempCanvas.width || 1200;
        height = tempCanvas.height || 1600;
      } catch {
        width = 1200;
        height = 1600;
      }
    } else {
      try {
        const img = new Image();
        img.src = sourceUrl;
        await new Promise<void>((res) => {
          img.onload = () => res();
          img.onerror = () => res();
        });
        width = img.naturalWidth || 800;
        height = img.naturalHeight || 800;
      } catch {
        width = 800;
        height = 800;
      }
    }

    const slotState: SlotProcessingState = {
      ...createEmptySlot(),
      file,
      sourceUrl,
      sourceBytes: file.size,
      sourceWidth: width,
      sourceHeight: height,
      isPdf,
      filters: {
        ...initialFilters,
        grayscale: slotKey === 'document',
      },
      status: 'optimizing',
      statusMessage: 'Optimizing to official bounds...',
    };

    if (slotKey === 'photo') set({ photoSlot: slotState });
    else if (slotKey === 'signature') set({ signatureSlot: slotState });
    else if (slotKey === 'document') set({ documentSlot: slotState });

    // Automatically trigger optimization
    await get().optimizeSlot(slotKey);
  },

  clearSlot: (slotKey) => {
    const current = get()[`${slotKey}Slot` as keyof DossierState] as SlotProcessingState;
    if (current.sourceUrl) URL.revokeObjectURL(current.sourceUrl);
    set({ [`${slotKey}Slot`]: createEmptySlot() });
  },

  updateSlotCrop: (slotKey, cropUpdates) => {
    set((state) => {
      const current = state[`${slotKey}Slot` as keyof DossierState] as SlotProcessingState;
      return {
        [`${slotKey}Slot`]: {
          ...current,
          crop: { ...current.crop, ...cropUpdates },
        },
      };
    });
  },

  updateSlotFilters: (slotKey, filterUpdates) => {
    set((state) => {
      const current = state[`${slotKey}Slot` as keyof DossierState] as SlotProcessingState;
      return {
        [`${slotKey}Slot`]: {
          ...current,
          filters: { ...current.filters, ...filterUpdates },
        },
      };
    });
  },

  updateSlotTarget: async (slotKey, updates) => {
    set((state) => {
      const current = state[`${slotKey}Slot` as keyof DossierState] as SlotProcessingState;
      return {
        [`${slotKey}Slot`]: {
          ...current,
          customTargetMaxKB: updates.maxKB !== undefined ? updates.maxKB : current.customTargetMaxKB,
          customTargetMinKB: updates.minKB !== undefined ? updates.minKB : current.customTargetMinKB,
          customWidth: updates.width !== undefined ? updates.width : current.customWidth,
          customHeight: updates.height !== undefined ? updates.height : current.customHeight,
          customAspectRatio: updates.aspectRatio !== undefined ? updates.aspectRatio : current.customAspectRatio,
          customAspectRatioValue: updates.aspectRatioValue !== undefined ? updates.aspectRatioValue : current.customAspectRatioValue,
        },
      };
    });
    await get().optimizeSlot(slotKey);
  },

  resetSlotCustomTarget: async (slotKey) => {
    set((state) => {
      const current = state[`${slotKey}Slot` as keyof DossierState] as SlotProcessingState;
      return {
        [`${slotKey}Slot`]: {
          ...current,
          customTargetMaxKB: undefined,
          customTargetMinKB: undefined,
          customWidth: undefined,
          customHeight: undefined,
          customAspectRatio: undefined,
          customAspectRatioValue: undefined,
        },
      };
    });
    await get().optimizeSlot(slotKey);
  },

  saveCurrentAsCustomPreset: (presetName: string) => {
    const activePreset = usePresetStore.getState().getActivePreset();
    const pSlot = get().photoSlot;
    const sSlot = get().signatureSlot;
    const dSlot = get().documentSlot;

    const newId = `custom_${Date.now()}`;
    const cleanName = presetName.trim() || `${activePreset.name} (Custom)`;

    const customPreset = {
      ...activePreset,
      id: newId,
      name: cleanName,
      country: 'CUSTOM' as const,
      countryFlag: '⚙️',
      authority: 'Custom Preset Profile',
      description: `Tailored constraints saved on ${new Date().toLocaleDateString()}`,
      isCustom: true,
      slots: {
        ...(activePreset.slots.photo && {
          photo: {
            ...activePreset.slots.photo,
            targetMaxBytes: pSlot.customTargetMaxKB ? pSlot.customTargetMaxKB * 1024 : activePreset.slots.photo.targetMaxBytes,
            targetMinBytes: pSlot.customTargetMinKB ? pSlot.customTargetMinKB * 1024 : activePreset.slots.photo.targetMinBytes,
            width: pSlot.customWidth || activePreset.slots.photo.width,
            height: pSlot.customHeight || activePreset.slots.photo.height,
            aspectRatio: pSlot.customAspectRatio || activePreset.slots.photo.aspectRatio,
            aspectRatioValue: pSlot.customAspectRatioValue || activePreset.slots.photo.aspectRatioValue,
          },
        }),
        ...(activePreset.slots.signature && {
          signature: {
            ...activePreset.slots.signature,
            targetMaxBytes: sSlot.customTargetMaxKB ? sSlot.customTargetMaxKB * 1024 : activePreset.slots.signature.targetMaxBytes,
            targetMinBytes: sSlot.customTargetMinKB ? sSlot.customTargetMinKB * 1024 : activePreset.slots.signature.targetMinBytes,
            width: sSlot.customWidth || activePreset.slots.signature.width,
            height: sSlot.customHeight || activePreset.slots.signature.height,
            aspectRatio: sSlot.customAspectRatio || activePreset.slots.signature.aspectRatio,
            aspectRatioValue: sSlot.customAspectRatioValue || activePreset.slots.signature.aspectRatioValue,
          },
        }),
        ...(activePreset.slots.document && {
          document: {
            ...activePreset.slots.document,
            targetMaxBytes: dSlot.customTargetMaxKB ? dSlot.customTargetMaxKB * 1024 : activePreset.slots.document.targetMaxBytes,
            targetMinBytes: dSlot.customTargetMinKB ? dSlot.customTargetMinKB * 1024 : activePreset.slots.document.targetMinBytes,
          },
        }),
      },
    };

    usePresetStore.getState().saveCustomPreset(customPreset);
    usePresetStore.getState().setActivePreset(newId);
    return newId;
  },

  optimizeSlot: async (slotKey) => {
    const slot = get()[`${slotKey}Slot` as keyof DossierState] as SlotProcessingState;
    if (!slot.file) return;

    const preset = usePresetStore.getState().getActivePreset();
    const requirement: SlotRequirement | undefined = preset.slots[slotKey];
    if (!requirement) return;

    // Increment run sequence for this slot to cancel any previous inflight runs
    const runSeq = ++slotOptimizationSeq[slotKey];

    const targetMaxBytes = slot.customTargetMaxKB ? slot.customTargetMaxKB * 1024 : requirement.targetMaxBytes;
    const targetMinBytes = slot.customTargetMinKB ? slot.customTargetMinKB * 1024 : requirement.targetMinBytes;
    const targetW = Math.max(16, slot.customWidth || requirement.width || 400);
    const targetH = Math.max(16, slot.customHeight || requirement.height || 400);

    set((state) => ({
      [`${slotKey}Slot`]: {
        ...(state[`${slotKey}Slot` as keyof DossierState] as SlotProcessingState),
        status: 'optimizing',
        statusMessage: 'Fitting to required size...',
      },
    }));

    try {
      let sourceCanvas: HTMLCanvasElement;
      if (slot.isPdf) {
        sourceCanvas = await renderPdfToCanvas(slot.file, 1.5);
      } else {
        sourceCanvas = await createOrientedCanvas(slot.file);
      }

      // Check if stale before rendering stage canvas
      if (runSeq !== slotOptimizationSeq[slotKey]) return;

      const fittedCanvas = document.createElement('canvas');
      fittedCanvas.width = targetW;
      fittedCanvas.height = targetH;
      const ctx = fittedCanvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Apply crop pan & zoom
      const zoom = slot.crop?.zoom || 1.0;
      const panX = slot.crop?.panX || 0;
      const panY = slot.crop?.panY || 0;

      // Scale pan from Stage coordinates (192px height) to target canvas coordinates
      const stageScale = targetH / 192;
      const canvasPanX = panX * stageScale;
      const canvasPanY = panY * stageScale;

      ctx.save();
      ctx.translate(targetW / 2 + canvasPanX, targetH / 2 + canvasPanY);
      ctx.scale(zoom, zoom);
      if (slot.crop?.rotation) {
        ctx.rotate((slot.crop.rotation * Math.PI) / 180);
      }

      // Scale source to cover canvas maintaining aspect ratio
      const srcW = Math.max(1, sourceCanvas.width || 800);
      const srcH = Math.max(1, sourceCanvas.height || 800);
      const srcRatio = srcW / srcH;
      const targetRatio = targetW / targetH;
      let drawW: number;
      let drawH: number;

      if (srcRatio > targetRatio) {
        drawH = targetH;
        drawW = targetH * srcRatio;
      } else {
        drawW = targetW;
        drawH = targetW / srcRatio;
      }

      ctx.drawImage(sourceCanvas, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      // Apply specialized workspace filters
      let processedCanvas = fittedCanvas;
      if (slotKey === 'signature') {
        processedCanvas = binarizeSignatureCanvas(fittedCanvas, {
          bleachThreshold: slot.filters.bleachThreshold,
          inkDarkness: slot.filters.inkDarkness,
          preserveBlueInk: true,
        });
      } else if (slotKey === 'document') {
        processedCanvas = enhanceDocumentCanvas(fittedCanvas, {
          grayscale: slot.filters.grayscale,
          contrastBoost: slot.filters.contrast,
          sharpenText: slot.filters.sharpenText,
          brightness: slot.filters.brightness,
        });
      }

      if (runSeq !== slotOptimizationSeq[slotKey]) return;

      // Handle PDF vs Image output compression
      if (requirement.defaultFormat === 'application/pdf') {
        const pdfResult = await wrapCanvasToCompliantPdf(
          processedCanvas,
          targetMaxBytes,
          targetMinBytes
        );

        if (runSeq !== slotOptimizationSeq[slotKey]) return;

        const bracketPercentage =
          Math.round((pdfResult.pdfBytesLength / targetMaxBytes) * 1000) / 10;

        // Visual preview image data URL rendered directly from the enhanced canvas
        const visualPreviewUrl = processedCanvas.toDataURL('image/jpeg', 0.90);

        set({
          [`${slotKey}Slot`]: {
            ...slot,
            processedBlob: pdfResult.pdfBlob,
            processedDataUrl: visualPreviewUrl,
            processedBytes: pdfResult.pdfBytesLength,
            processedWidth: targetW,
            processedHeight: targetH,
            mimeType: 'application/pdf',
            quality: 1.0,
            iterations: 1,
            bracketPercentage,
            status: pdfResult.passed ? 'valid' : 'warning',
            statusMessage: pdfResult.passed
              ? `Passed official bounds (${bracketPercentage}% of ceiling)`
              : 'File size outside required bracket',
          },
        });
      } else {
        const compressResult = await workerBridge.compressCanvas(processedCanvas, {
          maxBytes: targetMaxBytes,
          minBytes: targetMinBytes,
          mimeType: requirement.defaultFormat || 'image/jpeg',
        });

        if (runSeq !== slotOptimizationSeq[slotKey]) return;

        set({
          [`${slotKey}Slot`]: {
            ...slot,
            processedBlob: compressResult.blob,
            processedDataUrl: compressResult.dataUrl,
            processedBytes: compressResult.finalBytes,
            processedWidth: compressResult.width,
            processedHeight: compressResult.height,
            mimeType: requirement.defaultFormat || 'image/jpeg',
            quality: compressResult.quality,
            iterations: compressResult.iterations,
            bracketPercentage: compressResult.bracketPercentage,
            status: compressResult.passed ? 'valid' : 'warning',
            statusMessage: compressResult.passed
              ? 'Passed official limits'
              : 'File size within limit',
          },
        });
      }
    } catch (err: any) {
      if (runSeq !== slotOptimizationSeq[slotKey]) return;
      console.error('Error optimizing slot:', err);
      const fallbackUrl = slot.sourceUrl || '';
      set({
        [`${slotKey}Slot`]: {
          ...slot,
          processedBlob: slot.file,
          processedDataUrl: fallbackUrl,
          processedBytes: slot.file.size,
          processedWidth: requirement.width,
          processedHeight: requirement.height,
          status: 'warning',
          statusMessage: 'Processed with standard settings',
        },
      });
    }
  },

  optimizeAllSlots: async () => {
    const slots = ['photo', 'signature', 'document'] as const;
    for (const key of slots) {
      const slot =
        key === 'photo'
          ? get().photoSlot
          : key === 'signature'
          ? get().signatureSlot
          : get().documentSlot;
      if (slot.file) {
        await get().optimizeSlot(key);
      }
    }
  },

  loadDemoDossier: async () => {
    const { photo, signature, document } = await generateDemoDossierFiles();
    const preset = usePresetStore.getState().getActivePreset();

    if (preset.slots.photo) {
      await get().setSlotFile('photo', photo);
    }
    if (preset.slots.signature) {
      await get().setSlotFile('signature', signature);
    }
    if (preset.slots.document) {
      await get().setSlotFile('document', document);
    }
  },

  // Sandbox Multi-Batch Queue implementation
  addSandboxFiles: async (files: File[]) => {
    const newCards: SandboxCardState[] = [];

    for (const file of files) {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const sourceUrl = URL.createObjectURL(file);
      const id = `sb_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

      let width = 800;
      let height = 800;

      if (isPdf) {
        try {
          const tempCanvas = await renderPdfToCanvas(file, 1.0);
          width = tempCanvas.width || 1200;
          height = tempCanvas.height || 1600;
        } catch {
          width = 1200;
          height = 1600;
        }
      } else {
        try {
          const img = new Image();
          img.src = sourceUrl;
          await new Promise<void>((res) => {
            img.onload = () => res();
            img.onerror = () => res();
          });
          width = img.naturalWidth || 800;
          height = img.naturalHeight || 800;
        } catch {
          width = 800;
          height = 800;
        }
      }

      newCards.push({
        ...createEmptySlot(),
        id,
        name: file.name,
        file,
        sourceUrl,
        sourceBytes: file.size,
        sourceWidth: width,
        sourceHeight: height,
        isPdf,
        targetMaxKB: 100, // Default 100 KB
        targetWidth: width > 1200 ? 1200 : width,
        targetHeight: height > 1200 ? Math.round((height / width) * 1200) : height,
        aspectRatio: 'Free',
        format: isPdf ? 'application/pdf' : 'image/jpeg',
      });
    }

    set((state) => ({ sandboxQueue: [...state.sandboxQueue, ...newCards] }));

    for (const card of newCards) {
      await get().optimizeSandboxCard(card.id);
    }
  },

  removeSandboxCard: (id) => {
    set((state) => {
      const target = state.sandboxQueue.find((c) => c.id === id);
      if (target?.sourceUrl) URL.revokeObjectURL(target.sourceUrl);
      return { sandboxQueue: state.sandboxQueue.filter((c) => c.id !== id) };
    });
  },

  updateSandboxCardCrop: (id, cropUpdates) => {
    set((state) => ({
      sandboxQueue: state.sandboxQueue.map((card) =>
        card.id === id ? { ...card, crop: { ...card.crop, ...cropUpdates } } : card
      ),
    }));
  },

  updateSandboxCardFilters: (id, filterUpdates) => {
    set((state) => ({
      sandboxQueue: state.sandboxQueue.map((card) =>
        card.id === id ? { ...card, filters: { ...card.filters, ...filterUpdates } } : card
      ),
    }));
  },

  updateSandboxCardTarget: (id, updates) => {
    set((state) => ({
      sandboxQueue: state.sandboxQueue.map((card) =>
        card.id === id ? { ...card, ...updates } : card
      ),
    }));
  },

  optimizeSandboxCard: async (id) => {
    const card = get().sandboxQueue.find((c) => c.id === id);
    if (!card || !card.file) return;

    const runSeq = (sandboxOptimizationSeq[id] = (sandboxOptimizationSeq[id] || 0) + 1);

    set((state) => ({
      sandboxQueue: state.sandboxQueue.map((c) =>
        c.id === id ? { ...c, status: 'optimizing', statusMessage: 'Optimizing...' } : c
      ),
    }));

    try {
      let canvas: HTMLCanvasElement;
      if (card.isPdf) {
        canvas = await renderPdfToCanvas(card.file, 1.5);
      } else {
        canvas = await createOrientedCanvas(card.file);
      }

      if (runSeq !== sandboxOptimizationSeq[id]) return;

      // Resample to targetWidth and targetHeight if defined
      const targetW = card.targetWidth || canvas.width;
      const targetH = card.targetHeight || canvas.height;

      let processedCanvas = canvas;
      if (card.targetWidth && card.targetHeight && (canvas.width !== targetW || canvas.height !== targetH)) {
        const fittedCanvas = document.createElement('canvas');
        fittedCanvas.width = targetW;
        fittedCanvas.height = targetH;
        const ctx = fittedCanvas.getContext('2d')!;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(canvas, 0, 0, targetW, targetH);
        processedCanvas = fittedCanvas;
      }

      if (card.filters.grayscale) {
        processedCanvas = enhanceDocumentCanvas(processedCanvas, {
          grayscale: true,
          contrastBoost: card.filters.contrast,
          sharpenText: card.filters.sharpenText,
          brightness: card.filters.brightness,
        });
      }

      const targetMaxBytes = card.targetMaxKB * 1024;

      if (card.format === 'application/pdf') {
        const pdfRes = await wrapCanvasToCompliantPdf(processedCanvas, targetMaxBytes);
        if (runSeq !== sandboxOptimizationSeq[id]) return;

        const bracketPercentage =
          Math.round((pdfRes.pdfBytesLength / targetMaxBytes) * 1000) / 10;

        const visualPreviewUrl = processedCanvas.toDataURL('image/jpeg', 0.90);

        set((state) => ({
          sandboxQueue: state.sandboxQueue.map((c) =>
            c.id === id
              ? {
                  ...c,
                  processedBlob: pdfRes.pdfBlob,
                  processedDataUrl: visualPreviewUrl,
                  processedBytes: pdfRes.pdfBytesLength,
                  processedWidth: targetW,
                  processedHeight: targetH,
                  bracketPercentage,
                  status: pdfRes.passed ? 'valid' : 'warning',
                  statusMessage: pdfRes.passed ? 'Passed official limits' : 'Over size limit',
                }
              : c
          ),
        }));
      } else {
        const compRes = await workerBridge.compressCanvas(processedCanvas, {
          maxBytes: targetMaxBytes,
          mimeType: card.format,
        });

        if (runSeq !== sandboxOptimizationSeq[id]) return;

        set((state) => ({
          sandboxQueue: state.sandboxQueue.map((c) =>
            c.id === id
              ? {
                  ...c,
                  processedBlob: compRes.blob,
                  processedDataUrl: compRes.dataUrl,
                  processedBytes: compRes.finalBytes,
                  processedWidth: targetW,
                  processedHeight: targetH,
                  quality: compRes.quality,
                  iterations: compRes.iterations,
                  bracketPercentage: compRes.bracketPercentage,
                  status: compRes.passed ? 'valid' : 'warning',
                  statusMessage: compRes.passed ? 'Passed official limits' : 'Over size limit',
                }
              : c
          ),
        }));
      }
    } catch (err: any) {
      if (runSeq !== sandboxOptimizationSeq[id]) return;
      set((state) => ({
        sandboxQueue: state.sandboxQueue.map((c) =>
          c.id === id
            ? {
                ...c,
                processedBlob: c.file,
                processedDataUrl: c.sourceUrl,
                processedBytes: c.file.size,
                status: 'warning',
                statusMessage: 'Loaded with original settings',
              }
            : c
        ),
      }));
    }
  },

  batchApplySandboxTarget: async (
    targetMaxKB: number,
    format?: any,
    dimensions?: { width: number; height: number; aspectRatio?: string }
  ) => {
    const queue = get().sandboxQueue;
    for (const card of queue) {
      get().updateSandboxCardTarget(card.id, {
        targetMaxKB,
        ...(format ? { format } : {}),
        ...(dimensions
          ? {
              targetWidth: dimensions.width,
              targetHeight: dimensions.height,
              aspectRatio: dimensions.aspectRatio || 'Free',
            }
          : {}),
      });
      await get().optimizeSandboxCard(card.id);
    }
  },

  clearAllSandbox: () => {
    get().sandboxQueue.forEach((c) => {
      if (c.sourceUrl) URL.revokeObjectURL(c.sourceUrl);
    });
    set({ sandboxQueue: [] });
  },
}));
