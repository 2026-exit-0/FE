import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

test('history responses belong to the authentication session that requested them', async (t) => {
  const previousStorage = globalThis.localStorage;
  const values = new Map([['damda_ai_mode', 'real']]);
  globalThis.localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };
  const server = await createServer({ configFile: false, appType: 'custom', optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true, watch: null } });
  try {
    const { default: store } = await server.ssrLoadModule('/src/store/scanStore.js');
    const { default: client } = await server.ssrLoadModule('/src/api/client.js');
    const requests = [];
    client.defaults.adapter = config => new Promise(resolve => {
      requests.push(data => resolve({ data, status: 200, statusText: 'OK', headers: {}, config }));
    });
    const startRequest = async () => {
      const result = store.getState().fetchHistory();
      await new Promise(resolve => setImmediate(resolve));
      const respond = requests.shift();
      assert.ok(respond);
      return { result, respond };
    };
    const row = session_id => [{ session_id, moisture: 60 }];

    await t.test('late A response cannot overwrite B history or persisted state', async () => {
      values.set('damda_token', 'A');
      store.getState().clearAll();
      const a = await startRequest();
      store.getState().clearAll();
      values.set('damda_token', 'B');
      const b = await startRequest();
      b.respond(row('B-scan'));
      await b.result;
      a.respond(row('A-scan'));
      assert.deepEqual(await a.result, []);
      assert.equal(store.getState().currentScan.sessionId, 'B-scan');
      assert.equal(store.getState().scans.length, 1);
      assert.equal(JSON.parse(values.get('skinlab_scan_store')).state.currentScan.sessionId, 'B-scan');
    });

    await t.test('logout invalidates an outstanding response', async () => {
      values.set('damda_token', 'A');
      store.getState().clearAll();
      const a = await startRequest();
      values.delete('damda_token');
      store.getState().clearAll();
      a.respond(row('A-scan'));
      assert.deepEqual(await a.result, []);
      assert.equal(store.getState().currentScan, null);
    });

    await t.test('reset invalidates a response even when the token is reused', async () => {
      values.set('damda_token', 'same-token');
      const a = await startRequest();
      store.getState().clearAll();
      a.respond(row('old-session'));
      assert.deepEqual(await a.result, []);
      assert.deepEqual(store.getState().scans, []);
    });

    await t.test('a token change without reset still rejects the old response', async () => {
      values.set('damda_token', 'A');
      const a = await startRequest();
      values.set('damda_token', 'B');
      a.respond(row('A-scan'));
      assert.deepEqual(await a.result, []);
      assert.equal(store.getState().currentScan, null);
    });
  } finally {
    await server.close();
    if (previousStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previousStorage;
  }
});
