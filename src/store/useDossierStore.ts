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
  batchApplySandboxTarget: (targetMaxKB: number, format?: any) => Promise<void>;
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

    let width = 0;
    let height = 0;

    if (isPdf) {
      try {
        const tempCanvas = await renderPdfToCanvas(file, 1.0);
        width = tempCanvas.width;
        height = tempCanvas.height;
      } catch {
        width = 1200;
        height = 1600;
      }
    } else {
      const img = new Image();
      img.src = sourceUrl;
      await new Promise((res) => {
        img.onload = res;
        img.onerror = res;
      });
      width = img.naturalWidth || 800;
      height = img.naturalHeight || 800;
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
      statusMessage: 'Analyzing & auto-optimizing...',
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
    if (current.processedDataUrl && current.processedDataUrl.startsWith('blob:')) {
      URL.revokeObjectURL(current.processedDataUrl);
    }
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

  optimizeSlot: async (slotKey) => {
    const slot = get()[`${slotKey}Slot` as keyof DossierState] as SlotProcessingState;
    if (!slot.file) return;

    const preset = usePresetStore.getState().getActivePreset();
    const requirement: SlotRequirement | undefined = preset.slots[slotKey];
    if (!requirement) return;

    set((state) => ({
      [`${slotKey}Slot`]: {
        ...(state[`${slotKey}Slot` as keyof DossierState] as SlotProcessingState),
        status: 'optimizing',
        statusMessage: 'Compressing to near-ceiling bracket...',
      },
    }));

    try {
      let sourceCanvas: HTMLCanvasElement;
      if (slot.isPdf) {
        sourceCanvas = await renderPdfToCanvas(slot.file, 1.5);
      } else {
        sourceCanvas = await createOrientedCanvas(slot.file);
      }

      // Create cropped/fitted canvas according to target aspect ratio and dimensions
      const targetW = requirement.width;
      const targetH = requirement.height;

      const fittedCanvas = document.createElement('canvas');
      fittedCanvas.width = targetW;
      fittedCanvas.height = targetH;
      const ctx = fittedCanvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Apply crop pan & zoom
      const zoom = slot.crop.zoom;
      const panX = slot.crop.panX;
      const panY = slot.crop.panY;

      ctx.save();
      ctx.translate(targetW / 2 + panX, targetH / 2 + panY);
      ctx.scale(zoom, zoom);
      if (slot.crop.rotation) {
        ctx.rotate((slot.crop.rotation * Math.PI) / 180);
      }

      // Scale source to cover canvas maintaining aspect ratio
      const srcRatio = sourceCanvas.width / sourceCanvas.height;
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

      // Handle PDF vs Image output compression
      if (requirement.defaultFormat === 'application/pdf') {
        const pdfResult = await wrapCanvasToCompliantPdf(
          processedCanvas,
          requirement.targetMaxBytes,
          requirement.targetMinBytes
        );

        const bracketPercentage =
          Math.round((pdfResult.pdfBytesLength / requirement.targetMaxBytes) * 1000) / 10;

        set({
          [`${slotKey}Slot`]: {
            ...slot,
            processedBlob: pdfResult.pdfBlob,
            processedDataUrl: pdfResult.dataUrl,
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
          maxBytes: requirement.targetMaxBytes,
          minBytes: requirement.targetMinBytes,
          mimeType: requirement.defaultFormat || 'image/jpeg',
        });

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
              ? `Optimal near-ceiling achieved (${compressResult.bracketPercentage}%)`
              : 'File size requires adjustment',
          },
        });
      }
    } catch (err: any) {
      console.error('Error optimizing slot:', err);
      set({
        [`${slotKey}Slot`]: {
          ...slot,
          status: 'error',
          statusMessage: err.message || 'Optimization failed',
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
    await get().setSlotFile('photo', photo);
    await get().setSlotFile('signature', signature);
    await get().setSlotFile('document', document);
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
          width = tempCanvas.width;
          height = tempCanvas.height;
        } catch {
          width = 1200;
          height = 1600;
        }
      } else {
        const img = new Image();
        img.src = sourceUrl;
        await new Promise((res) => {
          img.onload = res;
          img.onerror = res;
        });
        width = img.naturalWidth || 800;
        height = img.naturalHeight || 800;
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

    // Run optimization for each newly added card
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

    set((state) => ({
      sandboxQueue: state.sandboxQueue.map((c) =>
        c.id === id ? { ...c, status: 'optimizing', statusMessage: 'Converging...' } : c
      ),
    }));

    try {
      let canvas: HTMLCanvasElement;
      if (card.isPdf) {
        canvas = await renderPdfToCanvas(card.file, 1.5);
      } else {
        canvas = await createOrientedCanvas(card.file);
      }

      if (card.filters.grayscale) {
        canvas = enhanceDocumentCanvas(canvas, {
          grayscale: true,
          contrastBoost: card.filters.contrast,
          sharpenText: card.filters.sharpenText,
          brightness: card.filters.brightness,
        });
      }

      const targetMaxBytes = card.targetMaxKB * 1024;

      if (card.format === 'application/pdf') {
        const pdfRes = await wrapCanvasToCompliantPdf(canvas, targetMaxBytes);
        const bracketPercentage =
          Math.round((pdfRes.pdfBytesLength / targetMaxBytes) * 1000) / 10;

        set((state) => ({
          sandboxQueue: state.sandboxQueue.map((c) =>
            c.id === id
              ? {
                  ...c,
                  processedBlob: pdfRes.pdfBlob,
                  processedDataUrl: pdfRes.dataUrl,
                  processedBytes: pdfRes.pdfBytesLength,
                  bracketPercentage,
                  status: pdfRes.passed ? 'valid' : 'warning',
                  statusMessage: pdfRes.passed ? 'Compliant' : 'Over size limit',
                }
              : c
          ),
        }));
      } else {
        const compRes = await workerBridge.compressCanvas(canvas, {
          maxBytes: targetMaxBytes,
          mimeType: card.format,
        });

        set((state) => ({
          sandboxQueue: state.sandboxQueue.map((c) =>
            c.id === id
              ? {
                  ...c,
                  processedBlob: compRes.blob,
                  processedDataUrl: compRes.dataUrl,
                  processedBytes: compRes.finalBytes,
                  quality: compRes.quality,
                  iterations: compRes.iterations,
                  bracketPercentage: compRes.bracketPercentage,
                  status: compRes.passed ? 'valid' : 'warning',
                  statusMessage: compRes.passed ? 'Compliant' : 'Over size limit',
                }
              : c
          ),
        }));
      }
    } catch (err: any) {
      set((state) => ({
        sandboxQueue: state.sandboxQueue.map((c) =>
          c.id === id ? { ...c, status: 'error', statusMessage: err.message } : c
        ),
      }));
    }
  },

  batchApplySandboxTarget: async (targetMaxKB: number, format?: any) => {
    const queue = get().sandboxQueue;
    for (const card of queue) {
      get().updateSandboxCardTarget(card.id, {
        targetMaxKB,
        ...(format ? { format } : {}),
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
