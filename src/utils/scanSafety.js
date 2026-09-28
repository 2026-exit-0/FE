// The deployed API creates a session but does not dispatch a device scan.
// Enable real device scanning only after that contract is implemented and verified.
export const DEVICE_SCAN_UNAVAILABLE = '기기 촬영 연동을 준비 중입니다. 지금은 시연용 모드에서 화면을 체험할 수 있습니다.';

export function safeStreamUrl(value, pageUrl = globalThis.location?.href || 'https://localhost/') {
  if (!value || typeof value !== 'string') return null;
  try {
    const page = new URL(pageUrl);
    const url = new URL(value, page);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    if (page.protocol === 'https:' && url.protocol !== 'https:') return null;
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
