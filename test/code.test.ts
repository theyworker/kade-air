import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { CODE_ALPHABET, CODE_LENGTH, generateCode } from '../lib/code';

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
