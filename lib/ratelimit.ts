import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { env } from './env';

// Getters, not constants: importing this module must not demand Redis
// credentials. Everything below is built on first use and memoized, the same
// lazy pattern lib/db.ts and lib/cache.ts use.
let client: Redis | null = null;
const redis = () => (client ??= new Redis({ url: env.REDIS_URL, token: env.REDIS_TOKEN }));

// Creation writes a permanent row, so it is the expensive one to leave open.
let creationLimiter: Ratelimit | null = null;
export const createLimiter = () =>
  (creationLimiter ??= new Ratelimit({
    redis: redis(),
    limiter: Ratelimit.slidingWindow(10, '1 h'),
    prefix: 'rl:create',
    analytics: false,
  }));

// Reads are cheap individually, but an open read path is what makes an
// 8-character code enumerable. This ceiling is well above any real reader.
let readingLimiter: Ratelimit | null = null;
export const readLimiter = () =>
  (readingLimiter ??= new Ratelimit({
    redis: redis(),
    limiter: Ratelimit.slidingWindow(120, '1 m'),
    prefix: 'rl:read',
    analytics: false,
  }));

// Vercel populates x-forwarded-for. The first entry is the client; the rest are
// proxies. Falls back to a constant so a missing header degrades to one shared
// bucket rather than silently disabling the limiter.
export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || 'unknown';
}
