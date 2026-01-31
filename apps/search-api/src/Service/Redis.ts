import { Effect, Context } from "effect";

export class RedisService extends Context.Tag("RedisService")<
    RedisService,
    {
        readonly get: (key: string) => Effect.Effect<string | null, unknown>;
        readonly set: (
            key: string,
            value: string,
            ttlSeconds?: number,
        ) => Effect.Effect<void, unknown>;
        readonly del: (key: string) => Effect.Effect<void, unknown>;
        readonly incr: (key: string) => Effect.Effect<number, unknown>;
        readonly expire: (key: string, seconds: number) => Effect.Effect<void, unknown>;
        // Add more as needed
    }
>() { }
