import client, { isMock } from './client';
import { mockAnalysis, mockScanHistory } from '../utils/mockData';

// ── 스캐너 상태 확인 ─────────────────────────────────────
export async function getScannerHealth() {
  if (isMock) {
    await delay(400);
    // mock: 연결 안 된 상태
    return { status: 'unreachable', message: '개발 모드 — 스캐너 미연결' };
  }

  const res = await client.get('/api/scanner/health');
  return res.data; // { status: 'ok' | 'unreachable', esp32_data?: { state } }
}

// ── ESP32-CAM 스캐너 측정 ────────────────────────────────
// formData: { region, skin_type, sensitivity, aging_score, ... }
export async function measureWithScanner(formData) {
  if (isMock) {
    await delay(2000);
    return buildMockResult(formData.get?.('region') || 'PART_0');
  }

  const res = await client.post('/api/measure', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000, // 스캐너 측정은 최대 30초
  });
  return res.data;
}

// ── 사진 업로드 분석 ─────────────────────────────────────
// formData: { image: File, region, skin_type, ... }
export async function measureWithPhoto(formData) {
  if (isMock) {
    await delay(1500);
    return buildMockResult(formData.get?.('region') || 'PART_0');
  }

  const res = await client.post('/api/predict', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 20000,
  });
  return res.data;
}

// ── 측정 기록 조회 ───────────────────────────────────────
export async function getScanHistory() {
  if (isMock) {
    await delay(300);
    return mockScanHistory.map((s) => ({
      ...mockAnalysis,
      id: s.id,
      date: s.date,
      area: s.area,
      skinType: s.type,
      overallScore: s.score,
    }));
  }

  const res = await client.get('/api/scans');
  return res.data; // ScanSession[]
}

// ── 특정 스캔 조회 ───────────────────────────────────────
export async function getScanById(scanId) {
  if (isMock) {
    await delay(200);
    return { ...mockAnalysis, id: scanId };
  }

  const res = await client.get(`/api/scans/${scanId}`);
  return res.data;
}

// ── Mock 결과 생성 헬퍼 ──────────────────────────────────
// 백엔드 응답 형식(narrative)을 그대로 모방
function buildMockResult(region) {
  const moisture = rand(55, 85);
  const oil = rand(30, 65);
  const elasticity = rand(30, 70);
  const spots = rand(40, 80);
  const pigmentation = rand(40, 75);
  const overall = Math.round((moisture + (100 - oil) + elasticity + spots + (100 - pigmentation)) / 5);

  return {
    narrative: {
      overall_score: overall,
      summary: `전반적으로 ${overall >= 70 ? '양호한' : '관리가 필요한'} 피부 상태입니다.`,
      per_metric: [
        { name: '수분도', value: `${moisture}%`, rating: moisture >= 60 ? 'good' : moisture >= 40 ? 'fair' : 'poor', rating_text: moisture >= 60 ? '정상' : moisture >= 40 ? '보통' : '주의', description: `정상 범위(60-90%)`, personalized_note: moisture < 60 ? '보습제 추가를 권장합니다.' : null },
        { name: '유분도', value: `${oil}%`, rating: oil <= 55 ? 'good' : 'fair', rating_text: oil <= 55 ? '보통' : '주의', description: 'T존 유분 분포', personalized_note: null },
        { name: '탄력', value: `${elasticity}%`, rating: elasticity >= 60 ? 'good' : elasticity >= 40 ? 'fair' : 'poor', rating_text: elasticity >= 60 ? '정상' : elasticity >= 40 ? '보통' : '주의', description: '볼 부위 탄력 지수', personalized_note: null },
        { name: '모공', value: `${spots}%`, rating: spots >= 60 ? 'good' : 'fair', rating_text: spots >= 60 ? '양호' : '관리 권장', description: '코 주변 모공 상태', personalized_note: null },
        { name: '색소침착', value: `${pigmentation}%`, rating: pigmentation <= 55 ? 'good' : 'fair', rating_text: pigmentation <= 55 ? '정상' : '주의', description: '이마·볼 상단 색소 감지', personalized_note: null },
      ],
      tips: [
        '하루 1.5L 이상 충분한 수분 섭취를 권장합니다.',
        'SPF 30 이상 자외선 차단제를 매일 사용하세요.',
        oil > 50 ? 'T존 유분 관리를 위해 클레이 마스크를 주 1-2회 활용하세요.' : '건조함을 막기 위해 세안 후 즉시 보습을 해주세요.',
      ].filter(Boolean),
      user_context: { applied: false },
    },
    predictions: {
      regression: { moisture, oil, elasticity, spots, pigmentation },
      classification: { skin_type: '복합성' },
    },
    recommended_products: [],
    meta: {
      region,
      ckpt_epoch: 'mock',
      sensor_inputs_used: [],
    },
    // 기존 flat 구조 호환 (scanStore용)
    moisture,
    oil,
    elasticity,
    spots,
    pigmentation,
    overallScore: overall,
    skinType: '복합성 피부',
    date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
    area: region,
  };
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
