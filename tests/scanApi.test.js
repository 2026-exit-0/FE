import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json' },
});

test('real scan uses the BE session and existing result API', async () => {
  const values = new Map([['damda_ai_mode', 'real']]);
  const oldStorage = globalThis.localStorage;
  const oldFetch = globalThis.fetch;
  globalThis.localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };

  const calls = [];
  globalThis.fetch = async () => json({ ESP32_1: '172.25.98.23' });

  const server = await createServer({
    configFile: false,
    appType: 'custom',
    optimizeDeps: { noDiscovery: true },
    server: { middlewareMode: true, watch: null },
  });
  try {
    const api = await server.ssrLoadModule('/src/api/scan.js');
    const { default: client } = await server.ssrLoadModule('/src/api/client.js');
    client.defaults.adapter = async config => {
      calls.push(config);
      let data;
      if (config.url === '/scans/trigger') data = { session_id: 'server-session', status: 'processing' };
      else if (config.url === '/scans/status') data = { session_id: 'server-session', status: 'done' };
      else if (config.url === '/result/server-session') data = { moisture: 72, sebum: 41 };
      else throw new Error(`Unexpected request: ${config.url}`);
      return { data, status: 200, statusText: 'OK', headers: {}, config };
    };
    const form = new FormData();
    form.set('region', 'FOREHEAD');
    const result = await api.measureWithScanner(form);
    assert.equal(result.session_id, 'server-session');
    assert.equal(result.moisture, 72);
    assert.deepEqual(JSON.parse(calls[0].data), { device_id: 'ESP32_1', part: 'FOREHEAD' });
    assert.equal(calls.filter(call => call.method === 'post').length, 1);
    calls.length = 0;
    await api.measureWithScanner(form, { sessionId: 'server-session' });
    assert.equal(calls.filter(call => call.method === 'post').length, 0);
  } finally {
    await server.close();
    globalThis.fetch = oldFetch;
    if (oldStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = oldStorage;
  }
});

test('scanner failure never requests demo analysis or replaces sensor data', async () => {
  const oldStorage = globalThis.localStorage;
  globalThis.localStorage = { getItem: () => 'real-token', setItem() {}, removeItem() {} };
  const server = await createServer({ configFile: false, appType: 'custom', optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true, watch: null, hmr: false } });
  try {
    const api = await server.ssrLoadModule('/src/api/scan.js');
    const calls = [];
    api.scannerSession.start = async () => { calls.push('start'); return { session_id: 'same-session' }; };
    api.scannerSession.wait = async id => { calls.push(id); throw Object.assign(new Error('wait failed'), { code: 'SCAN_WAIT_TIMEOUT' }); };
    const { default: client } = await server.ssrLoadModule('/src/api/client.js');
    client.defaults.adapter = async () => { assert.fail('unexpected fallback request'); };
    let knownId;
    await assert.rejects(api.measureWithScanner(new FormData(), { onSession: id => { knownId = id; } }), { code: 'SCAN_WAIT_TIMEOUT' });
    await assert.rejects(api.measureWithScanner(new FormData(), { sessionId: knownId }), { code: 'SCAN_WAIT_TIMEOUT' });
    assert.deepEqual(calls, ['start', 'same-session', 'same-session']);
    api.scannerSession.start = async () => { throw new Error('offline'); };
    await assert.rejects(api.measureWithScanner(new FormData()), /offline/);
  } finally { await server.close(); globalThis.localStorage = oldStorage; }
});
