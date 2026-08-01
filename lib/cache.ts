import { Redis } from '@upstash/redis';
import { env } from './env';
import type { Order } from './order';

export type OrderCache = {
  get(code: string): Promise<Order | null>;
  set(code: string, order: Order): Promise<void>;
  del(code: string): Promise<void>;
};

// Two days. Neon is the source of truth, so this only decides how long a hot
// link stays hot — an expired entry costs one slower request, never a failure.
export const CACHE_TTL_SECONDS = 60 * 60 * 24 * 2;

let client: Redis | null = null;
const redis = () => (client ??= new Redis({ url: env.REDIS_URL, token: env.REDIS_TOKEN }));

const key = (code: string) => `order:${code}`;

export const redisCache: OrderCache = {
  async get(code) {
    return (await redis().get<Order>(key(code))) ?? null;
  },

  async set(code, order) {
    await redis().set(key(code), order, { ex: CACHE_TTL_SECONDS });
  },

  async del(code) {
    await redis().del(key(code));
  },
};
