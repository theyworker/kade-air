import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createOrder, getOrder, revokeOrder } from '../lib/orders';
import { DuplicateCodeError, type OrderStore, type StoredOrder } from '../lib/db';
import type { OrderCache } from '../lib/cache';
import type { Order } from '../lib/order';

const anOrder: Order = {
  dishId: 'kottu',
  sender: 'Devaka',
  recipient: 'Amma',
  message: 'Enjoy!',
  chain: 1,
};

const stored = (code: string, over: Partial<StoredOrder> = {}): StoredOrder => ({
  code,
  ...anOrder,
  revokedAt: null,
  ...over,
});

function fakeStore(over: Partial<OrderStore> = {}) {
  const rows = new Map<string, StoredOrder>();
  const calls = { insert: 0, find: 0, revoke: 0 };
  const store: OrderStore = {
    async insert(row) {
      calls.insert++;
      if (rows.has(row.code)) throw new DuplicateCodeError(row.code);
      rows.set(row.code, { ...row, revokedAt: null });
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
    ...over,
  };
  return { store, rows, calls };
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
