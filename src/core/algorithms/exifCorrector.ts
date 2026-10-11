/**
 * Extracts EXIF orientation tag from image ArrayBuffer
 * Standard EXIF tag: 0x0112
 */
export function getExifOrientation(buffer: ArrayBuffer): number {
  const view = new DataView(buffer);
  if (view.byteLength < 2 || view.getUint16(0, false) !== 0xffd8) {
    return 1; // Not a standard JPEG
  }

  let offset = 2;
  const length = view.byteLength;

  while (offset < length) {
    if (view.byteLength < offset + 2) break;
    const marker = view.getUint16(offset, false);
    offset += 2;

    if (marker === 0xffe1) {
      // APP1 Marker (EXIF)
      if (offset + 6 > length) break;
      const isExif =
        view.getUint32(offset + 2, false) === 0x45786966 && // 'Exif'
        view.getUint16(offset + 6, false) === 0x0000;

      if (isExif) {
        const tiffOffset = offset + 8;
        if (tiffOffset + 8 > length) break;

        const littleEndian = view.getUint16(tiffOffset, false) === 0x4949;
        const ifdOffset = view.getUint32(tiffOffset + 4, littleEndian);
        const tagsStart = tiffOffset + ifdOffset;

        if (tagsStart + 2 > length) break;
        const tagsCount = view.getUint16(tagsStart, littleEndian);

        for (let i = 0; i < tagsCount; i++) {
          const tagOffset = tagsStart + 2 + i * 12;
          if (tagOffset + 12 > length) break;
          const tag = view.getUint16(tagOffset, littleEndian);
          if (tag === 0x0112) {
            // Orientation tag
            return view.getUint16(tagOffset + 8, littleEndian);
          }
        }
      }
      break;
    } else if ((marker & 0xff00) !== 0xff00) {
      break;
    } else {
      if (offset + 2 > length) break;
      offset += view.getUint16(offset, false);
    }
  }

  return 1; // Normal default
}

/**
 * Loads an image from Blob and draws it onto a canvas with proper EXIF orientation applied
 */
export async function createOrientedCanvas(fileOrBlob: Blob): Promise<HTMLCanvasElement> {
  const buffer = await fileOrBlob.arrayBuffer();
  const orientation = getExifOrientation(buffer);

  return new Promise<HTMLCanvasElement>((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(fileOrBlob);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      const width = img.naturalWidth;
      const height = img.naturalHeight;

      // Handle EXIF orientation transformations:
      // 1: 0 deg
      // 3: 180 deg
      // 6: 90 deg clockwise
      // 8: 90 deg counter-clockwise (270 deg)
      if ([5, 6, 7, 8].includes(orientation)) {
        canvas.width = height;
        canvas.height = width;
      } else {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.save();
      switch (orientation) {
        case 2:
          // Horizontal flip
          ctx.translate(width, 0);
          ctx.scale(-1, 1);
          break;
        case 3:
          // 180 rotate
          ctx.translate(width, height);
          ctx.rotate(Math.PI);
          break;
        case 4:
          // Vertical flip
          ctx.translate(0, height);
          ctx.scale(1, -1);
          break;
        case 5:
          // Vertical flip + 90 rotate
          ctx.rotate(0.5 * Math.PI);
          ctx.scale(1, -1);
          break;
        case 6:
          // 90 rotate clockwise
          ctx.translate(height, 0);
          ctx.rotate(0.5 * Math.PI);
          break;
        case 7:
          // Horizontal flip + 90 rotate
          ctx.rotate(0.5 * Math.PI);
          ctx.translate(width, -height);
          ctx.scale(-1, 1);
          break;
        case 8:
          // 270 rotate (90 counter-clockwise)
          ctx.translate(0, width);
          ctx.rotate(-0.5 * Math.PI);
          break;
        default:
          break;
      }

      ctx.drawImage(img, 0, 0);
      ctx.restore();
      resolve(canvas);
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };

    img.src = url;
  });
}
