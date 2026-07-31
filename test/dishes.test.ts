import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { DISHES, findDish, floatArt, MENU_ART } from '../lib/dishes';

// Repo root derived from this test file's own location (test/dishes.test.ts is
// one directory below the repo root) so the path resolves correctly no matter
// what directory `npm test` is invoked from.
const REPO_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PUBLIC_DIR = path.join(REPO_ROOT, 'public');

// Dish.low/high are absolute-from-web-root paths (they start with '/'), so a
// naive path.join would resolve them as absolute filesystem paths and discard
// PUBLIC_DIR entirely. Strip the leading slash before joining.
function resolvePublicPath(webPath: string): string {
  return path.join(PUBLIC_DIR, webPath.replace(/^\//, ''));
}

describe('DISHES uniqueness', () => {
  test('every id is unique', () => {
    const ids = DISHES.map((d) => d.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  test('every low path is unique', () => {
    const lows = DISHES.map((d) => d.low);
    assert.equal(new Set(lows).size, lows.length);
  });

  test('every high path is unique', () => {
    const highs = DISHES.map((d) => d.high);
    assert.equal(new Set(highs).size, highs.length);
  });
});

describe('art files referenced by DISHES exist on disk', () => {
  // The highest-value test in this file: it catches art being renamed or
  // deleted without lib/dishes.ts being updated to match.
  for (const d of DISHES) {
    test(`${d.id}: low-res art file exists (${d.low})`, () => {
      const resolved = resolvePublicPath(d.low);
      const stat = statSync(resolved);
      assert.equal(stat.isFile(), true);
    });

    test(`${d.id}: high-res art file exists (${d.high})`, () => {
      const resolved = resolvePublicPath(d.high);
      const stat = statSync(resolved);
      assert.equal(stat.isFile(), true);
    });
  }
});

describe('findDish', () => {
  test('returns the matching dish for a known id', () => {
    const dish = findDish('biryani');
    assert.equal(dish.id, 'biryani');
    assert.equal(dish.name, 'Chicken Biryani');
  });

  test('falls back to DISHES[0] (Kottu) for an unknown id', () => {
    const dish = findDish('not-a-real-dish');
    assert.equal(dish.id, 'kottu');
  });

  test('falls back to DISHES[0] (Kottu) for the empty string', () => {
    const dish = findDish('');
    assert.equal(dish.id, 'kottu');
  });

  test('falls back to DISHES[0] (Kottu) for a __proto__-style key, not the prototype chain', () => {
    // Confirms the lookup is Array#find over the DISHES array (which has no
    // 'kottu' collision with Object.prototype) rather than something that
    // would walk the prototype chain and return an unexpected value.
    const dish = findDish('__proto__');
    assert.equal(dish.id, 'kottu');
  });
});

describe('floatArt', () => {
  test('has exactly 5 entries', () => {
    assert.equal(floatArt.length, 5);
  });

  test('every entry resolves to the real dish that was asked for, in order, not a typo silently falling back to Kottu', () => {
    const expectedIds = ['kottu', 'hoppers', 'watalappan', 'pizza', 'boba'];
    assert.deepEqual(
      floatArt.map((d) => d.id),
      expectedIds
    );
  });
});

describe('MENU_ART', () => {
  test('has exactly one entry per dish', () => {
    assert.equal(MENU_ART.length, DISHES.length);
  });

  test('every entry is that dish\'s low path, in DISHES order', () => {
    assert.deepEqual(
      MENU_ART,
      DISHES.map((d) => d.low)
    );
  });
});

describe('dish field integrity', () => {
  for (const d of DISHES) {
    test(`${d.id} has a non-empty name, emoji, and blurb`, () => {
      assert.equal(d.name.length > 0, true);
      assert.equal(d.emoji.length > 0, true);
      assert.equal(d.blurb.length > 0, true);
    });

    test(`${d.id}'s c is a valid #rrggbb hex colour`, () => {
      // All current values are exactly '#' followed by 6 hex digits; assert
      // against that actual format rather than a looser pattern (e.g. one
      // that would also accept '#fff' or 'red').
      assert.match(d.c, /^#[0-9a-f]{6}$/);
    });
  }
});
