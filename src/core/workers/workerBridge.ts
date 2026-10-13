import { compressToNearCeiling, canvasToBlob, blobToDataUrl } from '../algorithms/binarySearchCompress';
import type { CompressionResult, CompressionTarget } from '../algorithms/binarySearchCompress';
import { binarizeSignatureCanvas } from '../algorithms/binarizeSignature';
import type { SignatureFilterOptions } from '../algorithms/binarizeSignature';
import { enhanceDocumentCanvas } from '../algorithms/documentEnhancer';
import type { DocumentEnhanceOptions } from '../algorithms/documentEnhancer';

class WorkerBridge {
  public async compressCanvas(
    canvas: HTMLCanvasElement,
    target: CompressionTarget
  ): Promise<CompressionResult> {
    try {
      return await compressToNearCeiling(canvas, target);
    } catch (err) {
      console.warn('Canvas near-ceiling compression fallback:', err);
      const mime = target.mimeType || 'image/jpeg';
      const fallbackBlob = await canvasToBlob(canvas, mime, 0.85);
      const dataUrl = await blobToDataUrl(fallbackBlob);
      const passed = fallbackBlob.size <= target.maxBytes;

      return {
        blob: fallbackBlob,
        dataUrl,
        finalBytes: fallbackBlob.size,
        quality: 0.85,
        iterations: 1,
        width: canvas.width,
        height: canvas.height,
        passed,
        bracketPercentage: Math.round((fallbackBlob.size / target.maxBytes) * 1000) / 10,
      };
    }
  }

  public async processSignature(
    canvas: HTMLCanvasElement,
    options: SignatureFilterOptions
  ): Promise<HTMLCanvasElement> {
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
