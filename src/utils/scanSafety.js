export function safeStreamUrl(value, pageUrl = globalThis.location?.href || 'https://localhost/', { allowLocalHttp = false } = {}) {
  if (!value || typeof value !== 'string') return null;
  try {
    const page = new URL(pageUrl);
    const url = new URL(value, page);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    if (url.username || url.password) return null;
    const parts = url.hostname.split('.').map(Number);
    const privateIp = /^\d+\.\d+\.\d+\.\d+$/.test(url.hostname) &&
      parts.every(n => n >= 0 && n <= 255) &&
      (parts[0] === 10 || (parts[0] === 192 && parts[1] === 168) ||
        (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31));
    if (page.protocol === 'https:' && url.protocol !== 'https:' && !(allowLocalHttp && privateIp)) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function scanImages(scan) {
  const demo = scan?.is_mock === true || scan?._raw?.is_mock === true;
  const pick = (value, fallback) => {
    if (typeof value === 'string' && value.trim()) {
      // Older persisted real results may contain the previous demo fallback.
      if (!demo && value.includes('/assets/demo_')) return null;
      return value;
    }
    return demo ? fallback : null;
  };
  return {
    white_image_url: pick(scan?.white_image_url || scan?.image_url || scan?.white_img, '/assets/demo_white_light.jpg'),
    uv_image_url: pick(scan?.uv_image_url || scan?.uv_img, '/assets/demo_uv_light.jpg'),
  };
}

export function scannerStatus(data) {
  if (!data || typeof data !== 'object' || typeof data.connected !== 'boolean') {
    throw new Error('스캐너 상태 응답을 확인할 수 없습니다. 잠시 후 다시 확인해 주세요.');
  }
  return {
    status: data.connected && data.status === 'ok' ? 'ok' : 'unreachable',
    message: data.connected && data.status === 'ok' ? '스캐너 응답 확인됨' : '스캐너 연결을 확인할 수 없습니다.',
    connected: data.connected && data.status === 'ok',
  };
}
