import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreColor } from '../src/utils/scoreColor.js';
test('overall score colors preserve boundaries and distinguish missing values', () => {
  for (const value of [null, undefined, '', NaN]) assert.equal(scoreColor(value), '#9CA3AF');
  assert.equal(scoreColor(0), '#F97316');
  assert.equal(scoreColor(49), '#F97316');
  assert.equal(scoreColor(50), '#EAB308');
  assert.equal(scoreColor(69), '#EAB308');
  assert.equal(scoreColor(70), '#4CAF50');
  assert.equal(scoreColor('84'), '#4CAF50');
});
