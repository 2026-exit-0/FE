import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSavedRecommendations } from '../src/api/savedRecommendations.js';

test('opening and refreshing saved recommendations never regenerates them', async () => {
  const calls = [];
  const response = { data: [{ product_id: 1 }] };
  const client = {
    get: async (path) => { calls.push(['get', path]); return response; },
    post: async () => { throw new Error('unexpected regeneration'); },
  };
  assert.equal(await loadSavedRecommendations(client, 'session/1'), response);
  assert.equal(await loadSavedRecommendations(client, 'session/1'), response);
  assert.deepEqual(calls, Array(2).fill(['get', '/scans/session%2F1/recommend']));
});

test('missing saved recommendations are generated once', async () => {
  const calls = [];
  const response = { data: [{ product_id: 2 }] };
  const client = {
    get: async () => { calls.push('get'); throw { response: { status: 404 } }; },
    post: async () => { calls.push('post'); return response; },
  };
  assert.equal(await loadSavedRecommendations(client, 'session'), response);
  assert.deepEqual(calls, ['get', 'post']);
});

test('authentication and server failures do not trigger generation', async () => {
  for (const status of [401, 403, 500, undefined]) {
    const error = { response: { status } };
    let generated = false;
    await assert.rejects(loadSavedRecommendations({
      get: async () => { throw error; },
      post: async () => { generated = true; },
    }, 'session'), (caught) => caught === error);
    assert.equal(generated, false);
  }
});
