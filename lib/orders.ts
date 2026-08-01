import { generateCode } from './code';
import { DuplicateCodeError, neonStore, type OrderStore } from './db';
import { redisCache, type OrderCache } from './cache';
import { sanitizeOrder, type Order } from './order';

export type Deps = {
  store: OrderStore;
  cache: OrderCache;
  newCode?: () => string;
};

// Defaults are the real clients; tests pass fakes. This is what keeps the
// cache logic below testable without a live Neon or Redis.
const defaults = (): Deps => ({ store: neonStore, cache: redisCache, newCode: generateCode });

const MAX_CODE_ATTEMPTS = 5;

export async function createOrder(input: Order, deps: Deps = defaults()): Promise<string> {
  const newCode = deps.newCode ?? generateCode;
  const order = sanitizeOrder(input);

  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const code = newCode();
    try {
      await deps.store.insert({ code, ...order });
    } catch (err) {
      if (err instanceof DuplicateCodeError) continue;
      throw err;
    }

    // The row is committed, so the order exists no matter what happens next.
    // A cold cache costs one slower read; failing here would cost the user
    // their link.
    try {
      await deps.cache.set(code, order);
    } catch (err) {
      console.error('[kade-air] cache warm failed', code, err);
    }

    return code;
  }

  throw new Error(`could not generate an unused share code in ${MAX_CODE_ATTEMPTS} attempts`);
}

/**
 * Resolves a share code to an order.
 *
 * Returns `null` when there is no such order — unknown code, or revoked.
 * Throws when the store itself is unreachable. Callers must keep these apart:
 * the first is a dead link, the second is an outage, and they show different
 * screens.
 */
export async function getOrder(code: string, deps: Deps = defaults()): Promise<Order | null> {
  try {
    const cached = await deps.cache.get(code);
    if (cached) return cached;
  } catch (err) {
    console.error('[kade-air] cache read failed', code, err);
  }

  const row = await deps.store.findByCode(code);
  if (!row || row.revokedAt) return null;

  const order = sanitizeOrder(row);

  try {
    await deps.cache.set(code, order);
  } catch (err) {
    console.error('[kade-air] cache warm failed', code, err);
  }

  return order;
}
