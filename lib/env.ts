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

// Getters, not constants: importing a module that needs configuration must not
// demand that configuration. The throw still fires by name, just on first use
// rather than on import — which on serverless is the same moment in practice,
// and which keeps `npm test` able to load these modules without credentials.
export const env = {
  get DATABASE_URL() {
    return requireEnv('DATABASE_URL');
  },
  get REDIS_URL() {
    return requireEnv('UPSTASH_REDIS_REST_URL');
  },
  get REDIS_TOKEN() {
    return requireEnv('UPSTASH_REDIS_REST_TOKEN');
  },
};
