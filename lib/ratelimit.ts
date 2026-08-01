import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { env } from './env';

// Getters, not constants: importing this module must not demand Redis
// credentials. Everything below is built on first use and memoized, the same
// lazy pattern lib/db.ts and lib/cache.ts use.
let client: Redis | null = null;
const redis = () => (client ??= new Redis({ url: env.REDIS_URL, token: env.REDIS_TOKEN }));

// Optional tuning knobs, not required configuration — lib/env.ts's requireEnv
// throws on absence, which is wrong here. A plain process.env read with a
// numeric fallback lets these be tuned without a deploy.
const num = (name: string, fallback: number) => {
  const raw = process.env[name];
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

// Sri Lanka's mobile traffic is dominated by carrier-grade NAT, where an
// entire carrier pool shares one egress IP — a low per-IP ceiling here reads
// as "kade uncle needs a break" to a lot of innocent people at once.
const CREATE_PER_HOUR = num('RATE_LIMIT_CREATE_PER_HOUR', 40);
const READ_PER_MINUTE = num('RATE_LIMIT_READ_PER_MINUTE', 120);

// Creation writes a permanent row, so it is the expensive one to leave open.
let creationLimiter: Ratelimit | null = null;
export const createLimiter = () =>
  (creationLimiter ??= new Ratelimit({
    redis: redis(),
    limiter: Ratelimit.slidingWindow(CREATE_PER_HOUR, '1 h'),
    prefix: 'rl:create',
    analytics: false,
  }));

// Reads are cheap individually, but an open read path is what makes an
// 8-character code enumerable. This ceiling is well above any real reader.
let readingLimiter: Ratelimit | null = null;
export const readLimiter = () =>
  (readingLimiter ??= new Ratelimit({
    redis: redis(),
    limiter: Ratelimit.slidingWindow(READ_PER_MINUTE, '1 m'),
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
