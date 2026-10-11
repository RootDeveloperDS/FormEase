import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { PDFDocument } from 'pdf-lib';
import { compressToNearCeiling } from './binarySearchCompress';

// Configure offline worker bundle for Vite
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

/**
 * Renders the first page of an uploaded PDF file onto an HTMLCanvasElement
 */
export async function renderPdfToCanvas(
  fileOrBlob: Blob,
  scale = 2.0
): Promise<HTMLCanvasElement> {
  const arrayBuffer = await fileOrBlob.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdfDoc = await loadingTask.promise;
  const page = await pdfDoc.getPage(1);

  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d')!;

  const renderContext = {
    canvasContext: ctx,
    viewport: viewport,
  };

  await page.render(renderContext as any).promise;
  return canvas;
}

export interface PdfWrapResult {
  pdfBlob: Blob;
  pdfBytesLength: number;
  dataUrl: string;
  passed: boolean;
  pageCount: number;
}

/**
 * Wraps an optimized canvas into a compliant single-page PDF with 4 KB headroom guardrail
 */
export async function wrapCanvasToCompliantPdf(
  canvas: HTMLCanvasElement,
  targetMaxBytes: number,
  targetMinBytes?: number
): Promise<PdfWrapResult> {
  // Headroom rule: PDF wrapper structure (xref, catalog, pages, trailers) takes ~3-4 KB.
  // Set image compression target ceiling to (targetMaxBytes - 4 KB).
  const imageCeiling = Math.max(10 * 1024, targetMaxBytes - 4 * 1024);

  // Compress canvas to JPEG image blob targeting imageCeiling
  let imageResult = await compressToNearCeiling(canvas, {
    maxBytes: imageCeiling,
    minBytes: targetMinBytes ? Math.max(5 * 1024, targetMinBytes - 4 * 1024) : undefined,
    mimeType: 'image/jpeg',
  });

  let imageBytes = await imageResult.blob.arrayBuffer();

  // Build PDF Document using pdf-lib
  let pdfDoc = await PDFDocument.create();
  let embeddedImage = await pdfDoc.embedJpg(imageBytes);

  // Standard A4 dimensions in PDF points (72 DPI): 595.28 x 841.89
  const imgWidth = embeddedImage.width;
  const imgHeight = embeddedImage.height;
  const aspectRatio = imgWidth / imgHeight;

  let pageWidth = 595.28;
  let pageHeight = pageWidth / aspectRatio;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  page.drawImage(embeddedImage, {
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
  });

  let pdfBytes = await pdfDoc.save();

  // Guardrail check: if pdfBytes exceeds targetMaxBytes, perform micro-downscale pass
  if (pdfBytes.length > targetMaxBytes) {
    const tighterCeiling = Math.max(8 * 1024, targetMaxBytes - 6 * 1024);
    imageResult = await compressToNearCeiling(canvas, {
      maxBytes: tighterCeiling,
      mimeType: 'image/jpeg',
    });
    imageBytes = await imageResult.blob.arrayBuffer();

    pdfDoc = await PDFDocument.create();
    embeddedImage = await pdfDoc.embedJpg(imageBytes);
    pageWidth = 595.28;
    pageHeight = pageWidth / (embeddedImage.width / embeddedImage.height);
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
    });
    pdfBytes = await pdfDoc.save();
  }

  const pdfBlob = new Blob([pdfBytes as any], { type: 'application/pdf' });
  const dataUrl = URL.createObjectURL(pdfBlob);

  return {
    pdfBlob,
    pdfBytesLength: pdfBytes.length,
    dataUrl,
    passed: pdfBytes.length <= targetMaxBytes && (!targetMinBytes || pdfBytes.length >= targetMinBytes),
    pageCount: 1,
  };
}
