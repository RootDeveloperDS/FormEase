import { compressToNearCeiling } from '../algorithms/binarySearchCompress';
import type { CompressionTarget } from '../algorithms/binarySearchCompress';
import { binarizeSignatureCanvas } from '../algorithms/binarizeSignature';
import type { SignatureFilterOptions } from '../algorithms/binarizeSignature';
import { enhanceDocumentCanvas } from '../algorithms/documentEnhancer';
import type { DocumentEnhanceOptions } from '../algorithms/documentEnhancer';

export interface WorkerTaskPayload {
  id: string;
  type: 'COMPRESS' | 'BINARIZE_SIGNATURE' | 'ENHANCE_DOCUMENT';
  imageBitmap?: ImageBitmap;
  target?: CompressionTarget;
  sigOptions?: SignatureFilterOptions;
  docOptions?: DocumentEnhanceOptions;
}

export interface WorkerResponsePayload {
  id: string;
  success: boolean;
  result?: any;
  error?: string;
}

self.onmessage = async (e: MessageEvent<WorkerTaskPayload>) => {
  const { id, type, imageBitmap, target, sigOptions, docOptions } = e.data;

  try {
    if (!imageBitmap) {
      throw new Error('No ImageBitmap provided to worker');
    }

    const offscreen = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
    const ctx = offscreen.getContext('2d')!;
    ctx.drawImage(imageBitmap, 0, 0);

    if (type === 'COMPRESS') {
      const res = await compressToNearCeiling(offscreen, target || { maxBytes: 50 * 1024 });
      self.postMessage({ id, success: true, result: res });
    } else if (type === 'BINARIZE_SIGNATURE') {
      const binarized = binarizeSignatureCanvas(offscreen, sigOptions || { bleachThreshold: 180, inkDarkness: 1.2 });
      const blob = await (binarized as any).convertToBlob({ type: 'image/png' });
      self.postMessage({ id, success: true, result: { blob } });
    } else if (type === 'ENHANCE_DOCUMENT') {
      const enhanced = enhanceDocumentCanvas(offscreen, docOptions || { grayscale: true, contrastBoost: 1.2, sharpenText: true, brightness: 10 });
      const blob = await (enhanced as any).convertToBlob({ type: 'image/jpeg', quality: 0.9 });
      self.postMessage({ id, success: true, result: { blob } });
    } else {
      throw new Error(`Unknown task type: ${type}`);
    }
  } catch (err: any) {
    self.postMessage({ id, success: false, error: err.message || 'Worker processing failed' });
  } finally {
    if (imageBitmap) {
      imageBitmap.close();
    }
  }
};
