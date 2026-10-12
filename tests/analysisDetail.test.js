import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

test('history detail fetches matching result and optional care', async () => {
  const old = globalThis.localStorage;
  globalThis.localStorage = { getItem: () => null };
  const server = await createServer({ configFile: false, appType: 'custom', optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true, hmr: false, watch: null } });
  try {
    const { default: client } = await server.ssrLoadModule('/src/api/client.js');
    const { loadAnalysisDetail } = await server.ssrLoadModule('/src/api/analysisDetail.js');
    const calls = [];
    let careMissing = false;
    let resultFailed = false;
    client.defaults.adapter = async config => {
      calls.push(config.url);
      if ((careMissing && config.url.includes('/care/')) || (resultFailed && config.url.includes('/result/'))) {
        throw Object.assign(new Error('missing'), { response: { status: 404 } });
      }
      return { config, status: 200, headers: {}, data: config.url.includes('/result/')
        ? { session_id: 's1', moisture: 63, sebum: 0, pore: null, white_image_url: 'https://example.com/white.jpg' }
        : { summary: 'care summary', morning_routine: 'morning', lifestyle_tips: 'tips' } };
    };
    const data = await loadAnalysisDetail('s1', { narrative: { per_metric: [{ value: '0%' }] }, created_at: '2026-10-11T12:00:00Z' });
    assert.deepEqual(calls.sort(), ['/care/s1', '/result/s1']);
    assert.equal(data.moisture, 63);
    assert.equal(data.oil, 0);
    assert.equal(data.spots, null);
    assert.equal(data.overallScore, null);
    assert.equal(data.white_image_url, 'https://example.com/white.jpg');
    assert.equal(data.narrative.per_metric, undefined);
    assert.deepEqual(data.narrative.tips, ['morning', 'tips']);
    careMissing = true;
    assert.equal((await loadAnalysisDetail('s1')).moisture, 63);
    assert.ok((await loadAnalysisDetail('s1')).careMessage);
    resultFailed = true;
    await assert.rejects(loadAnalysisDetail('s1'));
  } finally {
    await server.close();
    if (old === undefined) delete globalThis.localStorage; else globalThis.localStorage = old;
  }
});
