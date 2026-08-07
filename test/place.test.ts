import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_PLACE,
  UNKNOWN_PLACE,
  localTime,
  placeDisplay,
  placeFromHeaders,
  sanitizePlace,
} from '../lib/place';

const vercel = (over: Record<string, string> = {}) =>
  new Headers({
    'x-vercel-ip-city': 'Colombo',
    'x-vercel-ip-country-region': 'WP',
    'x-vercel-ip-country': 'LK',
    'x-vercel-ip-timezone': 'Asia/Colombo',
    ...over,
  });

describe('placeFromHeaders', () => {
  test('reads the estimate the edge attached', () => {
    assert.deepEqual(placeFromHeaders(vercel()), {
      label: 'Colombo, WP, LK',
      timeZone: 'Asia/Colombo',
    });
  });

  test('decodes a percent-encoded city name', () => {
    const place = placeFromHeaders(vercel({ 'x-vercel-ip-city': 'S%C3%A3o%20Paulo' }));
    assert.equal(place.label, 'São Paulo, WP, LK');
  });

  test('keeps a malformed encoding as-is rather than throwing', () => {
    const place = placeFromHeaders(vercel({ 'x-vercel-ip-city': 'Colombo%' }));
    assert.equal(place.label, 'Colombo%, WP, LK');
  });

  test('falls back to Cloudflare header names', () => {
    const headers = new Headers({
      'cf-ipcity': 'Kandy',
      'cf-region-code': 'CP',
      'cf-ipcountry': 'LK',
      'cf-timezone': 'Asia/Colombo',
    });
    assert.deepEqual(placeFromHeaders(headers), {
      label: 'Kandy, CP, LK',
      timeZone: 'Asia/Colombo',
    });
  });

  test('is unknown when no edge attached anything, as in local development', () => {
    assert.deepEqual(placeFromHeaders(new Headers()), UNKNOWN_PLACE);
  });

  test('drops the parts the edge could not resolve rather than leaving gaps', () => {
    const place = placeFromHeaders(vercel({ 'x-vercel-ip-city': '' }));
    assert.equal(place.label, 'WP, LK');
  });

  test('treats the "lookup failed" country markers as unknown', () => {
    for (const marker of ['XX', 'ZZ', 'T1']) {
      const place = placeFromHeaders(
        new Headers({ 'x-vercel-ip-country': marker, 'x-vercel-ip-city': 'Colombo' }),
      );
      assert.equal(place.label, 'Colombo', `${marker} must not reach the label`);
    }
  });
});

describe('sanitizePlace', () => {
  test('is unknown for a missing place', () => {
    assert.deepEqual(sanitizePlace(undefined), UNKNOWN_PLACE);
    assert.deepEqual(sanitizePlace(null), UNKNOWN_PLACE);
    assert.deepEqual(sanitizePlace({}), UNKNOWN_PLACE);
  });

  test('strips control characters, since a header is not validated input', () => {
    assert.equal(sanitizePlace({ label: 'Col\x00ombo' }).label, 'Col ombo');
  });

  test('caps the label, so an unbounded header cannot bloat a row', () => {
    const place = sanitizePlace({ label: 'x'.repeat(MAX_PLACE + 50) });
    assert.equal(place.label.length, MAX_PLACE);
  });

  test('drops a zone Intl does not know, rather than storing one that throws later', () => {
    assert.equal(sanitizePlace({ timeZone: 'Middle/Earth' }).timeZone, '');
  });

  test('keeps a real IANA zone', () => {
    assert.equal(sanitizePlace({ timeZone: 'Asia/Colombo' }).timeZone, 'Asia/Colombo');
  });
});

describe('placeDisplay', () => {
  test('reads back the label', () => {
    assert.equal(placeDisplay({ label: 'Colombo, WP, LK', timeZone: '' }), 'Colombo, WP, LK');
  });

  test('never prints as a blank', () => {
    assert.equal(placeDisplay(UNKNOWN_PLACE), 'an unknown place');
  });
});

describe('localTime', () => {
  // 08:30 UTC is 14:00 in Colombo — a half-hour offset, so a zone being
  // ignored would be obvious rather than plausible.
  const at = new Date('2026-08-07T08:30:00Z');

  test('reads an instant back in the local time of the place', () => {
    const shown = localTime(at, { label: '', timeZone: 'Asia/Colombo' });
    assert.match(shown, /14:00/);
    assert.match(shown, /Asia\/Colombo/);
  });

  test('falls back to UTC when the place has no zone', () => {
    const shown = localTime(at, UNKNOWN_PLACE);
    assert.match(shown, /08:30/);
    assert.match(shown, /UTC/);
  });

  test('falls back to UTC rather than throwing on a zone that is not real', () => {
    const shown = localTime(at, { label: '', timeZone: 'Middle/Earth' });
    assert.match(shown, /08:30 \(UTC\)/);
  });
});
