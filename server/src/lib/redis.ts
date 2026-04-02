import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

export const redisClient = createClient({ url: redisUrl });
export const redisPubClient = createClient({ url: redisUrl });
export const redisSubClient = redisPubClient.duplicate();

redisClient.on("connect", () => console.log("Redis connected"));
redisClient.on("error", (error) => console.error("Redis error:", error));
redisPubClient.on("error", (error) => console.error("Redis pub error:", error));
redisSubClient.on("error", (error) => console.error("Redis sub error:", error));

export async function connectRedis() {
  await Promise.all([
    redisClient.isOpen ? Promise.resolve() : redisClient.connect(),
    redisPubClient.isOpen ? Promise.resolve() : redisPubClient.connect(),
    redisSubClient.isOpen ? Promise.resolve() : redisSubClient.connect(),
  ]);
}