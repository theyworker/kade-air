import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createOrder, getOrder, openingsOf, recordOpen, revokeOrder } from '../lib/orders';
import { DuplicateCodeError, type OrderOpen, type OrderStore, type StoredOrder } from '../lib/db';
import type { OrderCache } from '../lib/cache';
import type { Order } from '../lib/order';
import { UNKNOWN_PLACE, type Place } from '../lib/place';

const anOrder: Order = {
  dishId: 'kottu',
  sender: 'Devaka',
  recipient: 'Amma',
  message: 'Enjoy!',
  chain: 1,
};

const colombo: Place = { label: 'Colombo, WP, LK', timeZone: 'Asia/Colombo' };

const stored = (code: string, over: Partial<StoredOrder> = {}): StoredOrder => ({
  code,
  ...anOrder,
  revokedAt: null,
  createdAt: new Date('2026-08-07T08:30:00Z'),
  senderPlace: UNKNOWN_PLACE,
  ...over,
});

function fakeStore(over: Partial<OrderStore> = {}) {
  const rows = new Map<string, StoredOrder>();
  const opens = new Map<string, OrderOpen[]>();
  const calls = { insert: 0, find: 0, revoke: 0, recordOpen: 0, opensOf: 0 };
  const store: OrderStore = {
    async insert(row) {
      calls.insert++;
      if (rows.has(row.code)) throw new DuplicateCodeError(row.code);
      rows.set(row.code, { ...stored(row.code), ...row });
    },
    async findByCode(code) {
      calls.find++;
      return rows.get(code) ?? null;
    },
    async revoke(code) {
      calls.revoke++;
      const row = rows.get(code);
      if (row) rows.set(code, { ...row, revokedAt: new Date() });
    },
    // Mirrors the real insert-select: a row per opening, none for an order
    // that does not exist or has been revoked.
    async recordOpen(code, place) {
      calls.recordOpen++;
      const row = rows.get(code);
      if (!row || row.revokedAt) return false;
      opens.set(code, [...(opens.get(code) ?? []), { at: new Date(), place }]);
      return true;
    },
    async opensOf(code) {
      calls.opensOf++;
      return opens.get(code) ?? [];
    },
    ...over,
  };
  return { store, rows, opens, calls };
}

function fakeCache(over: Partial<OrderCache> = {}) {
  const entries = new Map<string, Order>();
  const calls = { get: 0, set: 0, del: 0 };
  const cache: OrderCache = {
    async get(code) {
      calls.get++;
      return entries.get(code) ?? null;
    },
    async set(code, order) {
      calls.set++;
      entries.set(code, order);
    },
    async del(code) {
      calls.del++;
      entries.delete(code);
    },
    ...over,
  };
  return { cache, entries, calls };
}

describe('createOrder', () => {
  test('writes the order to the store and returns its code', async () => {
    const { store, rows } = fakeStore();
    const { cache } = fakeCache();
    const code = await createOrder(anOrder, { store, cache, newCode: () => 'AAAAAAAA' });
    assert.equal(code, 'AAAAAAAA');
    assert.equal(rows.get('AAAAAAAA')?.sender, 'Devaka');
  });

  test('warms the cache so the preview that follows is a hit', async () => {
    const { store } = fakeStore();
    const { cache, entries } = fakeCache();
    await createOrder(anOrder, { store, cache, newCode: () => 'BBBBBBBB' });
    assert.deepEqual(entries.get('BBBBBBBB'), anOrder);
  });

  test('sanitizes input before storing it', async () => {
    const { store, rows } = fakeStore();
    const { cache } = fakeCache();
    const dirty = { ...anOrder, sender: '  Dev\x00aka  ', chain: 99999 };
    await createOrder(dirty, { store, cache, newCode: () => 'CCCCCCCC' });
    assert.equal(rows.get('CCCCCCCC')?.sender, 'Dev aka');
    assert.equal(rows.get('CCCCCCCC')?.chain, 9999);
  });

  test('caches the sanitized value, not the raw input, since a warm cache is what recipients see', async () => {
    const { store } = fakeStore();
    const { cache, entries } = fakeCache();
    const dirty = { ...anOrder, sender: '  Dev\x00aka  ', chain: 99999 };
    await createOrder(dirty, { store, cache, newCode: () => 'EEEEEEEE' });
    assert.equal(entries.get('EEEEEEEE')?.sender, 'Dev aka');
  });

  test('retries with a fresh code when the first one collides', async () => {
    const { store, rows } = fakeStore();
    const { cache } = fakeCache();
    rows.set('TAKEN123', stored('TAKEN123'));
    const codes = ['TAKEN123', 'FREE9999'];
    let i = 0;
    const code = await createOrder(anOrder, { store, cache, newCode: () => codes[i++] });
    assert.equal(code, 'FREE9999');
  });

  test('gives up after repeated collisions rather than looping forever', async () => {
    const { store, rows } = fakeStore();
    const { cache } = fakeCache();
    rows.set('SAMECODE', stored('SAMECODE'));
    await assert.rejects(
      () => createOrder(anOrder, { store, cache, newCode: () => 'SAMECODE' }),
      /could not generate/i,
    );
  });

  test('still returns the code when warming the cache fails', async () => {
    const { store } = fakeStore();
    const { cache } = fakeCache({
      async set() {
        throw new Error('redis down');
      },
    });
    const code = await createOrder(anOrder, { store, cache, newCode: () => 'DDDDDDDD' });
    assert.equal(code, 'DDDDDDDD');
  });

  test('stores where the sender appeared to be', async () => {
    const { store, rows } = fakeStore();
    const { cache } = fakeCache();
    await createOrder(
      { ...anOrder, senderPlace: colombo },
      { store, cache, newCode: () => 'FFFFFFFF' },
    );
    assert.deepEqual(rows.get('FFFFFFFF')?.senderPlace, colombo);
  });

  test('stores an unknown place when there was no estimate, as in local development', async () => {
    const { store, rows } = fakeStore();
    const { cache } = fakeCache();
    await createOrder(anOrder, { store, cache, newCode: () => 'GGGGGGGG' });
    assert.deepEqual(rows.get('GGGGGGGG')?.senderPlace, UNKNOWN_PLACE);
  });

  test('sanitizes the place, since it comes from headers nobody validated', async () => {
    const { store, rows } = fakeStore();
    const { cache } = fakeCache();
    await createOrder(
      { ...anOrder, senderPlace: { label: '  Col\x00ombo  ', timeZone: 'Middle/Earth' } },
      { store, cache, newCode: () => 'HHHHHHHH' },
    );
    assert.deepEqual(rows.get('HHHHHHHH')?.senderPlace, { label: 'Col ombo', timeZone: '' });
  });

  test('keeps the sender place out of the cache, which only holds what a recipient sees', async () => {
    const { store } = fakeStore();
    const { cache, entries } = fakeCache();
    await createOrder(
      { ...anOrder, senderPlace: colombo },
      { store, cache, newCode: () => 'IIIIIIII' },
    );
    assert.deepEqual(entries.get('IIIIIIII'), anOrder);
  });

  test('propagates a store failure, because the order was not saved', async () => {
    const { cache } = fakeCache();
    const store: OrderStore = {
      async insert() {
        throw new Error('neon down');
      },
      async findByCode() {
        return null;
      },
      async revoke() {},
      async recordOpen() {
        return false;
      },
      async opensOf() {
        return [];
      },
    };
    await assert.rejects(() => createOrder(anOrder, { store, cache }), /neon down/);
  });
});

describe('getOrder', () => {
  test('returns the cached order without touching the store', async () => {
    const { store, calls } = fakeStore();
    const { cache, entries } = fakeCache();
    entries.set('HIT00000', anOrder);
    const found = await getOrder('HIT00000', { store, cache });
    assert.deepEqual(found, anOrder);
    assert.equal(calls.find, 0);
  });

  test('falls back to the store on a cache miss', async () => {
    const { store, rows } = fakeStore();
    const { cache } = fakeCache();
    rows.set('MISS0000', stored('MISS0000'));
    const found = await getOrder('MISS0000', { store, cache });
    assert.equal(found?.sender, 'Devaka');
  });

  test('warms the cache after a miss so the next read is a hit', async () => {
    const { store, rows } = fakeStore();
    const { cache, entries } = fakeCache();
    rows.set('WARM0000', stored('WARM0000'));
    await getOrder('WARM0000', { store, cache });
    assert.deepEqual(entries.get('WARM0000'), anOrder);
  });

  test('serves from the store when the cache read throws', async () => {
    const { store, rows } = fakeStore();
    rows.set('CACHEBAD', stored('CACHEBAD'));
    const { cache } = fakeCache({
      async get() {
        throw new Error('redis down');
      },
    });
    const found = await getOrder('CACHEBAD', { store, cache });
    assert.equal(found?.sender, 'Devaka');
  });

  test('serves the order when warming the cache after a miss throws', async () => {
    const { store, rows } = fakeStore();
    rows.set('WARMFAIL', stored('WARMFAIL'));
    const { cache } = fakeCache({
      async set() {
        throw new Error('redis down');
      },
    });
    const found = await getOrder('WARMFAIL', { store, cache });
    assert.equal(found?.sender, 'Devaka');
  });

  test('returns null for a code that does not exist', async () => {
    const { store } = fakeStore();
    const { cache } = fakeCache();
    assert.equal(await getOrder('NOSUCH00', { store, cache }), null);
  });

  test('returns null for a revoked order', async () => {
    const { store, rows } = fakeStore();
    const { cache } = fakeCache();
    rows.set('REVOKED0', stored('REVOKED0', { revokedAt: new Date() }));
    assert.equal(await getOrder('REVOKED0', { store, cache }), null);
  });

  test('does not cache a revoked order', async () => {
    const { store, rows } = fakeStore();
    const { cache, entries } = fakeCache();
    rows.set('REVOKED1', stored('REVOKED1', { revokedAt: new Date() }));
    await getOrder('REVOKED1', { store, cache });
    assert.equal(entries.has('REVOKED1'), false);
  });

  test('throws when the store fails, so a real outage is not reported as a dead link', async () => {
    const { cache } = fakeCache();
    const store: OrderStore = {
      async insert() {},
      async findByCode() {
        throw new Error('neon down');
      },
      async revoke() {},
      async recordOpen() {
        return false;
      },
      async opensOf() {
        return [];
      },
    };
    await assert.rejects(() => getOrder('ANYCODE0', { store, cache }), /neon down/);
  });

  test('sanitizes rows on the way out, since stored data is still untrusted input', async () => {
    const { store, rows } = fakeStore();
    const { cache } = fakeCache();
    rows.set('DIRTY000', stored('DIRTY000', { sender: '  Dev\x00aka  ' }));
    const found = await getOrder('DIRTY000', { store, cache });
    assert.equal(found?.sender, 'Dev aka');
  });

  test('caches the sanitized value after warming from a dirty row', async () => {
    const { store, rows } = fakeStore();
    const { cache, entries } = fakeCache();
    rows.set('DIRTY001', stored('DIRTY001', { sender: '  Dev\x00aka  ' }));
    await getOrder('DIRTY001', { store, cache });
    assert.equal(entries.get('DIRTY001')?.sender, 'Dev aka');
  });
});

describe('recordOpen', () => {
  test('logs when the message reached someone, and where', async () => {
    const { store, rows, opens } = fakeStore();
    const { cache } = fakeCache();
    rows.set('OPEN0000', stored('OPEN0000'));

    assert.equal(await recordOpen('OPEN0000', colombo, { store, cache }), true);

    const logged = opens.get('OPEN0000') ?? [];
    assert.equal(logged.length, 1);
    assert.ok(logged[0].at, 'an opening needs a moment');
    assert.deepEqual(logged[0].place, colombo);
  });

  test('records every opening, because watching it again is opening it again', async () => {
    const { store, rows, opens } = fakeStore();
    const { cache } = fakeCache();
    const kandy: Place = { label: 'Kandy, CP, LK', timeZone: 'Asia/Colombo' };
    rows.set('OPEN0001', stored('OPEN0001'));

    await recordOpen('OPEN0001', colombo, { store, cache });
    await recordOpen('OPEN0001', kandy, { store, cache });
    await recordOpen('OPEN0001', colombo, { store, cache });

    assert.equal(opens.get('OPEN0001')?.length, 3);
    assert.deepEqual(
      opens.get('OPEN0001')?.map((o) => o.place.label),
      ['Colombo, WP, LK', 'Kandy, CP, LK', 'Colombo, WP, LK'],
    );
  });

  test('leaves the first opening where it was, since a replay is a new one', async () => {
    const { store, rows, opens } = fakeStore();
    const { cache } = fakeCache();
    rows.set('OPEN0002', stored('OPEN0002'));

    await recordOpen('OPEN0002', colombo, { store, cache });
    const first = opens.get('OPEN0002')?.[0];

    await recordOpen('OPEN0002', { label: 'Kandy, CP, LK', timeZone: '' }, { store, cache });

    assert.deepEqual(opens.get('OPEN0002')?.[0], first);
  });

  test('sanitizes the place on the way in', async () => {
    const { store, rows, opens } = fakeStore();
    const { cache } = fakeCache();
    rows.set('OPEN0003', stored('OPEN0003'));
    await recordOpen(
      'OPEN0003',
      { label: 'Col\x00ombo', timeZone: 'Middle/Earth' },
      { store, cache },
    );
    assert.deepEqual(opens.get('OPEN0003')?.[0].place, { label: 'Col ombo', timeZone: '' });
  });

  test('records nothing for a code that does not exist', async () => {
    const { store, opens } = fakeStore();
    const { cache } = fakeCache();
    assert.equal(await recordOpen('NOSUCH00', colombo, { store, cache }), false);
    assert.equal(opens.has('NOSUCH00'), false);
  });

  test('records nothing for a revoked order, which was never delivered', async () => {
    const { store, rows, opens } = fakeStore();
    const { cache } = fakeCache();
    rows.set('OPEN0004', stored('OPEN0004', { revokedAt: new Date() }));
    assert.equal(await recordOpen('OPEN0004', colombo, { store, cache }), false);
    assert.equal(opens.has('OPEN0004'), false);
  });

  test('leaves the cache alone — an opening changes nothing a recipient sees', async () => {
    const { store, rows } = fakeStore();
    const { cache, calls, entries } = fakeCache();
    rows.set('OPEN0005', stored('OPEN0005'));
    entries.set('OPEN0005', anOrder);

    await recordOpen('OPEN0005', colombo, { store, cache });

    assert.equal(calls.del, 0);
    assert.equal(calls.set, 0);
    assert.deepEqual(await getOrder('OPEN0005', { store, cache }), anOrder);
  });
});

describe('openingsOf', () => {
  test('reads back every opening, oldest first', async () => {
    const { store, rows } = fakeStore();
    const { cache } = fakeCache();
    rows.set('OPEN0006', stored('OPEN0006'));
    await recordOpen('OPEN0006', colombo, { store, cache });
    await recordOpen('OPEN0006', UNKNOWN_PLACE, { store, cache });

    const found = await openingsOf('OPEN0006', { store, cache });
    assert.equal(found.length, 2);
    assert.deepEqual(found[0].place, colombo);
    assert.ok(found[0].at <= found[1].at);
  });

  test('is empty for an order nobody opened', async () => {
    const { store, rows } = fakeStore();
    const { cache } = fakeCache();
    rows.set('OPEN0007', stored('OPEN0007'));
    assert.deepEqual(await openingsOf('OPEN0007', { store, cache }), []);
  });

  test('reads the store directly, since the cache holds none of this', async () => {
    const { store, calls } = fakeStore();
    const { cache, calls: cacheCalls } = fakeCache();
    await openingsOf('OPEN0008', { store, cache });
    assert.equal(calls.opensOf, 1);
    assert.equal(cacheCalls.get, 0);
  });
});

describe('revokeOrder', () => {
  test('marks the row revoked in the store', async () => {
    const { store, rows } = fakeStore();
    const { cache } = fakeCache();
    rows.set('REVME000', stored('REVME000'));
    await revokeOrder('REVME000', { store, cache });
    assert.ok(rows.get('REVME000')?.revokedAt);
  });

  test('removes the cache entry', async () => {
    const { store, rows } = fakeStore();
    const { cache, entries } = fakeCache();
    rows.set('REVME001', stored('REVME001'));
    entries.set('REVME001', anOrder);
    await revokeOrder('REVME001', { store, cache });
    assert.equal(entries.has('REVME001'), false);
  });

  test('an order with a warm cache entry returns null from getOrder after revokeOrder', async () => {
    const { store, rows } = fakeStore();
    const { cache, entries } = fakeCache();
    rows.set('REVME002', stored('REVME002'));
    // Warm the cache exactly as createOrder would.
    entries.set('REVME002', anOrder);

    await revokeOrder('REVME002', { store, cache });

    const found = await getOrder('REVME002', { store, cache });
    assert.equal(found, null);
  });

  test('propagates a failing cache delete, because the link is still live', async () => {
    const { store, rows } = fakeStore();
    rows.set('REVME003', stored('REVME003'));
    const { cache } = fakeCache({
      async del() {
        throw new Error('redis down');
      },
    });
    await assert.rejects(() => revokeOrder('REVME003', { store, cache }), /redis down/);
  });
});
