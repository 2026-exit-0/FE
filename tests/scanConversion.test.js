import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

test('scan conversion preserves missing values, zero and backend skin types', async () => {
  const previousStorage = globalThis.localStorage;
  globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  const server = await createServer({ configFile: false, appType: 'custom', optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true, watch: null, hmr: false } });
  try {
    const { parseApiResult } = await server.ssrLoadModule('/src/store/scanStore.js');
    const input = { session_id: 'a', total_score: null, skin_type_result: '건성', result: { moisture: 0, sebum: '12.5', moisture_on: true, elasticity: null } };
    const data = parseApiResult(input);
    assert.equal(data.moisture, 0);
    assert.equal(data.oil, 12.5);
    assert.equal(typeof data.elasticity, 'number');
    assert.equal(typeof data.spots, 'number');
    assert.equal(typeof data.overallScore, 'number');
    assert.equal(data.skinType, '건성');
    assert.equal(data.narrative.summary, '');
    assert.equal(data.narrative.per_metric[2].value, `${data.elasticity}%`);
    assert.equal(data.narrative.per_metric[2].rating_text, '예시값');
    const flat = parseApiResult({ moisture: 0, sebum: 0, total_score: 0, skin_type_result: '지성' });
    assert.equal(flat.moisture, 0);
    assert.equal(flat.overallScore, 0);
    assert.equal(flat.skinType, '지성');
    const missing = parseApiResult({ result: { moisture_on: true, melanin_on: true, sebum: 'invalid' } });
    assert.equal(missing.moisture, null);
    assert.equal(missing.pigmentation, null);
    assert.equal(missing.oil, null);
    assert.equal(missing.skinType, null);
    const legacy = parseApiResult({ narrative: { overall_score: 0, per_metric: [{ name: '수분도', value: '0%' }] } });
    assert.equal(legacy.overallScore, 0);
    assert.equal(legacy.moisture, 0);
    assert.equal(legacy.elasticity, null);
    assert.equal(parseApiResult({ session_id: 'history', moisture: null }).moisture, null);
    assert.equal(input.result.moisture, 0);
  } finally { await server.close(); globalThis.localStorage = previousStorage; }
});
