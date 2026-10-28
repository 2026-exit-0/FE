import client, { isMock } from './client';
import { mockAnalysis, mockScanHistory } from '../utils/mockData';
import { safeStreamUrl } from '../utils/scanSafety';
import { createScannerSessionApi } from './scannerSession';

const DEVICE_API_BASE = import.meta.env.VITE_DEVICE_API_BASE || '/device-api';
const DEFAULT_DEVICE_ID = import.meta.env.VITE_SCANNER_DEVICE_ID || 'ESP32_1';
export const scannerSession = createScannerSessionApi(client, DEFAULT_DEVICE_ID);

// 실측 총 제한 시간(ms). 스캔 시작~완료까지 이 시간을 '하나의 예산'으로 쓴다.
// (start + 완료대기 합산이 이 값을 넘으면 전체 목업으로 폴백 → "15초 넘으면 목업")
const SCAN_TIMEOUT_MS = Number(import.meta.env.VITE_SCAN_TIMEOUT_MS) || 25000;

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

// 부위 코드(FE) → BE가 아는 scan_area(한글). 데모 점수·폴백 이미지 매칭에 사용.
const REGION_TO_AREA = {
  FOREHEAD: '이마', NOSE: '코', CHIN: '턱',
  L_CHEEK: '왼쪽볼', R_CHEEK: '오른쪽볼', CHEEK: '볼',
};

// BE 데모 분석을 호출해 리치 리포트·부위 매칭 이미지를 받아온다. (실기기 실패 시 폴백)
async function demoViaBackend(region) {
  const scan_area = REGION_TO_AREA[region] || region;
  const session = await createScanSession({ scan_area });
  const sid = session.session_id;
  await client.post(`/scans/${sid}/analyze-scan`, null, { params: { demo: true, region } });
  const [{ data: result }, { data: advice }] = await Promise.all([
    client.get(`/result/${sid}`),
    client.get(`/care/${sid}`),
  ]);
  const rep = advice?.report || {};
  return {
    session_id: sid,
    is_mock: true,
    area: scan_area,
    total_score: rep.overall_score ?? null,
    skin_type_result: rep.skin_type ?? null,
    result: {
      moisture: result.moisture, sebum: result.sebum, pore: result.pore,
      elasticity: result.elasticity, pigmentation: result.pigmentation,
    },
    advice,
    recommended_products: advice?.recommended_products || [],   // 성분 기반 추천 (카드용)
    white_image_url: result.white_image_url,
    uv_image_url: result.uv_image_url,
    meta: { region },
  };
}

// 실측 성공 결과 조립 — /result(실측 사진·수분 등) + /care(목업 보충 분석·추천)를 합친다.
// 하드웨어는 수분만 실측(유분은 현재 목업), 모공·탄력·색소·점수·리포트·추천은 목업 보충이라
// 결과 전체를 실측으로 단언하지 않는다(is_mock=true, 정직성). 사진·수분은 실측값 그대로 노출.
async function assembleRealResult(sid, region, result) {
  let advice = {};
  try {
    const { data } = await client.get(`/care/${sid}`);
    advice = data || {};
  } catch (e) {
    console.warn('[scan] 실측 케어/추천 조회 실패(사진·수치만 노출):', e?.message);
  }
  const rep = advice?.report || {};
  return {
    session_id: sid,
    is_mock: true,                       // 분석·추천은 목업 보충 — 사진·수분만 실측
    area: REGION_TO_AREA[region] || region,
    total_score: rep.overall_score ?? null,
    skin_type_result: rep.skin_type ?? null,
    result: {
      moisture: result?.moisture, sebum: result?.sebum, pore: result?.pore,
      elasticity: result?.elasticity, pigmentation: result?.pigmentation,
    },
    advice,
    recommended_products: advice?.recommended_products || [],
    white_image_url: result?.white_image_url,   // 실측 촬영 사진
    uv_image_url: result?.uv_image_url,          // 실측 촬영 사진
    meta: { region, real_capture: true },
  };
}

// promise 에 제한 시간을 건다. 시간 초과 시 TIMEOUT 에러로 reject.
function withTimeout(promise, ms, label = 'TIMEOUT') {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(label);
      err.code = label;
      reject(err);
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// ── 단일 측정 흐름 (모드 구분 없음) ──────────────────────────
// 항상 실기기/실제 AI 측정을 먼저 시도하고, 하드웨어·AI가 응답하지 않으면
// 자동으로 BE 데모 분석 → 로컬 목업 순으로 폴백한다. (전시 무중단)
// BE 데모 분석 → 로컬 목업 순으로 폴백 (전시 무중단 안전망)
async function demoThenMock(region) {
  try {
    return await demoViaBackend(region);   // BE 데모(리치 리포트+부위 이미지)
  } catch (e) {
    console.warn('[scan] BE 데모 분석 실패 → 로컬 목업 폴백:', e?.message);
  }
  await delay(500);
  return buildMockResult(region);
}

export async function measureWithScanner(formData, { sessionId, signal, onSession } = {}) {
  const region = formData?.get?.('region') || 'FOREHEAD';

  // (A) 재개 세션(물리 버튼·폴링 감지): 15초 예산 안에서 실측 완료를 기다리고,
  //     초과/실패하면 전체 목업으로 폴백(95% 무한로딩 방지).
  if (sessionId) {
    onSession?.(sessionId);
    try {
      const result = await withTimeout(
        scannerSession.wait(sessionId, { signal }), SCAN_TIMEOUT_MS, 'SCAN_WAIT_TIMEOUT');
      return await assembleRealResult(sessionId, region, result);
    } catch (e) {
      if (signal?.aborted) throw e;
      console.warn('[scan] 재개 세션 대기 초과/실패 → 전체 목업 폴백:', e?.message);
      return demoThenMock(region);
    }
  }

  // (B) 화면 버튼 스캔: 실기기 측정 시도. start+완료대기를 15초 '하나의 예산'으로 묶는다.
  try {
    const deadline = Date.now() + SCAN_TIMEOUT_MS;
    const remain = () => Math.max(0, deadline - Date.now());
    const session = await withTimeout(
      scannerSession.start(region, { signal }), remain(), 'SCAN_START_TIMEOUT');
    onSession?.(session.session_id);
    const result = await withTimeout(
      scannerSession.wait(session.session_id, { signal }), remain(), 'SCAN_WAIT_TIMEOUT');
    // 실측 성공: 실측 사진·수분 + 목업 보충 분석·추천을 조립해 반환.
    return await assembleRealResult(session.session_id, region, result);
  } catch (e) {
    if (signal?.aborted) throw e; // 사용자가 화면을 벗어난 경우: 폴백하지 않는다.
    console.warn('[scan] 실기기 측정 실패/시간초과(15초) → 전체 목업으로 전환:', e?.message);
  }

  // (C/D) 전체 목업 폴백 (BE 데모 → 로컬 목업)
  return demoThenMock(region);
}

// ── 사진 업로드 분석 ─────────────────────────────────────
// 업로드한 사진으로 실제 분석을 시도하고, 실패하면 설문 기반 목업으로 폴백한다.
export async function measureWithPhoto(formData) {
  const region = formData?.get?.('region') || '얼굴 전체';

  let sessionId = null;
  try {
    const session = await createScanSession({ scan_area: region });
    sessionId = session?.session_id;
  } catch (sessErr) {
    console.warn('[photo] 세션 생성 실패 → 목업 폴백:', sessErr?.message);
    await delay(1000);
    return buildMockResult(region);
  }

  try {
    const uploadData = formData instanceof FormData ? formData : new FormData();
    uploadData.set('demo', 'false');

    const res = await client.post(`/scans/${sessionId}/analyze`, uploadData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const data = res.data || {};
    return {
      ...data,
      session_id: sessionId,
      is_mock: Boolean(data.is_mock),
    };
  } catch (err) {
    console.warn('[photo] 분석 실패 → 목업 폴백:', err?.message);
    return buildMockResult(region);
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
