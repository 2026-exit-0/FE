import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json' },
});

test('real scan dispatches one device command and returns the matching Supabase row', async () => {
  const values = new Map([['damda_ai_mode', 'real']]);
  const oldStorage = globalThis.localStorage;
  const oldFetch = globalThis.fetch;
  globalThis.localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };

  const calls = [];
  let requestedMember = null;
  globalThis.fetch = async (url, options = {}) => {
    const request = { url: String(url), method: options.method || 'GET', body: options.body };
    calls.push(request);
    if (request.url.endsWith('/devices')) return json({ ESP32_1: '172.25.98.23' });
    if (request.url.endsWith('/scan-command')) {
      requestedMember = JSON.parse(request.body).member;
      return json({ status: 'ok' });
    }
    if (requestedMember && request.url.endsWith(`/scans/${requestedMember}`)) {
      return json([{
        id: 11,
        timestamp: '20260928_120000',
        moisture: 72,
        oil: 41,
        white_img: 'https://storage.example/white.jpg',
        uv_img: 'https://storage.example/uv.jpg',
      }]);
    }
    throw new Error(`Unexpected request: ${url}`);
  };

  const server = await createServer({
    configFile: false,
    appType: 'custom',
    optimizeDeps: { noDiscovery: true },
    server: { middlewareMode: true, watch: null },
  });
  try {
    const api = await server.ssrLoadModule('/src/api/scan.js');
    const health = await api.getScannerHealth();
    assert.equal(health.status, 'ok');
    assert.match(health.message, /기기 등록 확인됨/);

    const form = new FormData();
    form.set('region', 'FOREHEAD');
    const result = await api.measureWithScanner(form);
    assert.equal(result.is_mock, false);
    assert.equal(result.moisture, 72);
    assert.equal(result.oil, 41);
    assert.equal(result.white_image_url, 'https://storage.example/white.jpg');
    assert.equal(result.uv_image_url, 'https://storage.example/uv.jpg');
    assert.equal(result.meta.member, requestedMember);

    const command = calls.find(call => call.url.endsWith('/scan-command'));
    assert.ok(command);
    assert.equal(command.method, 'POST');
    const body = JSON.parse(command.body);
    assert.equal(body.device_id, 'ESP32_1');
    assert.equal(body.part, 'FOREHEAD');
    assert.match(body.member, /^M1_WEB_[A-Z0-9]+$/);
  } finally {
    await server.close();
    globalThis.fetch = oldFetch;
    if (oldStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = oldStorage;
  }
});

test('offline device stays unavailable and demo mode sends no network request', async () => {
  const values = new Map([['damda_ai_mode', 'real']]);
  const oldStorage = globalThis.localStorage;
  const oldFetch = globalThis.fetch;
  globalThis.localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };
  let requests = 0;
  globalThis.fetch = async () => { requests++; throw new Error('offline'); };
  const server = await createServer({
    configFile: false,
    appType: 'custom',
    optimizeDeps: { noDiscovery: true },
    server: { middlewareMode: true, watch: null },
  });
  try {
    const api = await server.ssrLoadModule('/src/api/scan.js');
    assert.equal((await api.getScannerHealth()).status, 'unreachable');
    values.set('damda_ai_mode', 'mock');
    const beforeDemo = requests;
    const result = await api.measureWithScanner(new FormData());
    assert.equal(result.is_mock, true);
    assert.equal((await api.getScannerHealth()).status, 'demo');
    assert.equal(requests, beforeDemo);
  } finally {
    await server.close();
    globalThis.fetch = oldFetch;
    if (oldStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = oldStorage;
  }
});
