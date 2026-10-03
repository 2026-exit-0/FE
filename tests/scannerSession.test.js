import test from 'node:test';
import assert from 'node:assert/strict';
import { createScannerSessionApi } from '../src/api/scannerSession.js';

const failure = (status) => Object.assign(new Error('request failed'), { response: { status } });

test('no history is idle, while server errors are not hidden', async () => {
  const api = createScannerSessionApi({ get: async () => { throw failure(404); } }, 'ESP32_1');
  assert.equal(await api.status(), null);
  const broken = createScannerSessionApi({ get: async () => { throw failure(500); } }, 'ESP32_1');
  await assert.rejects(broken.status());
});

test('web start sends one authenticated-client command with device and part', async () => {
  const calls = [];
  const api = createScannerSessionApi({ post: async (...args) => {
    calls.push(args);
    return { data: { session_id: 'one', status: 'processing' } };
  } }, 'ESP32_1');
  await api.start('NOSE');
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], '/scans/trigger');
  assert.deepEqual(calls[0][1], { device_id: 'ESP32_1', part: 'NOSE' });
});

test('409 resumes the current device session without sending another command', async () => {
  let commands = 0;
  const api = createScannerSessionApi({
    post: async () => { commands++; throw failure(409); },
    get: async () => ({ data: { session_id: 'existing', device_id: 'ESP32_1', status: 'processing' } }),
  }, 'ESP32_1');
  assert.equal((await api.start()).session_id, 'existing');
  assert.equal(commands, 1);
});

test('hardware completion fetches only that session result and never posts', async () => {
  const calls = [];
  const states = ['pending', 'processing', 'done'];
  const api = createScannerSessionApi({ get: async (path) => {
    calls.push(path);
    return { data: path === '/scans/status'
      ? { session_id: 'physical', status: states.shift() }
      : { moisture: 42, sebum: 31 } };
  } }, 'ESP32_1');
  const result = await api.wait('physical', { intervalMs: 0 });
  assert.equal(result.session_id, 'physical');
  assert.equal(result.moisture, 42);
  assert.equal(calls.at(-1), '/result/physical');
});

test('a different latest session is never used as the requested result', async () => {
  const api = createScannerSessionApi({ get: async () => ({ data: { session_id: 'other', status: 'done' } }) }, 'ESP32_1');
  await assert.rejects(api.wait('mine'), /다른 촬영/);
});

test('failed sessions and cancelled waits never fetch results', async () => {
  const api = createScannerSessionApi({ get: async () => ({ data: { session_id: 'mine', status: 'failed' } }) }, 'ESP32_1');
  await assert.rejects(api.wait('mine'), /실패/);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(api.wait('mine', { signal: controller.signal }), { name: 'AbortError' });
});

test('unlink accepts already removed links but preserves authorization failures', async () => {
  const api = createScannerSessionApi({ delete: async () => { throw failure(404); } }, 'ESP32_1');
  await api.unlink();
  const denied = createScannerSessionApi({ delete: async () => { throw failure(403); } }, 'ESP32_1');
  await assert.rejects(denied.unlink());
});

test('transient status and result failures recover without a new scan command', async () => {
  let statusCalls = 0;
  let resultCalls = 0;
  const api = createScannerSessionApi({
    post: async () => assert.fail('must not trigger another scan'),
    get: async path => {
      if (path === '/scans/status') {
        statusCalls++;
        if (statusCalls === 1) throw Object.assign(new Error('offline'), { code: 'ERR_NETWORK' });
        if (statusCalls === 2) throw failure(503);
        return { data: { session_id: 'physical', status: 'done' } };
      }
      assert.equal(path, '/result/physical');
      if (++resultCalls === 1) throw failure(502);
      return { data: { moisture: 72 } };
    },
  }, 'ESP32_1');
  const result = await api.wait('physical', { intervalMs: 0 });
  assert.equal(result.session_id, 'physical');
  assert.equal(result.moisture, 72);
  assert.equal(resultCalls, 2);
});

test('authorization failures are not retried', async () => {
  let calls = 0;
  const api = createScannerSessionApi({ get: async () => { calls++; throw failure(403); } }, 'ESP32_1');
  await assert.rejects(api.wait('physical', { intervalMs: 0 }));
  assert.equal(calls, 1);
});

test('an offline wait stops at its deadline and can resume the same session', async () => {
  let offline = true;
  const api = createScannerSessionApi({ get: async path => {
    if (offline) throw failure(503);
    return { data: path === '/scans/status' ? { session_id: 'physical', status: 'done' } : { moisture: 60 } };
  } }, 'ESP32_1');
  await assert.rejects(api.wait('physical', { intervalMs: 1, timeoutMs: 10 }), { code: 'SCAN_WAIT_TIMEOUT' });
  offline = false;
  assert.equal((await api.wait('physical')).session_id, 'physical');
});

test('cancellation also stops a wait during a network failure', async () => {
  const controller = new AbortController();
  const api = createScannerSessionApi({ get: async () => {
    controller.abort();
    throw failure(503);
  } }, 'ESP32_1');
  await assert.rejects(api.wait('physical', { signal: controller.signal }), { name: 'AbortError' });
});

test('a seen session can finish after timeout, but completed and historical results are ignored', async () => {
  const { shouldResumeScan } = await import('../src/api/scannerSession.js');
  const done = { session_id: 'physical', device_id: 'ESP32_1', status: 'done' };
  const context = { deviceId: 'ESP32_1', previousId: 'physical', activeId: 'physical', completedId: null };
  assert.equal(shouldResumeScan(done, context), true);
  assert.equal(shouldResumeScan(done, { ...context, completedId: 'physical' }), false);
  assert.equal(shouldResumeScan(done, { ...context, activeId: null, previousId: undefined }), false);
  assert.equal(shouldResumeScan(done, { ...context, deviceId: 'another-device' }), false);
  assert.equal(shouldResumeScan({ ...done, status: 'failed' }, context), false);
});
