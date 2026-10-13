import { getExifOrientation } from '../src/core/algorithms/exifCorrector.ts';

// Test 1: Empty or short buffer
console.log('Short buffer:', getExifOrientation(new ArrayBuffer(10)));

// Test 2: JPEG without EXIF (just JFIF and SOS)
const jpegHeader = [
  0xff, 0xd8, // SOI
  0xff, 0xe0, 0x00, 0x10, // APP0 (length 16)
  0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
  0xff, 0xda, 0x00, 0x0c, // SOS
  0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3f, 0x00,
  0x12, 0x34, 0xff, 0x00, 0x56, 0x78 // Entropy data with 0xFF00
];

const buf = new Uint8Array(jpegHeader).buffer;
try {
  const orient = getExifOrientation(buf);
  console.log('JPEG with JFIF & SOS orientation:', orient);
} catch (e) {
  console.error('getExifOrientation crashed:', e);
}

// Test 3: What if buffer has random 0xFF bytes in entropy data?
const jpegCorrupt = [
  0xff, 0xd8,
  0xff, 0xe0, 0x00, 0x06, 0x00, 0x00, 0x00, 0x00,
  0xff, 0xda, 0x00, 0x06, 0x00, 0x00, 0x00, 0x00,
  0xff, 0x20 // not a valid marker with length!
];
try {
  const orient = getExifOrientation(new Uint8Array(jpegCorrupt).buffer);
  console.log('Corrupt/Entropy orientation:', orient);
} catch (e) {
  console.error('getExifOrientation crashed on corrupt/entropy:', e);
}
