export interface CompressionTarget {
  maxBytes: number;
  minBytes?: number;
  targetWidth?: number;
  targetHeight?: number;
  mimeType?: string; // default 'image/jpeg'
}

export interface CompressionResult {
  blob: Blob;
  dataUrl: string;
  finalBytes: number;
  quality: number;
  iterations: number;
  width: number;
  height: number;
  passed: boolean;
  bracketPercentage: number; // e.g. 96.4%
}

/**
 * Deterministic Adaptive Binary Search Quality Convergence loop
 * Mathematically targets the near-ceiling bracket [92% - 98.5%] of maximum allowed bytes.
 */
export async function compressToNearCeiling(
  sourceCanvas: HTMLCanvasElement | OffscreenCanvas,
  target: CompressionTarget,
  maxIterations = 7,
  recursionDepth = 0
): Promise<CompressionResult> {
  const mimeType = target.mimeType || 'image/jpeg';
  const targetCeiling = Math.max(1024, target.maxBytes);
  // Near ceiling optimal bracket: 92% to 98.5%
  const optimalFloor = targetCeiling * 0.92;
  const optimalCeiling = targetCeiling * 0.985;

  let currentCanvas: HTMLCanvasElement | OffscreenCanvas = sourceCanvas;
  const curWidth = Math.max(1, currentCanvas.width);
  const curHeight = Math.max(1, currentCanvas.height);

  // For PNG, browser canvas doesn't support quality param; size depends purely on dimensions/data
  if (mimeType === 'image/png') {
    const pngBlob = await canvasToBlob(currentCanvas, 'image/png');
    if (pngBlob.size <= targetCeiling || recursionDepth > 3) {
      const dataUrl = await blobToDataUrl(pngBlob);
      return {
        blob: pngBlob,
        dataUrl,
        finalBytes: pngBlob.size,
        quality: 1.0,
        iterations: 1,
        width: curWidth,
        height: curHeight,
        passed: pngBlob.size <= targetCeiling,
        bracketPercentage: Math.round((pngBlob.size / targetCeiling) * 1000) / 10,
      };
    }
    // Scale down canvas for PNG to fit ceiling
    const scaledCanvas = createScaledCanvas(currentCanvas, 0.88);
    return compressToNearCeiling(scaledCanvas, target, maxIterations, recursionDepth + 1);
  }

  let low = 0.05;
  let high = 0.99;
  let bestBlob: Blob | null = null;
  let bestQuality = 0.85;
  let totalIterations = 0;

  for (let i = 0; i < maxIterations; i++) {
    totalIterations++;
    const midQuality = (low + high) / 2;
    const blob = await canvasToBlob(currentCanvas, mimeType, midQuality);

    if (blob.size <= targetCeiling) {
      bestBlob = blob;
      bestQuality = midQuality;

      // Check if we hit the sweet spot: 92% to 98.5% of limit
      if (blob.size >= optimalFloor && blob.size <= optimalCeiling) {
        break; // Optimal near-ceiling achieved!
      }

      // If file is below 92%, attempt higher quality to preserve visual sharpness
      low = midQuality;
    } else {
      // File exceeds target ceiling, lower quality
      high = midQuality;
    }
  }

  // Resolution Guardrail:
  // If no blob under ceiling was found, OR quality had to drop below 0.22 (resulting in nasty artifacts),
  // slightly downscale canvas dimensions by 8% and re-converge.
  if ((!bestBlob || bestBlob.size > targetCeiling || bestQuality < 0.22) && recursionDepth < 3) {
    const scaleFactor = bestQuality < 0.22 ? 0.90 : 0.92;
    const scaledCanvas = createScaledCanvas(currentCanvas, scaleFactor);
    return compressToNearCeiling(scaledCanvas, target, maxIterations, recursionDepth + 1);
  }

  // Fallback to minimal valid blob or lowest quality candidate
  if (!bestBlob) {
    bestBlob = await canvasToBlob(currentCanvas, mimeType, 0.1);
    bestQuality = 0.1;
  }

  const dataUrl = await blobToDataUrl(bestBlob);
  const passed = bestBlob.size <= targetCeiling && (!target.minBytes || bestBlob.size >= target.minBytes);
  const bracketPercentage = Math.round((bestBlob.size / targetCeiling) * 1000) / 10;

  return {
    blob: bestBlob,
    dataUrl,
    finalBytes: bestBlob.size,
    quality: Math.round(bestQuality * 100) / 100,
    iterations: totalIterations,
    width: curWidth,
    height: curHeight,
    passed,
    bracketPercentage,
  };
}

/**
 * Universal canvas to blob wrapper supporting both HTMLCanvasElement and OffscreenCanvas
 */
export async function canvasToBlob(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  mimeType: string,
  quality?: number
): Promise<Blob> {
  if (typeof HTMLCanvasElement !== 'undefined' && canvas instanceof HTMLCanvasElement) {
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to generate canvas blob'));
        },
        mimeType,
        quality
      );
    });
  } else if (typeof OffscreenCanvas !== 'undefined' && canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({
      type: mimeType,
      quality,
    });
  } else {
    throw new Error('Unsupported canvas context');
  }
}

/**
 * Universal safe utility to convert Blob to URL/DataURL
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  if (typeof URL !== 'undefined' && URL.createObjectURL) {
    return Promise.resolve(URL.createObjectURL(blob));
  }
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Creates high-quality scaled canvas supporting both browser DOM and Web Worker contexts
 */
function createScaledCanvas(
  source: HTMLCanvasElement | OffscreenCanvas,
  scale: number
): HTMLCanvasElement | OffscreenCanvas {
  const newWidth = Math.max(16, Math.floor(source.width * scale));
  const newHeight = Math.max(16, Math.floor(source.height * scale));

  if (typeof document !== 'undefined' && document.createElement) {
    const canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source as CanvasImageSource, 0, 0, newWidth, newHeight);
    return canvas;
  } else if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(newWidth, newHeight);
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source as CanvasImageSource, 0, 0, newWidth, newHeight);
    return canvas;
  } else {
    return source;
  }
}
