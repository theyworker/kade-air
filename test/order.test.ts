import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeOrder, decodeOrder } from '../lib/order';

describe('encodeOrder / decodeOrder', () => {
  test('round-trips a complete order unchanged', () => {
    const order = { dishId: 'kottu', sender: 'Devaka', recipient: 'Amma', message: 'Enjoy!', chain: 3 };
    assert.deepEqual(decodeOrder(encodeOrder(order)), order);
  });
});
