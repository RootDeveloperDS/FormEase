import { compressToNearCeiling } from '../algorithms/binarySearchCompress';
import type { CompressionResult, CompressionTarget } from '../algorithms/binarySearchCompress';
import { binarizeSignatureCanvas } from '../algorithms/binarizeSignature';
import type { SignatureFilterOptions } from '../algorithms/binarizeSignature';
import { enhanceDocumentCanvas } from '../algorithms/documentEnhancer';
import type { DocumentEnhanceOptions } from '../algorithms/documentEnhancer';

class WorkerBridge {
  private worker: Worker | null = null;
  private pendingCallbacks = new Map<string, { resolve: (val: any) => void; reject: (err: any) => void }>();
  private idCounter = 0;
  private workerSupported = false;

  constructor() {
    if (typeof window !== 'undefined' && typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined') {
      try {
        this.worker = new Worker(new URL('./compression.worker.ts', import.meta.url), { type: 'module' });
        this.worker.onmessage = (e) => {
          const { id, success, result, error } = e.data;
          const handler = this.pendingCallbacks.get(id);
          if (handler) {
            this.pendingCallbacks.delete(id);
            if (success) handler.resolve(result);
            else handler.reject(new Error(error));
          }
        };
        this.workerSupported = true;
      } catch (err) {
        console.warn('Web Worker initialization fallback to main-thread processing:', err);
        this.workerSupported = false;
      }
    }
  }

  public async compressCanvas(
    canvas: HTMLCanvasElement,
    target: CompressionTarget
  ): Promise<CompressionResult> {
    // Fallback or direct execution if worker not available
    if (!this.workerSupported || !this.worker) {
      return compressToNearCeiling(canvas, target);
    }

    try {
      const bitmap = await createImageBitmap(canvas);
      const taskId = `compress_${++this.idCounter}`;

      return new Promise<CompressionResult>((resolve, reject) => {
        this.pendingCallbacks.set(taskId, { resolve, reject });
        this.worker!.postMessage(
          {
            id: taskId,
            type: 'COMPRESS',
            imageBitmap: bitmap,
            target,
          },
          [bitmap]
        );
      });
    } catch {
      // In case bitmap transfer fails, fallback gracefully to canvas
      return compressToNearCeiling(canvas, target);
    }
  }

  public async processSignature(
    canvas: HTMLCanvasElement,
    options: SignatureFilterOptions
  ): Promise<HTMLCanvasElement> {
    // Pure sync / fast filter on canvas
    return binarizeSignatureCanvas(canvas, options);
  }

  public async processDocument(
    canvas: HTMLCanvasElement,
    options: DocumentEnhanceOptions
  ): Promise<HTMLCanvasElement> {
    return enhanceDocumentCanvas(canvas, options);
  }
}

export const workerBridge = new WorkerBridge();
