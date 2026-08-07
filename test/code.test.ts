import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { CODE_ALPHABET, CODE_LENGTH, generateCode, isCode } from '../lib/code';

describe('code alphabet', () => {
  test('contains exactly 30 characters', () => {
    assert.equal(CODE_ALPHABET.length, 30);
  });

  test('has no repeated characters', () => {
    assert.equal(new Set(CODE_ALPHABET).size, CODE_ALPHABET.length);
  });

  test('excludes the visually ambiguous glyphs 0, 1, I, L, O and U', () => {
    for (const c of ['0', '1', 'I', 'L', 'O', 'U']) {
      assert.equal(CODE_ALPHABET.includes(c), false, `alphabet must not contain ${c}`);
    }
  });

  test('is uppercase and alphanumeric only', () => {
    assert.match(CODE_ALPHABET, /^[A-Z2-9]+$/);
  });
});

describe('generateCode', () => {
  test('returns a code of exactly CODE_LENGTH characters', () => {
    assert.equal(generateCode().length, CODE_LENGTH);
  });

  test('returns codes drawn only from the alphabet', () => {
    for (let i = 0; i < 200; i++) {
      for (const ch of generateCode()) {
        assert.ok(CODE_ALPHABET.includes(ch), `unexpected character ${ch}`);
      }
    }
  });

  test('produces no duplicates across 10000 draws', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 10000; i++) seen.add(generateCode());
    assert.equal(seen.size, 10000);
  });

  test('uses every alphabet character across a large sample', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 5000; i++) for (const ch of generateCode()) seen.add(ch);
    assert.equal(seen.size, CODE_ALPHABET.length);
  });
});

describe('isCode', () => {
  test('accepts a code this app minted', () => {
    for (let i = 0; i < 50; i++) assert.equal(isCode(generateCode()), true);
  });

  test('rejects the wrong length', () => {
    assert.equal(isCode('ABCDEFG'), false);
    assert.equal(isCode('ABCDEFGHJ'), false);
    assert.equal(isCode(''), false);
  });

  test('rejects characters outside the alphabet, including the ones it drops', () => {
    for (const c of ['0', '1', 'I', 'L', 'O', 'U', '-', ' ']) {
      assert.equal(isCode(`ABCDEFG${c}`), false, `${c} must not pass`);
    }
  });

  test('rejects lowercase, since codes are minted uppercase', () => {
    assert.equal(isCode('abcdefgh'), false);
  });

  test('rejects a value trying to be more than a code', () => {
    assert.equal(isCode('ABCDEFGH\nDROP TABLE orders'), false);
  });
});
