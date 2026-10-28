import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const rules = readFileSync(new URL('../public/_redirects', import.meta.url), 'utf8')
  .split(/\r?\n/).map(line => line.trim())
  .filter(line => line && !line.startsWith('#'))
  .map(line => line.split(/\s+/));
function resolve(path) {
  for (const [from, to, status] of rules) {
    const prefix = from.endsWith('*') ? from.slice(0, -1) : null;
    if (path === from || (prefix !== null && path.startsWith(prefix))) {
      return { to: to.replace(':splat', prefix === null ? '' : path.slice(prefix.length)), status };
    }
  }
}
test('direct page navigation and trailing slashes reach the SPA', () => {
  for (const path of ['/products', '/products/', '/report', '/report/', '/mypage', '/login', '/auth/callback']) {
    assert.deepEqual(resolve(path), { to: '/index.html', status: '200' });
  }
});
test('API requests preserve endpoint paths under the dedicated prefix', () => {
  for (const endpoint of ['products', 'auth/login', 'result/session-1', 'scans/trigger', 'wishlist', 'products/1/wishlist', 'report/session-1/pdf']) {
    assert.deepEqual(resolve(`/api/${endpoint}`), { to: `https://api.damdads.kro.kr/${endpoint}`, status: '200' });
  }
});
test('device and streaming proxies retain their destinations', () => {
  assert.equal(resolve('/device-api/devices').to, 'http://52.79.241.24:8001/devices');
  assert.equal(resolve('/devices').to, 'http://52.79.241.24:8001/devices');
  assert.equal(resolve('/stream-relay').to, 'http://52.79.241.24:8001/stream');
  assert.equal(resolve('/stream-relay/ESP32_1').to, 'http://52.79.241.24:8001/stream/ESP32_1');
});
