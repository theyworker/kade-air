import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createOrder, getOrder } from '../lib/orders';
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
  const calls = { insert: 0, find: 0 };
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
    ...over,
  };
  return { store, rows, calls };
}

function fakeCache(over: Partial<OrderCache> = {}) {
  const entries = new Map<string, Order>();
  const calls = { get: 0, set: 0 };
  const cache: OrderCache = {
    async get(code) {
      calls.get++;
      return entries.get(code) ?? null;
    },
    async set(code, order) {
      calls.set++;
      entries.set(code, order);
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
});
