import { generateCode } from './code';
import { DuplicateCodeError, neonStore, type OrderStore } from './db';
import { redisCache, type OrderCache } from './cache';
import { sanitizeOrder, type Order } from './order';
import { sanitizePlace, type Place } from './place';

/**
 * An order as it arrives to be created: the shareable content, plus where the
 * sender appeared to be when they sent it.
 *
 * senderPlace is kept out of Order itself on purpose. Order is what a
 * recipient sees; this is a note about the sender, and it never travels to a
 * screen or into the cache.
 */
export type NewOrder = Order & { senderPlace?: Place };

export type Deps = {
  store: OrderStore;
  cache: OrderCache;
  newCode?: () => string;
};

// Defaults are the real clients; tests pass fakes. This is what keeps the
// cache logic below testable without a live Neon or Redis.
const defaults = (): Deps => ({ store: neonStore, cache: redisCache, newCode: generateCode });

const MAX_CODE_ATTEMPTS = 5;

export async function createOrder(input: NewOrder, deps: Deps = defaults()): Promise<string> {
  const newCode = deps.newCode ?? generateCode;
  const order = sanitizeOrder(input);
  const senderPlace = sanitizePlace(input.senderPlace);

  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const code = newCode();
    try {
      await deps.store.insert({ code, ...order, senderPlace });
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

/**
 * Records that the recipient opened the delivery: when, and where they
 * appeared to be.
 *
 * Only the first open is kept — the store's update is written so later opens
 * match nothing — because the question this answers is when the delivery
 * landed, not how many times it has been replayed since.
 *
 * The cache is deliberately left alone. A cached entry holds only what the
 * delivery renders, and none of that changes when an order is opened, so
 * there is nothing here to invalidate.
 *
 * Resolves true when this call was the open that got recorded.
 */
export async function markOpened(
  code: string,
  place: Place,
  deps: Deps = defaults(),
): Promise<boolean> {
  return deps.store.markOpened(code, sanitizePlace(place));
}

/**
 * Kills a share link.
 *
 * The cache delete is not optional cleanup — a warm entry has no revocation
 * flag on it, so leaving it would keep serving the order in full until the TTL
 * expired. Store first, then cache: if the delete fails the row is still
 * revoked and the entry expires on its own, which is recoverable. The reverse
 * order is not.
 */
export async function revokeOrder(code: string, deps: Deps = defaults()): Promise<void> {
  await deps.store.revoke(code);
  await deps.cache.del(code);
}
