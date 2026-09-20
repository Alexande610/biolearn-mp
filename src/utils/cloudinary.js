export function getOptimizedCloudinaryImage(url, width = 512, options = {}) {
  if (!url || typeof url !== 'string') return '';
  const marker = '/image/upload/';
  const markerIndex = url.indexOf(marker);
  if (markerIndex === -1) return url;

  const safeWidth = Math.max(32, Math.min(1600, Math.round(Number(width) || 512)));
  const trimTransform = options.trim ? 'e_trim:10/' : '';
  return `${url.slice(0, markerIndex + marker.length)}${trimTransform}f_auto,q_auto,c_limit,w_${safeWidth}/${url.slice(markerIndex + marker.length)}`;
}
