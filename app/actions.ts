'use server';

import { headers } from 'next/headers';
import { createOrder } from '@/lib/orders';
import { clientIp, createLimiter } from '@/lib/ratelimit';
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
    const code = await createOrder(input);
    return { ok: true, code };
  } catch (err) {
    console.error('[kade-air] order creation failed', err);
    return { ok: false, reason: 'failed' };
  }
}
