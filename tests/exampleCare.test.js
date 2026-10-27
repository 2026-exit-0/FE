import test from 'node:test';
import assert from 'node:assert/strict';
import { buildExampleCare } from '../src/utils/exampleCare.js';
import { withExampleMetrics } from '../src/utils/exampleMetrics.js';

test('care reuses the same session metrics without changing actual values or photos', () => {
  const scan = { sessionId: 'real-1', moisture: 0, oil: 42, skinType: '건성', white_image_url: 'white', uv_image_url: 'uv', date: '2026-10-01' };
  const before = structuredClone(scan);
  const result = buildExampleCare(scan);
  assert.deepEqual(scan, before);
  assert.deepEqual(result, buildExampleCare(structuredClone(scan)));
  const metrics = withExampleMetrics(scan);
  for (const field of result.report.metrics) assert.equal(field.sensor, `${metrics[field.key]}%`);
  assert.equal(result.report.overall_score, metrics.overallScore);
  assert.equal(result.sessionId, 'real-1');
  assert.ok(result.narrative.tips.length);
  assert.equal(result.white_image_url, undefined);
  assert.equal(result.moisture, undefined);
});
test('missing sensor values stay absent and no type is invented', () => {
  const result = buildExampleCare({ sessionId: 'real-2', moisture: null, oil: null });
  assert.equal(result.report.metrics[0].sensor, '데이터 없음');
  assert.equal(result.report.metrics[1].sensor, '데이터 없음');
  assert.equal(result.report.overall_score, null);
  assert.equal(result.report.skin_type, '미확인');
});
test('unknown sessions have no care; demo care keeps its own session', () => {
  assert.equal(buildExampleCare({}), null);
  assert.equal(buildExampleCare({ sessionId: 'demo', is_mock: true }).sessionId, 'demo');
});
