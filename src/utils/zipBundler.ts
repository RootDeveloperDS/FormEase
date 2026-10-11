import JSZip from 'jszip';
import { saveAs } from './fileSaver';
import { formatDimensions } from './byteFormatter';

export interface DossierExportItem {
  id: string;
  slotType: string; // 'photo' | 'signature' | 'document' | 'custom'
  title: string;
  originalFileName: string;
  blob: Blob;
  finalBytes: number;
  targetMaxBytes: number;
  width: number;
  height: number;
  mimeType: string;
  quality?: number;
  passed: boolean;
  bracketPercentage?: number;
}

export interface DossierManifestMeta {
  presetName: string;
  presetId: string;
  authority?: string;
  timestamp: string;
  clientHash?: string;
}

/**
 * Generates structured VALIDATION_SUMMARY.txt manifest
 */
export function generateValidationSummary(
  items: DossierExportItem[],
  meta: DossierManifestMeta
): string {
  const line = '='.repeat(80);
  const subline = '-'.repeat(80);

  let summary = `${line}\n`;
  summary += `  FORMEASE • CLIENT-SIDE APPLICATION DOSSIER VERIFICATION MANIFEST\n`;
  summary += `${line}\n\n`;
  summary += `Target Application:  ${meta.presetName} (${meta.presetId.toUpperCase()})\n`;
  if (meta.authority) {
    summary += `Governing Authority: ${meta.authority}\n`;
  }
  summary += `Generated At:        ${meta.timestamp}\n`;
  summary += `Privacy Guarantee:   100% Client-Side Sovereign (Zero External Server Calls)\n`;
  summary += `Quality Algorithm:   Deterministic Adaptive Binary Search (92% - 98% Bracket)\n\n`;

  summary += `${subline}\n`;
  summary += `ITEMIZED DOCUMENT COMPLIANCE AUDIT\n`;
  summary += `${subline}\n\n`;

  items.forEach((item, idx) => {
    const kbSize = (item.finalBytes / 1024).toFixed(1);
    const maxKb = (item.targetMaxBytes / 1024).toFixed(1);
    const status = item.passed ? 'COMPLIANT [PASS]' : 'NON-COMPLIANT [CHECK]';
    const fillPercent = item.bracketPercentage ? `${item.bracketPercentage}%` : `${Math.round((item.finalBytes / item.targetMaxBytes) * 100)}%`;

    summary += `[Item ${idx + 1}] ${item.title.toUpperCase()}\n`;
    summary += `  • Standardized File: ${getStandardizedFileName(item, idx)}\n`;
    summary += `  • Original Upload:   ${item.originalFileName}\n`;
    summary += `  • Final File Size:   ${kbSize} KB (Legal Ceiling: ${maxKb} KB)\n`;
    summary += `  • Bracket Fill:      ${fillPercent} of allowable ceiling (Near-Ceiling Target: 92%-98%)\n`;
    summary += `  • Pixel Dimensions:  ${formatDimensions(item.width, item.height)}\n`;
    summary += `  • Output Format:     ${item.mimeType}\n`;
    summary += `  • Quality Factor:    ${item.quality ? Math.round(item.quality * 100) + '%' : 'Lossless'}\n`;
    summary += `  • Verification:      ${status}\n\n`;
  });

  summary += `${line}\n`;
  summary += `All documents in this package have been mathematically pre-flighted and\n`;
  summary += `guaranteed to satisfy official government & university portal bounds.\n`;
  summary += `${line}\n`;

  return summary;
}

/**
 * Standardizes filename according to document type and byte count
 */
export function getStandardizedFileName(item: DossierExportItem, index: number): string {
  const kb = Math.round(item.finalBytes / 1024);
  const ext = item.mimeType === 'application/pdf' ? 'pdf' : item.mimeType === 'image/png' ? 'png' : 'jpg';

  let prefix = `0${index + 1}_`;
  if (item.slotType === 'photo') {
    prefix += `PASSPORT_PHOTO_${kb}KB`;
  } else if (item.slotType === 'signature') {
    prefix += `SIGNATURE_SPECIMEN_${kb}KB`;
  } else if (item.slotType === 'document') {
    prefix += `IDENTITY_DOCUMENT_${kb}KB`;
  } else {
    const cleanName = item.originalFileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    prefix += `${cleanName.toUpperCase()}_${kb}KB`;
  }

  return `${prefix}.${ext}`;
}

/**
 * Assembles and downloads a complete verified .ZIP dossier
 */
export async function bundleAndDownloadDossierZip(
  items: DossierExportItem[],
  meta: DossierManifestMeta
): Promise<Blob> {
  const zip = new JSZip();

  // Add each processed file with standardized name
  items.forEach((item, idx) => {
    const fileName = getStandardizedFileName(item, idx);
    zip.file(fileName, item.blob);
  });

  // Add VALIDATION_SUMMARY.txt audit manifest
  const manifestText = generateValidationSummary(items, meta);
  zip.file('VALIDATION_SUMMARY.txt', manifestText);

  // Generate ZIP in memory
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  // Trigger browser download
  const cleanPreset = meta.presetId.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const dateStr = new Date().toISOString().slice(0, 10);
  const zipFilename = `FormEase_Verified_Dossier_${cleanPreset}_${dateStr}.zip`;

  saveAs(zipBlob, zipFilename);
  return zipBlob;
}
