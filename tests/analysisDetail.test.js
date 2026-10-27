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
    careMissing = true;
    const local = await loadAnalysisCare('s1', undefined, data);
    assert.equal(local.careSource, 'local-template');
    assert.equal(local.report.metrics[0].sensor, '63%');
    assert.equal(local.report.metrics[1].sensor, '0%');
    assert.equal(local.sessionId, 's1');
    assert.equal((await loadAnalysisCare('s2', undefined, data)).report, null);
    assert.ok(calls.every(path => !path.includes('analyze')));
    careMissing = false;

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
    client.defaults.adapter = async config => {
      if (config.url.includes('/result/')) throw Object.assign(new Error('no result'), { response: { status: 404 } });
      return { config, status: 200, headers: {}, data: [
        { session_id: 'other', moisture: 99 },
        { session_id: 's1', moisture: 0, sebum: 12, white_image_url: 'https://example.com/photo.jpg' },
      ] };
    };
    const fallback = await loadAnalysisDetail('s1', { moisture: 99, overallScore: 70, skinType: 'stale' });
    assert.equal(fallback.moisture, 0);
    assert.equal(fallback.oil, 12);
    assert.equal(fallback.spots, null);
    assert.equal(fallback.skinType, null);
    assert.equal(fallback.overallScore, null);
    assert.equal(fallback.white_image_url, 'https://example.com/photo.jpg');
    assert.match(fallback.detailMessage, /404/);
    await assert.rejects(loadAnalysisDetail('not-owned'));
    let authCalls = 0;
    client.defaults.adapter = async () => {
      authCalls++;
      throw Object.assign(new Error('forbidden'), { response: { status: 403 } });
    };
    await assert.rejects(loadAnalysisDetail('s1'));
    assert.equal(authCalls, 1);
    for (const status of [401, 403, 500]) {
      client.defaults.adapter = async () => {
        throw Object.assign(new Error('failed'), { response: { status } });
      };
      const failedCare = await loadAnalysisCare('s1', undefined, data);
      assert.equal(failedCare.report, null);
      assert.ok(failedCare.careMessage);
    }
    const savedReport = { summary: 'saved report', extra_note: 'keep' };
    client.defaults.adapter = async config => ({ config, status: 200, headers: {}, data: { report: savedReport } });
    const combined = (await loadAnalysisCare('s1', undefined, data)).report;
    assert.equal(combined.extra_note, 'keep');
    assert.equal(combined.metrics[0].sensor, '63%');
    assert.notEqual(combined.summary, 'saved report');

  } finally {
    await server.close();
    if (old === undefined) delete globalThis.localStorage; else globalThis.localStorage = old;
  }
});
