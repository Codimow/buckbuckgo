import { Effect, Layer } from "effect";
import { CacheService } from "../Service/Cache.js";
import { RedisService } from "../Service/Redis.js";

export const CacheServiceLive = Layer.effect(
    CacheService,
    Effect.gen(function* () {
        const redis = yield* RedisService;

        return {
            get: <T>(key: string) =>
                Effect.gen(function* () {
                    const result = yield* redis.get(key);
                    if (!result) return null;
                    try {
                        return JSON.parse(result) as T;
                    } catch (e) {
                        return null;
                    }
                }),
            set: <T>(key: string, value: T, ttlSeconds?: number) =>
                Effect.gen(function* () {
                    const stringValue = JSON.stringify(value);
                    yield* redis.set(key, stringValue, ttlSeconds);
                }),
        };
    }),
);
