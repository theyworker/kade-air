// Required configuration, read once at module load. A missing value is a
// deployment mistake, and it should fail immediately and by name rather than
// surface later as a confusing runtime error.
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. ` +
        `Set it in .env.local for development, or in the Vercel project settings.`,
    );
  }
  return value;
}

export const DATABASE_URL = requireEnv('DATABASE_URL');
export const REDIS_URL = requireEnv('UPSTASH_REDIS_REST_URL');
export const REDIS_TOKEN = requireEnv('UPSTASH_REDIS_REST_TOKEN');
