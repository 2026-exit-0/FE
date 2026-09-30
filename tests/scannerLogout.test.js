import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

test('logout releases an owned device before clearing credentials and preserves login on failure', async () => {
  const oldStorage = globalThis.localStorage;
  const oldWindow = globalThis.window;
  const values = new Map([['damda_token', 'test-token'], ['damda_user', '{}']]);
  globalThis.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  globalThis.window = { alert() {} };
  const server = await createServer({ configFile: false, appType: 'custom', optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true, watch: null } });
  try {
    const { default: auth } = await server.ssrLoadModule('/src/store/authStore.js');
    const { default: client } = await server.ssrLoadModule('/src/api/client.js');
    const { parseApiResult } = await server.ssrLoadModule('/src/store/scanStore.js');
    const parsed = parseApiResult({ session_id: 'test', moisture: 42, sebum: 30, pore: 25 });
    assert.equal(parsed.sessionId, 'test');
    assert.equal(parsed.oil, 30);
    let rejectDelete = true;
    let deleted = 0;
    client.defaults.adapter = async config => {
      let data;
      if (config.method === 'delete') {
        assert.equal(values.get('damda_token'), 'test-token');
        if (rejectDelete) throw new Error('unlink failed');
        deleted++;
        data = null;
      } else if (config.url === '/scans/status') data = { status: 'done' };
      else data = { user_id: 'owner', device_id: 'ESP32_1' };
      return { data, status: 200, statusText: 'OK', headers: {}, config };
    };
    auth.setState({ user: { user_id: 'owner' }, isLoggedIn: true });
    assert.equal((await auth.getState().logout()).success, false);
    assert.equal(values.get('damda_token'), 'test-token');
    assert.equal(auth.getState().isLoggedIn, true);
    rejectDelete = false;
    assert.equal((await auth.getState().logout()).success, true);
    assert.equal(deleted, 1);
    assert.equal(values.has('damda_token'), false);
  } finally {
    await server.close();
    globalThis.localStorage = oldStorage;
    globalThis.window = oldWindow;
  }
});
