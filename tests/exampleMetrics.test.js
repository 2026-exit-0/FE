import test from 'node:test';
import assert from 'node:assert/strict';
import { withExampleMetrics } from '../src/utils/exampleMetrics.js';

test('same session has fixed examples while all captured data remains unchanged', () => {
  const original = { sessionId: 'real-1', moisture: 0, oil: 42, date: '2026-10-01', white_image_url: 'white.jpg', uv_image_url: 'uv.jpg' };
  const first = withExampleMetrics(original);
  assert.deepEqual(withExampleMetrics({ ...original }), first);
  assert.deepEqual(withExampleMetrics(first), first);
  for (const key of Object.keys(original)) assert.equal(first[key], original[key]);
  assert.equal(original.elasticity, undefined);
  assert.ok(first.exampleMetrics.fields.includes('overallScore'));
});
test('missing actual measurements and photos are never replaced', () => {
  const data = withExampleMetrics({ sessionId: 'incomplete', moisture: null, oil: null, white_image_url: null });
  assert.equal(data.moisture, null);
  assert.equal(data.oil, null);
  assert.equal(data.white_image_url, null);
  assert.equal(data.overallScore, null);
  assert.equal(data.uv_image_url, undefined);
});
test('guest data and unknown sessions are not recast as real measurements', () => {
  for (const item of [undefined, {}, { sessionId: 'mock_1' }, { sessionId: 's', is_mock: true }]) assert.equal(withExampleMetrics(item), item);
});
