import { metricValue, reportDate, selectReportScans } from './reportData.js';

export function dashboardData(scans, currentScan, mode) {
  const records = selectReportScans([...scans, ...(currentScan ? [currentScan] : [])], mode);
  const latest = records[0];
  const source = latest?._raw || latest || {};
  const date = latest ? reportDate(source) || reportDate(latest) : null;
  return {
    hasScanData: Boolean(latest),
    score: metricValue(source, 'overall') ?? metricValue(source.narrative || {}, 'overall_score'),
    moisture: metricValue(source, 'moisture'),
    oil: metricValue(source, 'oil'),
    elasticity: metricValue(source, 'elasticity'),
    skinType: source.skin_type_result || source.skinType || source.predictions?.classification?.skin_type || null,
    date: date ? date.toLocaleDateString('ko-KR') : null,
  };
}
