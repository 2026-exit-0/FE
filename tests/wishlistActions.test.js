import test from 'node:test';
import assert from 'node:assert/strict';
import { createWishlistActions } from '../src/store/wishlistActions.js';

function setup(overrides = {}) {
  let state = { user: { user_id: 'a' }, wishlist: [] };
  let token = 'token-a';
  const writes = [];
  const changes = [];
  const api = {
    token: () => token,
    load: async () => [{ product_id: '1', name_kr: '제품' }],
    normalize: (p) => ({ ...p, id: p.product_id, name: p.name_kr }),
    change: async (id, add) => { changes.push([id, add]); },
    read: () => [{ id: 'guest' }],
    write: (id, list) => writes.push([id, list]),
    ...overrides,
  };
  const actions = createWishlistActions((patch) => Object.assign(state, patch), () => state, api);
  Object.assign(state, actions);
  return { state, actions, writes, changes, switchAccount: () => { token = 'token-b'; state.user = { user_id: 'b' }; state.wishlist = []; } };
}

test('server list replaces local cache and normalizes product identifiers', async () => {
  const t = setup();
  t.state.wishlist = [{ id: 'old-local' }];
  await t.actions.fetchWishlist();
  assert.equal(t.state.wishlist[0].id, '1');
  assert.equal(t.state.wishlist[0].name, '제품');
  assert.equal(t.writes[0][0], 'a');
});

test('delete and undo both persist through API without restoring unrelated entries', async () => {
  const t = setup();
  const product = { id: '1' };
  await t.actions.toggleWish(product, true);
  await t.actions.toggleWish(product, false);
  assert.equal(t.state.wishlist.length, 0);
  await t.actions.toggleWish({ id: '2' }, true);
  await t.actions.toggleWish(product, true);
  assert.deepEqual(t.state.wishlist.map(p => p.id), ['2', '1']);
  assert.deepEqual(t.changes, [['1', true], ['1', false], ['2', true], ['1', true]]);
});

test('failed save preserves the previous list and exposes an error', async () => {
  const t = setup({ change: async () => { throw new Error('offline'); } });
  t.state.wishlist = [{ id: '1' }];
  assert.equal((await t.actions.toggleWish({ id: '1' })).success, false);
  assert.equal(t.state.wishlist.length, 1);
  assert.ok(t.state.wishlistError);
  assert.equal(t.writes.length, 0);
});

test('late response after switching accounts cannot overwrite new account', async () => {
  let resolve;
  const t = setup({ load: () => new Promise(r => { resolve = r; }) });
  const request = t.actions.fetchWishlist();
  t.switchAccount();
  resolve([{ product_id: 'private-a' }]);
  await request;
  assert.deepEqual(t.state.wishlist, []);
  assert.equal(t.writes.length, 0);
});

test('rapid double click sends only one mutation', async () => {
  let resolve;
  let count = 0;
  const t = setup({ change: () => { count++; return new Promise(r => { resolve = r; }); } });
  const first = t.actions.toggleWish({ id: '1' });
  await t.actions.toggleWish({ id: '1' });
  resolve();
  await first;
  assert.equal(count, 1);
  assert.equal(t.state.wishlist.length, 1);
});

test('guest wishlist remains local and never calls server', async () => {
  const t = setup({ token: () => 'demo_access_token', change: async () => { assert.fail('server call'); } });
  await t.actions.fetchWishlist();
  await t.actions.toggleWish({ id: 'guest' });
  assert.deepEqual(t.state.wishlist, []);
});

test('failed load preserves cache with an explicit error', async () => {
  const t = setup({ load: async () => { throw new Error('offline'); } });
  t.state.wishlist = [{ id: 'cached' }];
  await t.actions.fetchWishlist();
  assert.equal(t.state.wishlist[0].id, 'cached');
  assert.ok(t.state.wishlistError);
  assert.equal(t.state.wishlistBusy, false);
});
