import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

test('scan API handles offline, invalid, demo and unsupported-device responses without live requests', async () => {
  const values = new Map([['damda_ai_mode', 'real']]);
  const oldStorage = globalThis.localStorage;
  const oldFetch = globalThis.fetch;
  globalThis.localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };
  let registryRequests = 0;
  globalThis.fetch = async () => { registryRequests++; throw new Error('No live network allowed'); };
  const server = await createServer({ configFile: false, server: { middlewareMode: true, watch: null }, appType: 'custom' });
  try {
    const { default: client } = await server.ssrLoadModule('/src/api/client.js');
    const api = await server.ssrLoadModule('/src/api/scan.js');
    let requests = 0;
    let payload = { connected: false, status: 'unreachable' };
    client.defaults.adapter = async config => {
      requests++;
      assert.equal(config.method, 'get');
      assert.equal(config.url, '/scanner/status');
      if (payload instanceof Error) throw payload;
      return { data: payload, status: 200, statusText: 'OK', headers: {}, config };
    };
    assert.equal((await api.getScannerHealth()).status, 'unreachable');
    payload = '<html>SPA fallback</html>';
    assert.equal((await api.getScannerHealth()).status, 'unreachable');
    payload = new Error('offline');
    assert.equal((await api.getScannerHealth()).status, 'unreachable');
    assert.equal(registryRequests, 0, 'registry IP alone must never mark a device online');
    const requestsBeforeMeasure = requests;
    await assert.rejects(api.measureWithScanner(new FormData()), /연동을 준비 중/);
    assert.equal(requests, requestsBeforeMeasure, 'unsupported real capture must not create a session');
    values.set('damda_ai_mode', 'mock');
    const result = await api.measureWithScanner(new FormData());
    assert.equal(result.is_mock, true);
    assert.equal((await api.getScannerHealth()).status, 'demo');
    assert.equal(requests, requestsBeforeMeasure, 'demo must not write backend data');
  } finally {
    await server.close();
    globalThis.fetch = oldFetch;
    if (oldStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = oldStorage;
  }
});
