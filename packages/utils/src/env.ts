export function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getRedisUrl(): string {
  return getRequiredEnv("REDIS_URL");
}

export function getRedisOptions() {
  const redisUrl = getRedisUrl();

  return {
    url: redisUrl,
    options: {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      tls: redisUrl.startsWith("rediss://") ? {} : undefined,
    },
  };
}
