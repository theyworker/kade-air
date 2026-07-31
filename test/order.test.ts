import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  encodeOrder,
  decodeOrder,
  senderDisplay,
  recipientDisplay,
  messageDisplay,
  MAX_NAME,
  MAX_MESSAGE,
} from '../lib/order';
import { DEFAULT_MESSAGE } from '../lib/messages';

// Base64url-encodes an arbitrary JSON-serializable payload so tests can hand-craft
// tokens that are out of spec (e.g. an over-long field, an out-of-range chain)
// without reaching into lib/order.ts's unexported encoder.
function encodeRawPayload(payload: unknown): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

describe('encodeOrder / decodeOrder round-trip', () => {
  test('round-trips a complete order unchanged', () => {
    const order = { dishId: 'kottu', sender: 'Devaka', recipient: 'Amma', message: 'Enjoy!', chain: 3 };
    assert.deepEqual(decodeOrder(encodeOrder(order)), order);
  });

  test('round-trips empty sender, recipient, and message as empty strings', () => {
    const order = { dishId: 'kottu', sender: '', recipient: '', message: '', chain: 1 };
    assert.deepEqual(decodeOrder(encodeOrder(order)), order);
  });

  test('round-trips non-ASCII Sinhala content unchanged', () => {
    const sinhala = 'කපන් හුලන්';
    const order = { dishId: 'kottu', sender: sinhala, recipient: sinhala, message: sinhala, chain: 1 };
    assert.deepEqual(decodeOrder(encodeOrder(order)), order);
  });

  test('round-trips emoji in the message unchanged', () => {
    const order = {
      dishId: 'kottu',
      sender: 'Devaka',
      recipient: 'Amma',
      message: 'Sending you some lunch 😌❤️🎂',
      chain: 1,
    };
    assert.deepEqual(decodeOrder(encodeOrder(order)), order);
  });
});

describe('clean() behaviour, observed through encode/decode', () => {
  test('replaces control characters with a space and collapses resulting whitespace', () => {
    const order = { dishId: 'kottu', sender: 'A\x00B', recipient: 'Amma', message: 'Enjoy!', chain: 1 };
    const decoded = decodeOrder(encodeOrder(order));
    assert.equal(decoded?.sender, 'A B');
  });

  test('collapses runs of internal whitespace to a single space', () => {
    const order = { dishId: 'kottu', sender: 'A    B', recipient: 'Amma', message: 'Enjoy!', chain: 1 };
    const decoded = decodeOrder(encodeOrder(order));
    assert.equal(decoded?.sender, 'A B');
  });

  test('trims leading and trailing whitespace', () => {
    const order = { dishId: 'kottu', sender: '   Devaka   ', recipient: 'Amma', message: 'Enjoy!', chain: 1 };
    const decoded = decodeOrder(encodeOrder(order));
    assert.equal(decoded?.sender, 'Devaka');
  });
});

describe('truncation', () => {
  test('truncates a sender longer than MAX_NAME to exactly MAX_NAME characters', () => {
    const longSender = 'A'.repeat(MAX_NAME + 10);
    const order = { dishId: 'kottu', sender: longSender, recipient: 'Amma', message: 'Enjoy!', chain: 1 };
    const decoded = decodeOrder(encodeOrder(order));
    assert.equal(decoded?.sender.length, MAX_NAME);
    assert.equal(decoded?.sender, 'A'.repeat(MAX_NAME));
  });

  test('truncates a message longer than MAX_MESSAGE to exactly MAX_MESSAGE characters', () => {
    const longMessage = 'B'.repeat(MAX_MESSAGE + 20);
    const order = { dishId: 'kottu', sender: 'Devaka', recipient: 'Amma', message: longMessage, chain: 1 };
    const decoded = decodeOrder(encodeOrder(order));
    assert.equal(decoded?.message.length, MAX_MESSAGE);
    assert.equal(decoded?.message, 'B'.repeat(MAX_MESSAGE));
  });
});

describe('chain clamping', () => {
  const withChain = (chain: number) =>
    decodeOrder(
      encodeOrder({ dishId: 'kottu', sender: 'Devaka', recipient: 'Amma', message: 'Enjoy!', chain })
    )?.chain;

  test('clamps zero up to 1', () => {
    assert.equal(withChain(0), 1);
  });

  test('clamps negative values up to 1', () => {
    assert.equal(withChain(-5), 1);
  });

  test('clamps values above 9999 down to 9999', () => {
    assert.equal(withChain(10000), 9999);
  });

  test('rounds a fractional value to the nearest integer', () => {
    assert.equal(withChain(2.7), 3);
  });

  test('falls back to 1 for NaN', () => {
    assert.equal(withChain(NaN), 1);
  });
});

describe('decodeOrder defensive parsing (returns null, never throws)', () => {
  test('returns null for the empty string', () => {
    assert.equal(decodeOrder(''), null);
  });

  test('returns null for a string that is not valid base64url', () => {
    assert.equal(decodeOrder('!!!!'), null);
  });

  test('returns null for valid base64url that is not JSON', () => {
    const token = Buffer.from('not json at all', 'utf8').toString('base64url');
    assert.equal(decodeOrder(token), null);
  });

  test('returns null for valid JSON that is a bare number, not an object', () => {
    assert.equal(decodeOrder(encodeRawPayload(42)), null);
  });

  test('returns null for valid JSON that is null, not an object', () => {
    assert.equal(decodeOrder(encodeRawPayload(null)), null);
  });

  test('returns null for valid JSON that is an array, not an object with a d key', () => {
    assert.equal(decodeOrder(encodeRawPayload([])), null);
  });

  test('returns null for a JSON object with no d key', () => {
    assert.equal(decodeOrder(encodeRawPayload({ s: 'Devaka' })), null);
  });
});

describe('defensive decode of hand-crafted, out-of-spec tokens', () => {
  test('clamps an over-long s field instead of trusting the payload', () => {
    const token = encodeRawPayload({ d: 'kottu', s: 'X'.repeat(MAX_NAME + 50), c: 1 });
    const decoded = decodeOrder(token);
    assert.equal(decoded?.sender.length, MAX_NAME);
    assert.equal(decoded?.sender, 'X'.repeat(MAX_NAME));
  });

  test('clamps an out-of-range c field instead of trusting the payload', () => {
    const token = encodeRawPayload({ d: 'kottu', c: 999999 });
    const decoded = decodeOrder(token);
    assert.equal(decoded?.chain, 9999);
  });
});

describe('base64url alphabet', () => {
  test('an encoded token contains none of +, /, or =', () => {
    // Emoji-heavy content whose standard-base64 encoding is known to contain
    // '+', '/', and '=', so this assertion actually exercises the substitution
    // rather than passing vacuously.
    const order = {
      dishId: 'kottu',
      sender: 'Devaka ❤️😌',
      recipient: 'Amma',
      message: 'Sending lots of love 😌❤️👀🎂✨⭐',
      chain: 9999,
    };
    const token = encodeOrder(order);
    assert.equal(/[+/=]/.test(token), false);
  });
});

describe('display helpers', () => {
  test('senderDisplay falls back to "a secret machan" when sender is empty', () => {
    assert.equal(senderDisplay({ sender: '' }), 'a secret machan');
  });

  test('senderDisplay falls back to "a secret machan" when sender is whitespace-only', () => {
    assert.equal(senderDisplay({ sender: '   ' }), 'a secret machan');
  });

  test('senderDisplay returns the sender name when present', () => {
    assert.equal(senderDisplay({ sender: 'Devaka' }), 'Devaka');
  });

  test('recipientDisplay falls back to "your machan" when recipient is empty', () => {
    assert.equal(recipientDisplay({ recipient: '' }), 'your machan');
  });

  test('recipientDisplay returns the recipient name when present', () => {
    assert.equal(recipientDisplay({ recipient: 'Amma' }), 'Amma');
  });

  test('messageDisplay falls back to DEFAULT_MESSAGE when message is empty', () => {
    assert.equal(messageDisplay({ message: '' }), DEFAULT_MESSAGE);
  });

  test('messageDisplay returns the message when present', () => {
    assert.equal(messageDisplay({ message: 'Enjoy!' }), 'Enjoy!');
  });
});

describe('Unicode edge cases — documented, not endorsed', () => {
  test('currently lets bidi override characters through unstripped (documented, not endorsed)', () => {
    const message = 'foo‮bar‬';
    const order = { dishId: 'kottu', sender: 'Devaka', recipient: 'Amma', message, chain: 1 };
    const decoded = decodeOrder(encodeOrder(order));
    assert.equal(decoded?.message, message);
  });

  test('currently lets zero-width characters through unstripped (documented, not endorsed)', () => {
    const message = 'foo​bar';
    const order = { dishId: 'kottu', sender: 'Devaka', recipient: 'Amma', message, chain: 1 };
    const decoded = decodeOrder(encodeOrder(order));
    assert.equal(decoded?.message, message);
  });
});
