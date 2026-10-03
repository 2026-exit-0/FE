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

export function selectReportScans(scans, mode) {
  const seen = new Set();
  return scans.filter(scan => {
    const demo = scan.is_mock === true || scan._raw?.is_mock === true;
    if ((mode === 'mock') !== demo) return false;
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
