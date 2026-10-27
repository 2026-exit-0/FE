import { rememberDemoSurvey } from '../utils/exampleMetrics';
import { buildDemoResult } from '../utils/demoResult';
import client, { isMock } from './client';
import { mockAnalysis, mockScanHistory } from '../utils/mockData';
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
// 실기기 등록/스트림 주소를 확인한다. 기기가 없더라도 UI는 '연결됨'으로 보이고,
// 실제 측정 가능 여부는 스캔 시 measureWithScanner 가 시도 후 판단한다.
export async function getScannerHealth() {
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

// 실제 촬영을 우선 조회하고, 기기 실패 시 별도 로컬 예시 결과를 생성한다.
export async function measureWithScanner(formData, { sessionId, signal, onSession } = {}) {
  signal?.throwIfAborted();
  const region = formData?.get?.('region') || 'FOREHEAD';
  let survey = readLocalSurvey();
  try { survey = (await client.get('/surveys/me', { signal })).data || survey; }
  catch (error) {
    signal?.throwIfAborted();
    if ([401, 403].includes(error.response?.status)) throw error;
  }
  let id = sessionId;
  try {
    id = id || (await scannerSession.start(region, { signal })).session_id;
    const context = rememberDemoSurvey(id, survey);
    onSession?.(id);
    const result = await scannerSession.wait(id, { signal });
    return { ...result, meta: { ...result.meta, demoSurvey: context } };
  } catch (error) {
    signal?.throwIfAborted();
    // 권한·충돌·결과 조회 문제는 실제 촬영의 재조회 흐름을 유지한다.
    if (!['SCAN_DEVICE_UNAVAILABLE', 'SCAN_FAILED', 'SCAN_WAIT_TIMEOUT'].includes(error.code)) throw error;
    const mockId = `mock_${crypto.randomUUID()}`;
    return { ...buildDemoResult(region, { sessionId: mockId, survey }),
      meta: { region, fallbackFromSessionId: id || null, fallbackReason: error.code } };
  }
}

// 사진 업로드 실패도 예시 사진이나 센서값으로 대체하지 않는다.
export async function measureWithPhoto(formData) {
  const region = formData?.get?.('region') || '얼굴 전체';
  const session = await createScanSession({ scan_area: region });
  const sessionId = session?.session_id;
  if (!sessionId) throw new Error('촬영 세션 정보를 받지 못했습니다.');
  const uploadData = formData instanceof FormData ? formData : new FormData();
  uploadData.set('demo', 'false');
  const { data } = await client.post(`/scans/${encodeURIComponent(sessionId)}/analyze`, uploadData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return { ...data, session_id: sessionId, is_mock: Boolean(data?.is_mock) };
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
  if (isMock) {
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
  return buildDemoResult(region, { sessionId: `mock_${crypto.randomUUID()}`, survey: readLocalSurvey() });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
