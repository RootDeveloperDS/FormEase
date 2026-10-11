/**
 * Format bytes into human-friendly KB or MB string
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format dimensions cleanly
 */
export function formatDimensions(width: number, height: number): string {
  return `${Math.round(width)} × ${Math.round(height)} px`;
}

/**
 * Parse human KB string into bytes
 */
export function parseKbToBytes(kb: number): number {
  return Math.round(kb * 1024);
}
