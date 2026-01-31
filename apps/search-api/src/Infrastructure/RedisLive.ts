import { Effect, Layer } from "effect";
import Redis from "ioredis";
import { RedisService } from "../Service/Redis.js";
import { RedisConfig } from "../Config/index.js";

export const RedisServiceLive = Layer.effect(
    RedisService,
    Effect.gen(function* () {
        const config = yield* RedisConfig;

        // We can acquire/release if we want managed resources, or just global client
        // For Effect best practices, we should use acquireRelease
        const client = yield* Effect.acquireRelease(
            Effect.sync(() => new Redis(config.url)),
            (redis) => Effect.promise(() => redis.quit())
        );

        return {
            get: (key: string) =>
                Effect.tryPromise({
                    try: () => client.get(key),
                    catch: (e) => new Error(`Redis Get Error: ${e}`),
                }),
            set: (key: string, value: string, ttlSeconds?: number) =>
                Effect.tryPromise({
                    try: async () => {
                        if (ttlSeconds) {
                            await client.set(key, value, "EX", ttlSeconds);
                        } else {
                            await client.set(key, value);
                        }
                    },
                    catch: (e) => new Error(`Redis Set Error: ${e}`),
                }),
            del: (key: string) =>
                Effect.tryPromise({
                    try: async () => {
                        await client.del(key);
                    },
                    catch: (e) => new Error(`Redis Del Error: ${e}`),
                }),
            incr: (key: string) =>
                Effect.tryPromise({
                    try: () => client.incr(key),
                    catch: (e) => new Error(`Redis Incr Error: ${e}`),
                }),
            expire: (key: string, seconds: number) =>
                Effect.tryPromise({
                    try: async () => {
                        await client.expire(key, seconds);
                    },
                    catch: (e) => new Error(`Redis Expire Error: ${e}`),
                }),
        };
    }),
);
