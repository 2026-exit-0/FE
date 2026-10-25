import test from 'node:test';
import assert from 'node:assert/strict';
import { productPrice, productPriceLabel, compareProductPrice } from '../src/utils/productPrice.js';
test('actual prices override ranges and preserve zero', () => {
  assert.equal(productPriceLabel({price:25000,price_range:'3~5만원'}), '25,000원');
  assert.equal(productPriceLabel({price:'0'}), '0원');
  assert.equal(productPriceLabel({price:null,price_range:'3~5만원'}), '가격대 3~5만원');
  assert.equal(productPriceLabel({}), '가격 정보 없음');
  for (const v of [null, undefined, '', ' ', true, -1, Infinity, 'unknown']) assert.equal(productPrice(v), null);
});
test('missing prices sort last in both directions without invented range prices', () => {
  const items = [{id:'unknown',price_range:'10만원+'},{id:'low',price:10000},{id:'high',price:'50000'},{id:'zero',price:0}];
  assert.deepEqual([...items].sort(compareProductPrice).map(p=>p.id), ['zero','low','high','unknown']);
  assert.deepEqual([...items].sort((a,b)=>compareProductPrice(a,b,true)).map(p=>p.id), ['high','low','zero','unknown']);
});
