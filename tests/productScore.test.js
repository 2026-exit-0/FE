import test from 'node:test';
import assert from 'node:assert/strict';
import { productScore, productScoreLabel, compareProductScore } from '../src/utils/productScore.js';
test('missing or invalid scores are not zero; real zero overrides legacy compatibility', () => {
  for (const score of [undefined, null, '', ' ', NaN, Infinity, 'invalid', false]) {
    assert.equal(productScore({score}), null);
    assert.equal(productScoreLabel({score}), '적합도 정보 없음');
  }
  assert.equal(productScoreLabel({score:0,compatibility:90}), '0.0점');
  assert.equal(productScoreLabel({match_score:'82.5'}), '82.5점');
  assert.equal(productScoreLabel({compatibility:0}), '0.0점');
});
test('unscored products sort after actual zero scores', () => {
  const products = [{id:'missing'},{id:'zero',score:0},{id:'high',score:90}];
  assert.deepEqual(products.sort(compareProductScore).map(p=>p.id), ['high','zero','missing']);
});
