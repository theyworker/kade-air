'use server';

import { headers } from 'next/headers';
import { createOrder, markOpened } from '@/lib/orders';
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
 * Records that the recipient opened a delivery.
 *
 * Called from the client rather than from the page that renders the delivery,
 * and that is the point: a share link is pasted into chat, and every preview
 * crawler behind it fetches the page. Those fetches would stamp an open the
 * recipient never made. Running this from an effect in the browser means the
 * stamp needs a real client that actually loaded the delivery.
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
    await markOpened(code, placeFromHeaders(h));
  } catch (err) {
    console.error(
      '[kade-air] recording the open failed',
      code,
      err instanceof Error ? err.message : err,
    );
  }
}
