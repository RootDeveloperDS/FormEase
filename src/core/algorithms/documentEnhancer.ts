export interface DocumentEnhanceOptions {
  grayscale: boolean;
  contrastBoost: number; // 1.0 (normal) to 2.0 (high)
  sharpenText: boolean;
  brightness: number; // -50 to +50, default +10 to clean dingy paper
}

/**
 * Enhances certificate and marksheet documents via grayscale desaturation and text sharpening
 */
export function enhanceDocumentCanvas(
  sourceCanvas: HTMLCanvasElement | OffscreenCanvas,
  options: DocumentEnhanceOptions
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

  const contrast = typeof options.contrastBoost === 'number' ? options.contrastBoost : 1.1; // 1.0 = normal, 1.25 = punchy
  const brightness = typeof options.brightness === 'number' ? options.brightness : 0; // -50 to +50

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    if (options.grayscale) {
      // ITU-R BT.709 Grayscale conversion
      const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      r = gray;
      g = gray;
      b = gray;
    }

    // Apply contrast and brightness around midpoint 128
    // Preserves polarity so white paper stays crisp white and black text stays readable
    r = (r - 128) * contrast + 128 + brightness;
    g = (g - 128) * contrast + 128 + brightness;
    b = (b - 128) * contrast + 128 + brightness;

    data[i] = Math.min(255, Math.max(0, Math.round(r)));
    data[i + 1] = Math.min(255, Math.max(0, Math.round(g)));
    data[i + 2] = Math.min(255, Math.max(0, Math.round(b)));
  }

  ctx.putImageData(imageData, 0, 0);

  // If text sharpening is requested, run 3x3 unsharp convolution kernel
  if (options.sharpenText) {
    return applyTextSharpeningKernel(outputCanvas);
  }

  return outputCanvas;
}

/**
 * High-pass 3x3 unsharp masking filter for fine document text and university stamps
 */
function applyTextSharpeningKernel(sourceCanvas: HTMLCanvasElement): HTMLCanvasElement {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;

  const sharpenedCanvas = document.createElement('canvas');
  sharpenedCanvas.width = width;
  sharpenedCanvas.height = height;
  const ctx = sharpenedCanvas.getContext('2d', { willReadFrequently: true })!;

  const srcCtx = sourceCanvas.getContext('2d', { willReadFrequently: true })!;
  const srcData = srcCtx.getImageData(0, 0, width, height);
  const src = srcData.data;

  const dstData = ctx.createImageData(width, height);
  const dst = dstData.data;

  // Unsharp mask 3x3 kernel:
  // [  0, -0.5,  0 ]
  // [ -0.5, 3.0, -0.5 ]
  // [  0, -0.5,  0 ]
  const kCenter = 3.0;
  const kEdge = -0.5;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const topIdx = ((y - 1) * width + x) * 4;
      const bottomIdx = ((y + 1) * width + x) * 4;
      const leftIdx = (y * width + (x - 1)) * 4;
      const rightIdx = (y * width + (x + 1)) * 4;

      for (let c = 0; c < 3; c++) {
        const val =
          kCenter * src[idx + c] +
          kEdge * (src[topIdx + c] + src[bottomIdx + c] + src[leftIdx + c] + src[rightIdx + c]);

        dst[idx + c] = Math.min(255, Math.max(0, Math.round(val)));
      }
      dst[idx + 3] = src[idx + 3]; // Preserve alpha
    }
  }

  // Copy borders
  for (let x = 0; x < width; x++) {
    const top = x * 4;
    const btm = ((height - 1) * width + x) * 4;
    for (let c = 0; c < 4; c++) {
      dst[top + c] = src[top + c];
      dst[btm + c] = src[btm + c];
    }
  }
  for (let y = 0; y < height; y++) {
    const left = (y * width) * 4;
    const right = (y * width + (width - 1)) * 4;
    for (let c = 0; c < 4; c++) {
      dst[left + c] = src[left + c];
      dst[right + c] = src[right + c];
    }
  }

  ctx.putImageData(dstData, 0, 0);
  return sharpenedCanvas;
}
