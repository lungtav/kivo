import { redis } from "./redis.client.js";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
}

export const checkRateLimit = async (
  key: string,
  windowSeconds: number,
  limit: number,
): Promise<RateLimitResult> => {
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }

  const ttl = await redis.ttl(key);

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    retryAfter: Math.max(0, ttl),
  };
};