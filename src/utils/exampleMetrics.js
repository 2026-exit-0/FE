// v1: 같은 세션이면 브라우저·조회 시점에 관계없이 같은 예시값을 사용한다.
// 사진의 외형이나 센서값으로 임상 수치를 추정하지 않는다.
function exampleValue(sessionId, metric, min, span) {
  let hash = 2166136261;
  for (const char of `example-v1:${sessionId}:${metric}`) {
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  }
  return min + hash % span;
}

export function withExampleMetrics(scan) {
  const id = scan?.sessionId || scan?.session_id;
  if (!id || scan.is_mock || String(id).startsWith('mock_')) return scan;
  const elasticity = exampleValue(id, 'elasticity', 55, 21);
  const spots = exampleValue(id, 'spots', 50, 26);
  const pigmentation = exampleValue(id, 'pigmentation', 25, 26);
  const valid = n => typeof n === 'number' && Number.isFinite(n);
  const overallScore = valid(scan.moisture) && valid(scan.oil)
    ? Math.round((scan.moisture + 100 - scan.oil + elasticity + spots + 100 - pigmentation) / 5) : null;
  const metrics = { elasticity, spots, pigmentation };
  const names = { '탄력': 'elasticity', '모공': 'spots', '색소침착': 'pigmentation' };
  return {
    ...scan, ...metrics, overallScore,
    exampleMetrics: { version: 1, fields: ['elasticity', 'spots', 'pigmentation', 'overallScore'] },
    narrative: {
      ...scan.narrative,
      overall_score: overallScore,
      per_metric: scan.narrative?.per_metric?.map(metric => names[metric.name]
        ? { ...metric, value: `${metrics[names[metric.name]]}%`, rating_text: '예시값', rating: 'fair', description: '실제 분석값이 아닙니다.', personalized_note: null }
        : metric),
    },
  };
}
