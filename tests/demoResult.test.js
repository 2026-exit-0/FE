import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { buildDemoResult } from '../src/utils/demoResult.js';

test('team concern ranges are reused and actual sensors control score and prose', () => {
  const options = { sessionId: 'real-42', survey: { skin_type: '건성', concerns: ['모공', '탄력', '색소침착'] }, actual: { moisture: 0, oil: 80 } };
  const result = buildDemoResult('볼', options);
  assert.deepEqual(result, buildDemoResult('볼', options));
  assert.equal(result.moisture, 0);
  assert.equal(result.oil, 80);
  assert.ok(result.spots >= 28 && result.spots <= 45);
  assert.ok(result.elasticity >= 28 && result.elasticity <= 45);
  assert.ok(result.pigmentation >= 60 && result.pigmentation <= 80);
  assert.equal(result.overallScore, Math.round((0 + 20 + result.spots + result.elasticity + 100 - result.pigmentation) / 5));
  assert.equal(result.narrative.per_metric[0].rating_text, '주의');
  assert.equal(result.narrative.per_metric[1].value, '80%');
});

test('scanner fallback isolates mock sessions and preserves auth, cancellation and result errors', async () => {
  const old = globalThis.localStorage;
  const storage = new Map();
  globalThis.localStorage = { getItem: k => storage.get(k) || null, setItem: (k,v) => storage.set(k,v) };
  const server = await createServer({ configFile: false, appType: 'custom', optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true, hmr: false, watch: null } });
  try {
    const { default: client } = await server.ssrLoadModule('/src/api/client.js');
    const { measureWithScanner, scannerSession } = await server.ssrLoadModule('/src/api/scan.js');
    client.defaults.adapter = async config => ({ config, status: 200, headers: {}, data: { skin_type: '지성', concerns: ['모공'] } });
    scannerSession.start = async () => ({ session_id: 'real-session' });
    const fd = new FormData(); fd.set('region', '볼');
    scannerSession.wait = async () => ({ session_id: 'real-session', moisture: 0, sebum: 40, white_image_url: 'real.jpg' });
    const real = await measureWithScanner(fd);
    assert.equal(real.session_id, 'real-session');
    assert.equal(real.white_image_url, 'real.jpg');
    assert.equal(real.moisture, 0);
    for (const code of ['SCAN_FAILED', 'SCAN_WAIT_TIMEOUT', 'SCAN_DEVICE_UNAVAILABLE']) {
      scannerSession.wait = async () => { throw Object.assign(new Error(code), { code }); };
      const demo = await measureWithScanner(fd);
      assert.match(demo.session_id, /^mock_/);
      assert.equal(demo.is_mock, true);
      assert.equal(demo.meta.fallbackFromSessionId, 'real-session');
      assert.equal(demo.meta.fallbackReason, code);
    }
    for (const error of [Object.assign(new Error('auth'), { response: { status: 401 } }), Object.assign(new Error('result'), { code: 'SCAN_RESULT_UNAVAILABLE' }), new Error('conflict')]) {
      scannerSession.wait = async () => { throw error; };
      await assert.rejects(measureWithScanner(fd), e => e === error);
    }
    const controller = new AbortController(); controller.abort();
    await assert.rejects(measureWithScanner(fd, { signal: controller.signal }));
  } finally { await server.close(); globalThis.localStorage = old; }
});
