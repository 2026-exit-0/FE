import { buildDemoResult } from './demoResult.js';

// 설문은 최초 표시 때 고정한다. 이후 설문 수정으로 과거 촬영값이 바뀌지 않는다.
export function rememberDemoSurvey(sessionId, survey) {
  try {
    const user = JSON.parse(localStorage.getItem('damda_user') || '{}');
    const key = `damda_demo_context:${user.user_id || 'guest'}:${sessionId}`;
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
    const context = { skin_type: survey?.skin_type, concerns: survey?.concerns || [] };
    localStorage.setItem(key, JSON.stringify(context));
    return context;
  } catch { return survey || {}; }
}

export function withExampleMetrics(scan) {
  const id = scan?.sessionId || scan?.session_id;
  if (!id || scan.is_mock || String(id).startsWith('mock_')) return scan;
  const survey = scan.exampleMetrics?.survey || rememberDemoSurvey(id, scan.meta?.demoSurvey || scan._raw?.meta?.demoSurvey || {});
  const demo = buildDemoResult(scan.area || '촬영 부위', { sessionId: id, survey, actual: scan });
  return {
    ...scan,
    elasticity: demo.elasticity, spots: demo.spots, pigmentation: demo.pigmentation,
    overallScore: demo.overallScore,
    exampleMetrics: { version: 2, survey, fields: ['elasticity', 'spots', 'pigmentation', 'overallScore'] },
    narrative: { ...scan.narrative, ...demo.narrative },
  };
}
