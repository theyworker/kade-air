import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_MESSAGE,
  MAX_NAME,
  messageDisplay,
  recipientDisplay,
  sanitizeOrder,
  senderDisplay,
} from '../lib/order';
import { DEFAULT_MESSAGE } from '../lib/messages';

const base = { dishId: 'kottu', sender: '', recipient: '', message: '', chain: 1 };
const withSender = (sender: string) => sanitizeOrder({ ...base, sender }).sender;
const withMessage = (message: string) => sanitizeOrder({ ...base, message }).message;
const withChain = (chain: number) => sanitizeOrder({ ...base, chain }).chain;

describe('sanitizeOrder cleaning', () => {
  test('replaces control characters with a space and collapses resulting whitespace', () => {
    assert.equal(withSender('A\x00B'), 'A B');
  });

  test('replaces the DEL control character (\\x7f) with a space, not just \\x00', () => {
    assert.equal(withSender('A\x7fB'), 'A B');
  });

  test('collapses runs of internal whitespace to a single space', () => {
    assert.equal(withSender('A    B'), 'A B');
  });

  test('trims leading and trailing whitespace', () => {
    assert.equal(withSender('   Devaka   '), 'Devaka');
  });

  test('leaves non-ASCII Sinhala content intact', () => {
    assert.equal(withMessage('කපන් හුලන්'), 'කපන් හුලන්');
  });

  test('leaves emoji intact', () => {
    assert.equal(withMessage('Enjoy! ❤️'), 'Enjoy! ❤️');
  });
});

describe('sanitizeOrder dishId validation', () => {
  test('a known dish id survives unchanged', () => {
    assert.equal(sanitizeOrder({ ...base, dishId: 'biryani' }).dishId, 'biryani');
  });

  test('an unknown dish id falls back to kottu', () => {
    assert.equal(sanitizeOrder({ ...base, dishId: 'not-a-real-dish' }).dishId, 'kottu');
  });

  test('a very long dishId falls back rather than being stored', () => {
    assert.equal(sanitizeOrder({ ...base, dishId: 'x'.repeat(100_000) }).dishId, 'kottu');
  });
});

describe('sanitizeOrder truncation', () => {
  test('truncates a sender longer than MAX_NAME to exactly MAX_NAME characters', () => {
    assert.equal(withSender('A'.repeat(MAX_NAME + 10)), 'A'.repeat(MAX_NAME));
  });

  test('truncates a message longer than MAX_MESSAGE to exactly MAX_MESSAGE characters', () => {
    assert.equal(withMessage('B'.repeat(MAX_MESSAGE + 50)), 'B'.repeat(MAX_MESSAGE));
  });

  test('truncation can split a surrogate pair mid-emoji, leaving a lone surrogate (documented, not endorsed)', () => {
    const result = withMessage('A'.repeat(MAX_MESSAGE - 1) + '😌' + 'tail');
    assert.equal(result.length, MAX_MESSAGE);
    assert.equal(result.charCodeAt(MAX_MESSAGE - 1), 0xd83d);
  });
});

describe('sanitizeOrder chain clamping', () => {
  test('clamps zero up to 1', () => assert.equal(withChain(0), 1));
  test('clamps negative values up to 1', () => assert.equal(withChain(-5), 1));
  test('clamps values above 9999 down to 9999', () => assert.equal(withChain(10000), 9999));
  test('rounds a fractional value to the nearest integer', () => assert.equal(withChain(2.7), 3));
  test('rounds 2.4 down to 2, distinguishing rounding from ceiling', () => assert.equal(withChain(2.4), 2));
  test('falls back to 1 for NaN', () => assert.equal(withChain(NaN), 1));
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
    assert.equal(withSender('A‮B'), 'A‮B');
  });

  test('currently lets zero-width characters through unstripped (documented, not endorsed)', () => {
    assert.equal(withSender('A​B'), 'A​B');
  });
});
