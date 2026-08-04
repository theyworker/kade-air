import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

// Importing this module must not demand Redis credentials — createLimiter and
// readLimiter are getters that build their client lazily, on first use, not on
// import. If this import throws, the whole suite fails before any assertion
// runs, which is itself the signal.
import { clientIp } from '../lib/ratelimit';

describe('clientIp', () => {
  test('returns the single value of x-forwarded-for', () => {
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.5' });
    assert.equal(clientIp(headers), '203.0.113.5');
  });

  test('takes the first entry of a comma-separated list, trimmed', () => {
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.5, 10.0.0.1, 10.0.0.2' });
    assert.equal(clientIp(headers), '203.0.113.5');
  });

  test('falls back to "unknown" when the header is absent', () => {
    const headers = new Headers();
    assert.equal(clientIp(headers), 'unknown');
  });

  test('falls back to "unknown" when the header is an empty string', () => {
    const headers = new Headers({ 'x-forwarded-for': '' });
    assert.equal(clientIp(headers), 'unknown');
  });
});
