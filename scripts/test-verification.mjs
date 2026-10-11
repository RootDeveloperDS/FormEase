import assert from 'assert';
import { formatBytes, formatDimensions, parseKbToBytes } from '../src/utils/byteFormatter.ts';
import { generateValidationSummary, getStandardizedFileName } from '../src/utils/zipBundler.ts';
import { DEFAULT_PRESETS } from '../src/core/presets/defaultPresets.ts';

console.log('=== Running FormEase Automated Algorithmic Verification ===');

// Test 1: Byte Formatter & Target Ceilings
assert.strictEqual(formatBytes(50 * 1024), '50 KB');
assert.strictEqual(formatBytes(240 * 1024), '240 KB');
assert.strictEqual(formatDimensions(600, 600), '600 × 600 px');
assert.strictEqual(parseKbToBytes(50), 51200);
console.log('✔ Test 1 Passed: Byte and dimension formatting');

// Test 2: Near-Ceiling Target Bracket Math
const ceiling50 = 50 * 1024;
const floor92 = ceiling50 * 0.92;
const ceiling98 = ceiling50 * 0.985;
assert(floor92 === 47104, 'Floor 92% is 47,104 bytes (46 KB)');
assert(ceiling98 === 50432, 'Ceiling 98.5% is 50,432 bytes (49.2 KB)');
console.log(`✔ Test 2 Passed: 50 KB ceiling targets bracket [${(floor92/1024).toFixed(1)} KB - ${(ceiling98/1024).toFixed(1)} KB]`);

// Test 3: Official Preset Matrix Completeness
assert(DEFAULT_PRESETS.length >= 8, 'At least 8 official presets defined');
const upsc = DEFAULT_PRESETS.find(p => p.id === 'in-upsc');
assert(upsc, 'UPSC preset exists');
assert(upsc.slots.photo?.targetMaxBytes === 50 * 1024, 'UPSC Photo limit is 50 KB');
assert(upsc.slots.signature?.targetMaxBytes === 20 * 1024, 'UPSC Signature limit is 20 KB');
assert(upsc.slots.document?.targetMaxBytes === 200 * 1024, 'UPSC Document limit is 200 KB');

const usVisa = DEFAULT_PRESETS.find(p => p.id === 'us-ds160');
assert(usVisa, 'US Visa preset exists');
assert(usVisa.slots.photo?.width === 600 && usVisa.slots.photo?.height === 600, 'US Visa is 600x600 px');
assert(usVisa.slots.photo?.targetMaxBytes === 240 * 1024, 'US Visa is 240 KB max');
console.log('✔ Test 3 Passed: Preset matrix verification');

// Test 4: Standardized File Naming
const mockItemPhoto = {
  id: 'photo',
  slotType: 'photo',
  title: 'Candidate Photograph',
  originalFileName: 'IMG_2026_camera_raw.jpg',
  blob: new Blob(['sample']),
  finalBytes: 48.2 * 1024,
  targetMaxBytes: 50 * 1024,
  width: 350,
  height: 350,
  mimeType: 'image/jpeg',
  quality: 0.94,
  passed: true,
  bracketPercentage: 96.4
};

const photoName = getStandardizedFileName(mockItemPhoto, 0);
assert.strictEqual(photoName, '01_PASSPORT_PHOTO_48KB.jpg');

const mockItemSig = {
  id: 'sig',
  slotType: 'signature',
  title: 'Signature Specimen',
  originalFileName: 'scan_sign.jpg',
  blob: new Blob(['sample']),
  finalBytes: 19.2 * 1024,
  targetMaxBytes: 20 * 1024,
  width: 350,
  height: 175,
  mimeType: 'image/jpeg',
  quality: 0.91,
  passed: true,
  bracketPercentage: 96.0
};
const sigName = getStandardizedFileName(mockItemSig, 1);
assert.strictEqual(sigName, '02_SIGNATURE_SPECIMEN_19KB.jpg');
console.log('✔ Test 4 Passed: Standardized file naming');

// Test 5: Validation Manifest Generation
const manifest = generateValidationSummary([mockItemPhoto, mockItemSig], {
  presetName: 'UPSC Civil Services / State PSC',
  presetId: 'in-upsc',
  authority: 'Union Public Service Commission',
  timestamp: new Date().toISOString()
});
assert(manifest.includes('CLIENT-SIDE APPLICATION DOSSIER VERIFICATION MANIFEST'));
assert(manifest.includes('01_PASSPORT_PHOTO_48KB.jpg'));
assert(manifest.includes('02_SIGNATURE_SPECIMEN_19KB.jpg'));
assert(manifest.includes('100% Client-Side Sovereign'));
assert(manifest.includes('Near-Ceiling Target: 92%-98%'));
console.log('✔ Test 5 Passed: Audit manifest generation');

console.log('\nAll Algorithmic Tests Passed Successfully (5/5)!');
