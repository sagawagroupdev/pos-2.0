import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
  });

// Prevent unhandled error events from crashing the process when Redis is down.
redis.on("error", () => {});

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300) {
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // cache write failures are non-fatal
  }
}

export async function cacheInvalidate(...keys: string[]) {
  try {
    if (keys.length) await redis.del(...keys);
  } catch {
    // cache invalidation failures are non-fatal
  }
}
