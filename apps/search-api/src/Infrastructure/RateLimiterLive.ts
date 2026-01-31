import { Effect, Layer } from "effect";
import { RateLimiterService } from "../Service/RateLimiter.js";
import { RedisService } from "../Service/Redis.js";

export const RateLimiterServiceLive = Layer.effect(
    RateLimiterService,
    Effect.gen(function* () {
        const redis = yield* RedisService;

        return {
            allowable: (key: string, limit: number, windowSeconds: number) =>
                Effect.gen(function* () {
                    const redisKey = `ratelimit:${key}`;

                    const current = yield* redis.incr(redisKey);

                    if (current === 1) {
                        yield* redis.expire(redisKey, windowSeconds);
                    }

                    return current <= limit;
                }),
        };
    }),
);
