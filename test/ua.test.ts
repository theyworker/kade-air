import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { isDesktopUA } from '../lib/ua';

describe('isDesktopUA', () => {
  test('returns false for null', () => {
    assert.equal(isDesktopUA(null), false);
  });

  test('returns false for the empty string', () => {
    assert.equal(isDesktopUA(''), false);
  });

  describe('real desktop UA strings', () => {
    test('classifies macOS Safari as desktop', () => {
      const ua =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';
      assert.equal(isDesktopUA(ua), true);
    });

    test('classifies Windows Chrome as desktop', () => {
      const ua =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
      assert.equal(isDesktopUA(ua), true);
    });
  });

  describe('real mobile UA strings', () => {
    test('classifies iPhone Safari as mobile', () => {
      const ua =
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
      assert.equal(isDesktopUA(ua), false);
    });

    test('classifies Android Chrome as mobile', () => {
      const ua =
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';
      assert.equal(isDesktopUA(ua), false);
    });

    test('iPad (older iPadOS, pre-13, genuinely reports "iPad" in its UA)', () => {
      // iOS/iPadOS 12 and earlier used a UA that names the device directly.
      // Starting with iPadOS 13, Safari on iPad reports a desktop macOS UA
      // instead (see the documented quirk below) — this case covers the
      // older, honestly-labelled string that still contains "iPad".
      const ua =
        'Mozilla/5.0 (iPad; CPU OS 12_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.1 Mobile/15E148 Safari/604.1';
      assert.equal(isDesktopUA(ua), false);
    });
  });

  test(
    'documented quirk: a modern iPad (iPadOS 13+) reports a desktop macOS UA string ' +
      'and is therefore classified desktop by this function — not fixed here per constraint 4',
    () => {
      // iPadOS 13+ Safari sends the exact same UA as macOS Safari (this is an
      // intentional Apple decision, "desktop-class Safari", not spoofing) so
      // isDesktopUA has no way to distinguish this iPad from a real Mac.
      const modernIPadUA =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';
      assert.equal(isDesktopUA(modernIPadUA), true);
    }
  );
});
