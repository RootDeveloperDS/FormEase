/**
 * Extracts EXIF orientation tag from image ArrayBuffer
 * Standard EXIF tag: 0x0112
 */
export function getExifOrientation(buffer: ArrayBuffer): number {
  try {
    const view = new DataView(buffer);
    if (view.byteLength < 2 || view.getUint16(0, false) !== 0xffd8) {
      return 1; // Not a standard JPEG
    }

    let offset = 2;
    const length = view.byteLength;

    while (offset < length - 2) {
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
        const markerLength = view.getUint16(offset, false);
        if (markerLength < 2) break;
        offset += markerLength;
      }
    }
  } catch (err) {
    console.warn('EXIF parsing safely recovered:', err);
  }

  return 1; // Normal default
}

/**
 * Loads an image from Blob and draws it onto a canvas with proper EXIF orientation applied
 */
export async function createOrientedCanvas(fileOrBlob: Blob): Promise<HTMLCanvasElement> {
  let orientation = 1;
  try {
    const buffer = await fileOrBlob.arrayBuffer();
    orientation = getExifOrientation(buffer);
  } catch {
    orientation = 1;
  }

  return new Promise<HTMLCanvasElement>((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(fileOrBlob);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(canvas);
        return;
      }

      const width = Math.max(1, img.naturalWidth || 800);
      const height = Math.max(1, img.naturalHeight || 800);

      // Handle EXIF orientation transformations:
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
          ctx.translate(width, 0);
          ctx.scale(-1, 1);
          break;
        case 3:
          ctx.translate(width, height);
          ctx.rotate(Math.PI);
          break;
        case 4:
          ctx.translate(0, height);
          ctx.scale(1, -1);
          break;
        case 5:
          ctx.rotate(0.5 * Math.PI);
          ctx.scale(1, -1);
          break;
        case 6:
          ctx.translate(height, 0);
          ctx.rotate(0.5 * Math.PI);
          break;
        case 7:
          ctx.rotate(0.5 * Math.PI);
          ctx.translate(width, -height);
          ctx.scale(-1, 1);
          break;
        case 8:
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

    img.onerror = () => {
      URL.revokeObjectURL(url);
      const fallback = document.createElement('canvas');
      fallback.width = 600;
      fallback.height = 600;
      resolve(fallback);
    };

    img.src = url;
  });
}
