import { redis } from "../redis/redis.client.js";

const CONN_TTL_SECONDS = 30;
// the set must expire too, or connections lost to a crash leave users stuck "online"
const SET_TTL_SECONDS = 60;

export const registerConnection = async (
  connectionId: string,
  userId: string,
) => {
  await redis.hset(`conn:${connectionId}`, { userId, connectedAt: Date.now() });
  await redis.expire(`conn:${connectionId}`, CONN_TTL_SECONDS);
  await redis.sadd(`user:${userId}:connections`, connectionId);
  await redis.expire(`user:${userId}:connections`, SET_TTL_SECONDS);
};

export const refreshConnection = async (connectionId: string) => {
  const userId = await redis.hget(`conn:${connectionId}`, "userId");
  await redis.expire(`conn:${connectionId}`, CONN_TTL_SECONDS);
  if (userId) {
    await redis.expire(`user:${userId}:connections`, SET_TTL_SECONDS);
  }
};

export const removeConnection = async (
  connectionId: string,
  userId: string,
) => {
  await redis.del(`conn:${connectionId}`);
  await redis.srem(`user:${userId}:connections`, connectionId);

  const remainingConnections = await redis.scard(`user:${userId}:connections`);

  return remainingConnections === 0;
};

export const isUserOnline = async (userId: string) => {
  const count = await redis.scard(`user:${userId}:connections`);

  return count > 0;
};
