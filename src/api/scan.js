import client, { isMock } from './client';
import { mockAnalysis, mockScanHistory } from '../utils/mockData';
import { getAiMode } from '../store/modeStore';
import { safeStreamUrl } from '../utils/scanSafety';
import { createScannerSessionApi } from './scannerSession';

const DEVICE_API_BASE = import.meta.env.VITE_DEVICE_API_BASE || '/device-api';
const DEFAULT_DEVICE_ID = import.meta.env.VITE_SCANNER_DEVICE_ID || 'ESP32_1';
export const scannerSession = createScannerSessionApi(client, DEFAULT_DEVICE_ID);

// ── 신규 BE 스캔 세션 생성 (POST /scans) ────────────────────
export async function createScanSession(data = {}) {
  if (isMock) {
    await delay(300);
    return { session_id: 'mock_session_' + Date.now() };
  }

  const payload = {
    scan_area: data.scan_area || data.area || '얼굴 전체',
    uv_mode: data.uv_mode ?? false,
    moisture_on: data.moisture_on ?? true,
    pore_on: data.pore_on ?? true,
    melanin_on: data.melanin_on ?? true,
    elasticity_on: data.elasticity_on ?? true,
    temperature: data.temperature ?? null,
    humidity: data.humidity ?? null,
    uv_index: data.uv_index ?? null,
  };

  const res = await client.post('/scans', payload);
  return res.data; // { session_id }
}

// ── 신규 BE 스캔 분석 (POST /scans/{id}/analyze-mock) ────────
export async function analyzeScanMock(sessionId) {
  if (isMock) {
    await delay(1500);
    return buildMockResult('얼굴 전체');
  }

  const res = await client.post(`/scans/${sessionId}/analyze-mock`);
  return res.data; // { session_id, status, total_score, result: {...}, advice: {...} }
}

// ── ESP32 기기 목록 및 스트리밍 URL 조회 (EC2 포트 8001 /devices) ───
async function deviceRequest(path, options = {}) {
  const response = await fetch(`${DEVICE_API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
    signal: options.signal || AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error(`기기 서버 응답 오류 (${response.status})`);
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('기기 서버가 올바른 응답을 보내지 않았습니다.');
  }
  return response.json();
}

export async function getEsp32Devices() {
  try {
    const devices = await deviceRequest('/devices');
    return devices && typeof devices === 'object' && !Array.isArray(devices) ? devices : {};
  } catch (err) {
    console.warn('[getEsp32Devices] 기기 조회 실패:', err);
    return {};
  }
}

export async function getEsp32StreamInfo(deviceId = 'ESP32_1') {
  if (import.meta.env.VITE_SCANNER_STREAM_URL) {
    return {
      ip: 'custom',
      streamUrl: safeStreamUrl(import.meta.env.VITE_SCANNER_STREAM_URL),
      devices: {},
    };
  }
  const devices = await getEsp32Devices();
  const ip = devices?.[deviceId] || Object.values(devices || {})[0] || null;
  return {
    ip,
    streamUrl: ip ? safeStreamUrl(`http://${ip}/stream`) : null,
    devices: devices || {},
  };
}

// ── 스캐너 상태 확인 ─────────────────────────────────────
export async function getScannerHealth() {
  if (getAiMode() === 'mock') {
    return { status: 'demo', message: '시연용 모드 · 실제 기기를 사용하지 않습니다', streamUrl: null, ip: null };
  }
  const stream = await getEsp32StreamInfo(DEFAULT_DEVICE_ID);
  if (!stream.ip) {
    return { status: 'unreachable', message: '등록된 스캐너가 없습니다. 기기 전원과 Wi-Fi를 확인해 주세요.', streamUrl: null, ip: null };
  }
  return {
    ...stream,
    status: 'ok',
    message: `기기 등록 확인됨 (${DEFAULT_DEVICE_ID}) · 실제 연결은 스캔 시 확인합니다`,
  };
}

export async function measureWithScanner(formData, { sessionId, signal, onSession } = {}) {
  const region = formData?.get?.('region') || 'FOREHEAD';
  if (getAiMode() === 'mock') {
    await delay(800);
    return buildMockResult(region);
  }
  const session = sessionId
    ? { session_id: sessionId }
    : await scannerSession.start(region, { signal });
  onSession?.(session.session_id);
  return scannerSession.wait(session.session_id, { signal });
}

// ── 사진 업로드 분석 ─────────────────────────────────────
export async function measureWithPhoto(formData) {
  const mode = getAiMode();
  const isDemo = mode === 'mock';
  const region = formData?.get?.('region') || '얼굴 전체';

  let sessionId = null;
  try {
    const session = await createScanSession({ scan_area: region });
    sessionId = session?.session_id;
  } catch (sessErr) {
    if (isDemo) {
      await delay(1200);
      return buildMockResult(region);
    }
    throw sessErr;
  }

  try {
    const uploadData = formData instanceof FormData ? formData : new FormData();
    uploadData.set('demo', isDemo ? 'true' : 'false');

    const res = await client.post(`/scans/${sessionId}/analyze`, uploadData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const data = res.data || {};
    return {
      ...data,
      session_id: sessionId,
      is_mock: data.is_mock !== undefined ? Boolean(data.is_mock) : isDemo,
    };
  } catch (err) {
    if (isDemo) {
      return buildMockResult(region);
    }
    throw err;
  }
}

// ── 분석 리포트 PDF 다운로드 (GET /report/{session_id}/pdf) ───
export async function downloadReportPdf(sessionId) {
  if (isMock || !sessionId) {
    throw new Error('MOCK_MODE');
  }

  const res = await client.get(`/report/${sessionId}/pdf`, {
    responseType: 'blob',
  });
  return res.data;
}

// ── 측정 기록 조회 ───────────────────────────────────────
export async function getScanHistory() {
  const mode = getAiMode();
  if (isMock || mode === 'mock') {
    await delay(200);
    return mockScanHistory;
  }

  const res = await client.get('/history');
  if (!Array.isArray(res.data)) throw new Error('측정 기록 응답 형식을 확인할 수 없습니다.');
  return res.data;
}

// ── 특정 스캔 조회 ───────────────────────────────────────
export async function getScanById(scanId) {
  if (isMock) {
    await delay(200);
    return { ...mockAnalysis, id: scanId };
  }

  const res = await client.get(`/result/${scanId}`);
  return res.data;
}

// ── Mock 결과 생성 헬퍼 ──────────────────────────────────
function readLocalSurvey() {
  try { return JSON.parse(localStorage.getItem('damda_survey') || 'null') || {}; }
  catch { return {}; }
}

// BE 미연동 시의 폴백. 설문(피부타입·고민)에 맞춰 값 편향 → 설문-결과 모순 방지.
// 지표 의미: moisture/elasticity/spots 높을수록 양호, oil/pigmentation 낮을수록 양호.
function buildMockResult(region) {
  const s = readLocalSurvey();
  const skinType = s.skin_type || '복합성';
  const concerns = Array.isArray(s.concerns) ? s.concerns : [];

  let moisture = rand(58, 78), oil = rand(40, 58), elasticity = rand(58, 78),
      spots = rand(58, 78), pigmentation = rand(35, 50);

  if (skinType === '건성') { moisture = rand(30, 45); oil = rand(25, 40); }
  else if (skinType === '지성') { oil = rand(68, 85); }
  else if (skinType === '민감성') { moisture = rand(40, 55); }

  if (concerns.includes('건조')) moisture = rand(28, 42);
  if (concerns.includes('모공')) spots = rand(28, 45);
  if (concerns.includes('주름') || concerns.includes('탄력')) elasticity = rand(28, 45);
  if (concerns.includes('색소침착')) pigmentation = rand(60, 80);
  if (concerns.includes('여드름')) { oil = rand(68, 85); spots = rand(30, 48); }

  const overall = Math.round((moisture + (100 - oil) + elasticity + spots + (100 - pigmentation)) / 5);

  return {
    narrative: {
      overall_score: overall,
      summary: `${region} 측정 기준 전반적으로 ${overall >= 70 ? '양호한' : '관리가 필요한'} 피부 상태입니다.`,
      per_metric: [
        { name: '수분도', value: `${moisture}%`, rating: moisture >= 60 ? 'good' : moisture >= 45 ? 'fair' : 'poor', rating_text: moisture >= 60 ? '정상' : moisture >= 45 ? '보통' : '주의', description: `측정 부위(${region}) 수분`, personalized_note: moisture < 50 ? '보습제 추가를 권장합니다.' : null },
        { name: '유분도', value: `${oil}%`, rating: oil <= 60 ? 'good' : 'fair', rating_text: oil <= 60 ? '보통' : '주의', description: `측정 부위(${region}) 유분`, personalized_note: null },
        { name: '탄력', value: `${elasticity}%`, rating: elasticity >= 60 ? 'good' : elasticity >= 45 ? 'fair' : 'poor', rating_text: elasticity >= 60 ? '정상' : elasticity >= 45 ? '보통' : '주의', description: `측정 부위(${region}) 탄력`, personalized_note: null },
        { name: '모공', value: `${spots}%`, rating: spots >= 60 ? 'good' : 'fair', rating_text: spots >= 60 ? '양호' : '관리 권장', description: `측정 부위(${region}) 모공`, personalized_note: null },
        { name: '색소침착', value: `${pigmentation}%`, rating: pigmentation <= 50 ? 'good' : 'fair', rating_text: pigmentation <= 50 ? '정상' : '주의', description: `측정 부위(${region}) 색소`, personalized_note: null },
      ],
      tips: [
        '하루 1.5L 이상 충분한 수분 섭취를 권장합니다.',
        'SPF 30 이상 자외선 차단제를 매일 사용하세요.',
        oil > 60 ? 'T존 유분 관리를 위해 클레이 마스크를 주 1-2회 활용하세요.' : '건조함을 막기 위해 세안 후 즉시 보습을 해주세요.',
      ].filter(Boolean),
      user_context: { applied: Boolean(s.skin_type) },
    },
    predictions: {
      regression: { moisture, oil, elasticity, spots, pigmentation },
      classification: { skin_type: skinType },
    },
    recommended_products: [],
    white_image_url: '/assets/demo_white_light.jpg',
    uv_image_url: '/assets/demo_uv_light.jpg',
    meta: {
      region,
      ckpt_epoch: 'mock',
      sensor_inputs_used: [],
    },
    moisture,
    oil,
    elasticity,
    spots,
    pigmentation,
    overallScore: overall,
    skinType: `${skinType} 피부`,
    date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
    area: region,
    is_mock: true,
  };
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
