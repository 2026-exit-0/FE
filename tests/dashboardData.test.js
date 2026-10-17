import test from 'node:test';
import assert from 'node:assert/strict';
import { dashboardData } from '../src/utils/dashboardData.js';

test('empty dashboard has no fabricated scores or dates', () => {
  const data = dashboardData([], null, 'real');
  assert.equal(data.hasScanData, false);
  for (const field of ['score', 'moisture', 'oil', 'elasticity', 'skinType', 'date']) assert.equal(data[field], null);
});

test('latest real record preserves zero and ignores selected old and demo records', () => {
  const old = { session_id: 'old', created_at: '2026-10-01', moisture: 80 };
  const recent = { session_id: 'new', created_at: '2026-10-10', moisture: 0, sebum: 21, total_score: 0 };
  const demo = { session_id: 'demo', created_at: '2026-10-11', is_mock: true, moisture: 99 };
  const data = dashboardData([old, recent, demo], old, 'real');
  assert.equal(data.moisture, 0);
  assert.equal(data.oil, 21);
  assert.equal(data.score, 0);
  assert.equal(data.elasticity, null);
  assert.equal(dashboardData([demo], null, 'mock').moisture, 99);
});

test('raw response takes precedence over parser defaults', () => {
  const data = dashboardData([{ sessionId: 'one', overallScore: 70, skinType: 'default',
    _raw: { session_id: 'one', result: { moisture: null, sebum: 0 }, skin_type_result: '건성' } }], null, 'real');
  assert.equal(data.score, null);
  assert.equal(data.moisture, null);
  assert.equal(data.oil, 0);
  assert.equal(data.skinType, '건성');
});
