'use server';

import { headers } from 'next/headers';
import { createOrder, recordOpen } from '@/lib/orders';
import { isCode } from '@/lib/code';
import { placeFromHeaders } from '@/lib/place';
import { clientIp, createLimiter, readLimiter } from '@/lib/ratelimit';
import type { Order } from '@/lib/order';

export type CreateOrderResult =
  | { ok: true; code: string }
  | { ok: false; reason: 'rate_limited' | 'failed' };

export async function createOrderAction(input: Order): Promise<CreateOrderResult> {
  const h = await headers();

  try {
    const { success } = await createLimiter().limit(clientIp(h));
    if (!success) return { ok: false, reason: 'rate_limited' };
  } catch (err) {
    // A limiter outage must not take ordering down with it.
    console.error('[kade-air] rate limiter unavailable, allowing request', err);
  }

  try {
    // senderPlace is spread last, after the client's input. A Server Action's
    // argument is attacker-controlled, and this is the one field on the row
    // the client must not be able to write — the edge decides where a request
    // came from, not the request.
    const code = await createOrder({ ...input, senderPlace: placeFromHeaders(h) });
    return { ok: true, code };
  } catch (err) {
    // Not the raw driver error — its `detail` field can echo offending column
    // values, and getting PII out of logs was this change's whole point.
    console.error(
      '[kade-air] order creation failed',
      err instanceof Error ? err.message : err,
      (err as { code?: string })?.code,
    );
    return { ok: false, reason: 'failed' };
  }
}

/**
 * Records one opening of a delivery.
 *
 * Called at the moment the message actually reaches the recipient — the end of
 * the flight, when the note is on screen — and not when the page loads. Those
 * are different events, and only the second one is the delivery landing: a
 * share link gets pasted into chat, and the preview crawlers behind it fetch
 * the page without a person ever seeing it. Waiting for the note to appear
 * means an open needs a real browser that watched the drone come down.
 *
 * The cost of that choice: someone who opens the link and leaves before the
 * delivery finishes is not recorded. They did not get the message either.
 *
 * Called again each time the delivery plays through, because watching it again
 * is opening it again. See lib/orders.ts.
 *
 * Never throws and never reports failure. Nothing on screen depends on the
 * result, and a recipient must not lose their delivery because a write we
 * keep for ourselves did not land.
 */
export async function recordOpenAction(code: string): Promise<void> {
  // Not a code this app could have minted — no reason to spend anything on it.
  if (!isCode(code)) return;

  const h = await headers();

  try {
    // The read ceiling, since this rides along with reading a delivery. Fails
    // open like the rest: an unreachable limiter is our problem, not a reason
    // to lose the record.
    const { success } = await readLimiter().limit(clientIp(h));
    if (!success) return;
  } catch (err) {
    console.error('[kade-air] read limiter unavailable, recording the open anyway', err);
  }

  try {
    await recordOpen(code, placeFromHeaders(h));
  } catch (err) {
    console.error(
      '[kade-air] recording the open failed',
      code,
      err instanceof Error ? err.message : err,
    );
  }
}
