export function reportDate(scan) {
  const value = scan.created_at || scan.date || scan.timestamp || scan.createdAt;
  if (!value) return null;
  let text = String(value);
  if (/^\d{4}\.\d{2}\.\d{2}$/.test(text)) text = text.replaceAll('.', '-');
  if (/^\d{8}_\d{6}$/.test(text)) text = text.replace(/^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})$/, '$1-$2-$3T$4:$5:$6');
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function metricValue(scan, metric) {
  const fields = { oil: ['oil', 'sebum'], pore: ['spots', 'pore'], overall: ['overallScore', 'total_score', 'score'] }[metric] || [metric];
  for (const source of [scan, scan.result]) {
    for (const field of fields) {
      const value = source?.[field];
      if (value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value))) return Number(value);
    }
  }
  return null;
}

export function selectReportScans(scans) {
  // 모드 구분 없이 전체 측정 기록을 중복 제거 후 최신순 정렬 (데모·실제 통합)
  const seen = new Set();
  return scans.filter(scan => {
    const id = scan.sessionId || scan.session_id || scan.id;
    if (id != null && seen.has(id)) return false;
    if (id != null) seen.add(id);
    return true;
  }).sort((a, b) => (reportDate(b)?.getTime() || 0) - (reportDate(a)?.getTime() || 0));
}

export function filterReportPeriod(scans, period, now = new Date()) {
  if (period === 'all') return scans;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ({ week: 6, month: 29, '3month': 89 }[period] ?? 29));
  return scans.filter(scan => {
    const date = reportDate(scan);
    return date && date >= start && date <= now;
  });
}

export function reportChart(scans, metric) {
  return [...scans].sort((a, b) => (reportDate(a)?.getTime() || 0) - (reportDate(b)?.getTime() || 0))
    .flatMap(scan => {
      const date = reportDate(scan);
      const score = metricValue(scan, metric);
      if (!date || score === null) return [];
      return [{ week: date.toLocaleDateString('ko-KR'), score }];
    });
}

export function reportChange(scans, metric) {
  const values = reportChart(scans, metric);
  return values.length < 2 ? null : Math.round((values.at(-1).score - values[0].score) * 10) / 10;
}

// ─── 구간별 변화 서술형 리포트 생성 ───────────────────────
// 그래프만으로는 안 보이는 "무엇이 얼마나, 어느 방향으로" 를 문장으로 설명한다.
const NARRATIVE_METRICS = [
  { id: 'moisture', label: '수분도', higherBetter: true, unit: '점' },
  { id: 'oil', label: '유분도', higherBetter: false, unit: '점' },
  { id: 'pore', label: '모공', higherBetter: true, unit: '점' },
  { id: 'elasticity', label: '탄력', higherBetter: true, unit: '점' },
  { id: 'pigmentation', label: '색소침착', higherBetter: false, unit: '점' },
];

function _mag(delta) {
  const a = Math.abs(delta);
  if (a >= 10) return '크게';
  if (a >= 4) return '뚜렷하게';
  return '소폭';
}

// 지표별 개선/악화 시 구체 설명 문구
const IMPROVE_MSG = {
  moisture: '수분이 차올라 속당김과 각질 들뜸이 줄었어요',
  oil: '유분 밸런스가 안정돼 번들거림이 가라앉았어요',
  pore: '모공이 조여지고 피부결이 매끈해졌어요',
  elasticity: '피부 탄력이 올라 처짐 없이 탄탄해졌어요',
  pigmentation: '색소·잡티가 옅어지고 피부 톤이 맑아졌어요',
};
const WORSEN_MSG = {
  moisture: '수분이 빠져 속건조가 보이니 보습 레이어링을 늘려 보세요',
  oil: '유분이 늘었으니 T존 피지 관리와 가벼운 제형을 권해요',
  pore: '모공이 두드러지니 각질·피지 케어와 모공 토너를 챙겨 보세요',
  elasticity: '탄력이 떨어졌으니 펩타이드·레티놀 집중 케어가 필요해요',
  pigmentation: '색소가 짙어졌으니 자외선 차단과 미백 성분 케어를 권해요',
};

// 최근 측정 스냅샷 문장/라인 (값·점수 구체 표기)
function _snapshot(scan) {
  const overall = metricValue(scan, 'overall');
  const parts = [];
  const lines = [];
  for (const m of NARRATIVE_METRICS) {
    const v = metricValue(scan, m.id);
    if (v === null) continue;
    parts.push(`${m.label} ${v}점`);
    const good = m.higherBetter ? v >= 60 : v <= 45;
    const mid = m.higherBetter ? v >= 45 : v <= 60;
    lines.push({
      label: m.label,
      tone: good ? 'up' : mid ? 'flat' : 'down',
      text: `${m.label} ${v}점 · ${good ? '양호' : mid ? '보통' : '주의 필요'}`,
    });
  }
  const text = parts.length
    ? `최근 측정 기준 ${overall !== null ? `종합 ${overall}점, ` : ''}${parts.join(' · ')}.`
    : '';
  return { text, lines, overall };
}

export function reportNarrative(scans) {
  const chron = [...scans].sort((a, b) => (reportDate(a)?.getTime() || 0) - (reportDate(b)?.getTime() || 0));
  if (chron.length < 2) {
    const snap = _snapshot(chron[chron.length - 1] || {});
    const d = chron.length ? reportDate(chron[chron.length - 1]) : null;
    return {
      enough: false,
      periodText: d ? `${d.toLocaleDateString('ko-KR')} · 1회 측정` : '',
      summary: (snap.text ? snap.text + ' ' : '') + '다음 측정부터는 이전 대비 지표 변화를 구간별로 분석해 드려요.',
      lines: snap.lines,
    };
  }
  const first = chron[0], last = chron.at(-1);
  const d1 = reportDate(first), d2 = reportDate(last);
  const days = d1 && d2 ? Math.max(1, Math.round((d2 - d1) / 86400000)) : null;
  const periodText = days
    ? `${d1.toLocaleDateString('ko-KR')} ~ ${d2.toLocaleDateString('ko-KR')} (약 ${days}일, ${chron.length}회 측정)`
    : `${chron.length}회 측정`;

  const lines = [];
  const improved = [], worsened = [];
  for (const m of NARRATIVE_METRICS) {
    const a = metricValue(first, m.id), b = metricValue(last, m.id);
    if (a === null || b === null) continue;
    const delta = Math.round((b - a) * 10) / 10;
    if (delta === 0) {
      lines.push({ label: m.label, tone: 'flat', text: `${m.label}는 ${a}${m.unit}으로 변화 없이 유지됐어요.` });
      continue;
    }
    const isImprove = m.higherBetter ? delta > 0 : delta < 0;
    const dir = delta > 0 ? '올라' : '내려';
    const detail = isImprove ? IMPROVE_MSG[m.id] : WORSEN_MSG[m.id];
    lines.push({
      label: m.label,
      tone: isImprove ? 'up' : 'down',
      text: `${m.label} ${a}→${b}${m.unit} (${delta > 0 ? '+' : ''}${delta}, ${_mag(delta)} ${dir}) · ${detail}.`,
    });
    (isImprove ? improved : worsened).push(m.label);
  }

  const overallA = metricValue(first, 'overall'), overallB = metricValue(last, 'overall');
  const overallDelta = overallA !== null && overallB !== null ? Math.round((overallB - overallA) * 10) / 10 : null;

  const snap = _snapshot(last);
  let trend = '';
  if (overallDelta !== null) {
    trend = overallDelta > 0 ? `종합 점수가 ${overallA}→${overallB}점으로 ${overallDelta}점 올랐어요`
      : overallDelta < 0 ? `종합 점수가 ${overallA}→${overallB}점으로 ${Math.abs(overallDelta)}점 내렸어요`
      : `종합 점수는 ${overallB}점으로 유지됐어요`;
    trend += '. ';
  }
  if (improved.length) trend += `특히 ${improved.join('·')}이(가) 좋아졌고`;
  if (improved.length && worsened.length) trend += ', ';
  if (worsened.length) trend += `${worsened.join('·')}은(는) 더 신경 쓰면 좋겠어요`;
  trend = trend.trim();
  if (trend && !trend.endsWith('.')) trend += '.';
  if (!trend) trend = '기간 내 지표는 큰 변화 없이 유지됐어요.';
  // 최근 측정 스냅샷(값·점수) + 변화 추이를 함께 → 보고서형 구체 설명
  const summary = snap.text ? `${snap.text} ${trend}` : trend;

  return { enough: true, periodText, summary, lines };
}
