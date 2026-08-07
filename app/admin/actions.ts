'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { isConfigured, verifyCredentials } from '@/lib/adminAuth';
import { adminLoginLimiter, clientIp } from '@/lib/ratelimit';
import { getOrdersPage, type OrderPage } from '@/lib/stats';
import { currentAdmin, endSession, startSession } from './session';

export type LoginState = { error: string | null };

/**
 * Note what the failure messages do NOT say: which of the two fields was wrong.
 * "Devaka is a real user, keep going" is free information, and there are only
 * two usernames to try.
 */
export async function loginAction(_prev: LoginState, form: FormData): Promise<LoginState> {
  const username = String(form.get('username') ?? '');
  const password = String(form.get('password') ?? '');

  if (!isConfigured()) {
    return { error: 'Admin access is not configured on this deployment.' };
  }

  try {
    const { success } = await adminLoginLimiter().limit(clientIp(await headers()));
    if (!success) return { error: 'Too many attempts. Try again in a few minutes.' };
  } catch (err) {
    // Consistent with the rest of the app: a limiter outage must not lock the
    // owners out of their own dashboard. The password is still the real gate.
    console.error('[kade-air] admin login limiter unavailable, allowing attempt', err);
  }

  const user = verifyCredentials(username, password);
  if (!user) return { error: "That's not it. Try again." };

  if (!(await startSession(user.username))) {
    return { error: 'Admin access is not configured on this deployment.' };
  }

  // Throws, by design — control never returns to the form.
  redirect('/admin');
}

export async function logoutAction(): Promise<void> {
  await endSession();
  redirect('/admin');
}

/**
 * Page 2 and beyond of the orders table.
 *
 * Re-authorises on every call. This is a public POST endpoint that hands back
 * names and messages: the session check here is the only thing standing between
 * it and anyone who knows the action exists.
 */
export async function fetchOrdersPage(page: number): Promise<OrderPage | null> {
  if (!(await currentAdmin())) return null;
  return getOrdersPage(page);
}
