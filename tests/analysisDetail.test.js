import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

test('history detail fetches matching result and optional care', async () => {
  const old = globalThis.localStorage;
  globalThis.localStorage = { getItem: () => null };
  const server = await createServer({ configFile: false, appType: 'custom', optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true, hmr: false, watch: null } });
  try {
    const { default: client } = await server.ssrLoadModule('/src/api/client.js');
    const { loadAnalysisDetail, loadAnalysisCare } = await server.ssrLoadModule('/src/api/analysisDetail.js');
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
    assert.deepEqual(calls, ['/result/s1']);
    assert.equal(data.moisture, 63);
    assert.equal(data.oil, 0);
    assert.equal(data.spots, null);
    assert.equal(data.overallScore, null);
    assert.equal(data.white_image_url, 'https://example.com/white.jpg');
    assert.equal(data.narrative.per_metric, undefined);
    assert.deepEqual((await loadAnalysisCare('s1')).narrative.tips, ['morning', 'tips']);
    assert.equal((await loadAnalysisDetail('s1', { sessionId: 's1', overallScore: 82 })).overallScore, 82);
    assert.equal((await loadAnalysisDetail('s1', { sessionId: 's1', total_score: 0 })).overallScore, 0);
    assert.equal((await loadAnalysisDetail('s1', { sessionId: 'other', overallScore: 82 })).overallScore, null);
    assert.equal((await loadAnalysisDetail('s1', { sessionId: 's1', overallScore: 70, _raw: { session_id: 's1', result: {} } })).overallScore, null);
    assert.equal((await loadAnalysisDetail('s1', { sessionId: 's1', overallScore: 82, is_mock: true })).overallScore, null);
    careMissing = true;
    assert.equal((await loadAnalysisDetail('s1')).moisture, 63);
    assert.ok((await loadAnalysisCare('s1')).careMessage);
    let finishCare;
    const adapter = client.defaults.adapter;
    client.defaults.adapter = config => config.url.includes('/care/')
      ? new Promise(resolve => { finishCare = () => resolve({ config, status: 200, headers: {}, data: { summary: 'late care' } }); })
      : adapter(config);
    const pendingCare = loadAnalysisCare('s1');
    const immediateResult = await loadAnalysisDetail('s1');
    assert.equal(immediateResult.moisture, 63);
    finishCare();
    assert.equal((await pendingCare).narrative.summary, 'late care');
    client.defaults.adapter = adapter;
    resultFailed = true;
    await assert.rejects(loadAnalysisDetail('s1'));
  } finally {
    await server.close();
    if (old === undefined) delete globalThis.localStorage; else globalThis.localStorage = old;
  }
});
