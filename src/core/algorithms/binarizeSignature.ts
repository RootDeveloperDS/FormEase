export interface SignatureFilterOptions {
  bleachThreshold: number; // 0 to 255, default ~180-200
  inkDarkness: number; // 0.5 to 2.5, default 1.2
  preserveBlueInk?: boolean; // retain pen's natural blue hue vs pure black
  feathering?: number; // smoothness at stroke boundaries (0 to 1)
}

/**
 * Calculates optimal Otsu threshold or high-percentile luminance for signature background
 */
export function estimatePaperLuminance(imageData: ImageData): number {
  const data = imageData.data;
  const histogram = new Uint32Array(256);
  let totalPixels = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const l = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    histogram[l]++;
    totalPixels++;
  }

  // Find 70th percentile luminance (paper dominates in signature photos)
  let count = 0;
  for (let l = 0; l < 256; l++) {
    count += histogram[l];
    if (count >= totalPixels * 0.65) {
      // Background is usually around this luminance or slightly lower
      return Math.max(130, Math.min(235, l - 15));
    }
  }

  return 190;
}

/**
 * Applies one-click paper bleaching and dynamic ink thresholding to signature canvas
 */
export function binarizeSignatureCanvas(
  sourceCanvas: HTMLCanvasElement | OffscreenCanvas,
  options: SignatureFilterOptions
): HTMLCanvasElement {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;

  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = width;
  outputCanvas.height = height;
  const ctx = outputCanvas.getContext('2d', { willReadFrequently: true })!;

  ctx.drawImage(sourceCanvas as CanvasImageSource, 0, 0);
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const threshold = options.bleachThreshold;
  const inkDarkness = options.inkDarkness;
  const preserveBlue = options.preserveBlueInk ?? true;

  // Linear transition band for anti-aliasing edges
  const feather = Math.max(4, Math.floor(threshold * 0.08));
  const lowerBound = threshold - feather;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Standard NTSC Luminance
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    if (lum >= threshold) {
      // Paper background -> Pure Clean White #FFFFFF
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
    } else if (lum > lowerBound) {
      // Smooth edge antialiasing band to prevent jagged pixelation
      const factor = (lum - lowerBound) / feather; // 0 (ink) to 1 (paper)
      const bleachedR = 255 * factor + (r * (1 - factor));
      const bleachedG = 255 * factor + (g * (1 - factor));
      const bleachedB = 255 * factor + (b * (1 - factor));

      data[i] = Math.min(255, Math.max(0, Math.round(bleachedR)));
      data[i + 1] = Math.min(255, Math.max(0, Math.round(bleachedG)));
      data[i + 2] = Math.min(255, Math.max(0, Math.round(bleachedB)));
    } else {
      // Ink stroke -> Darken & boost contrast
      if (preserveBlue && b > r + 15 && b > g + 10) {
        // Pen is distinctly blue - boost blue ink clarity
        const darkFactor = Math.pow(lum / lowerBound, inkDarkness);
        data[i] = Math.max(0, Math.round(r * darkFactor * 0.6));
        data[i + 1] = Math.max(0, Math.round(g * darkFactor * 0.65));
        data[i + 2] = Math.min(200, Math.max(40, Math.round(b * (0.8 + 0.2 * darkFactor))));
      } else {
        // Standard black or dark blue ink
        const contrastLum = Math.pow(lum / lowerBound, inkDarkness) * 255;
        const finalVal = Math.min(255, Math.max(0, Math.round(contrastLum * 0.65)));
        data[i] = finalVal;
        data[i + 1] = finalVal;
        data[i + 2] = finalVal;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return outputCanvas;
}
