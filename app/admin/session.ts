import { cookies } from 'next/headers';
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  createSession,
  readSession,
  type AdminUser,
} from '@/lib/adminAuth';

// The cookie half of admin auth: lib/adminAuth.ts decides *what* a valid
// session is, this decides *where* it is kept. Split so the rules can be tested
// without a request.

/**
 * The signed-in admin for this request, or null.
 *
 * This is the only gate on the dashboard. Every server action that reads order
 * data calls it too — a Server Action is a public POST endpoint, so a check
 * that only runs while rendering the page protects nothing.
 */
export async function currentAdmin(): Promise<AdminUser | null> {
  const jar = await cookies();
  return readSession(jar.get(SESSION_COOKIE)?.value);
}

export async function startSession(username: string): Promise<void> {
  const token = createSession(username);
  // Only ever null for a username off the roster, which cannot reach here — the
  // caller has already checked the password against a real user.
  if (!token) return;

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    // Plain HTTP is localhost only; anywhere real this cookie must not travel
    // in the clear.
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
