import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { toOrderRow } from '../lib/stats';

// A row shaped like what Neon hands back, with the message body present — which
// is what a careless change to the select list would produce.
const record = {
  code: 'K7RM2QXY',
  dish_id: 'kottu',
  sender: 'Devaka',
  recipient: 'Amma',
  message: 'the note nobody else should read',
  message_length: 32,
  chain: 2,
  created_at: '07 Aug 2026, 18:24',
  revoked: false,
};

describe('toOrderRow', () => {
  test('never carries the message body into the dashboard payload', () => {
    const row = toOrderRow(record) as Record<string, unknown>;

    assert.equal('message' in row, false);
    assert.equal(JSON.stringify(row).includes('nobody else should read'), false);
  });

  test('keeps the length so a blank note is still spottable', () => {
    assert.equal(toOrderRow(record).messageLength, 32);
    assert.equal(toOrderRow({ ...record, message_length: 0 }).messageLength, 0);
    // Absent rather than zero — the column has a not-null default, but a
    // missing key must not become NaN and render as "NaN chars".
    assert.equal(toOrderRow({ ...record, message_length: undefined }).messageLength, 0);
  });

  test('maps the columns the table actually shows', () => {
    assert.deepEqual(toOrderRow(record), {
      code: 'K7RM2QXY',
      dishId: 'kottu',
      sender: 'Devaka',
      recipient: 'Amma',
      messageLength: 32,
      chain: 2,
      createdAt: '07 Aug 2026, 18:24',
      revoked: false,
    });
  });
});
