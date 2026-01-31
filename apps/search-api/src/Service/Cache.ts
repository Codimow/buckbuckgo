import { Effect, Context } from "effect";

export class CacheService extends Context.Tag("CacheService")<
    CacheService,
    {
        readonly get: <T>(key: string) => Effect.Effect<T | null, unknown>;
        readonly set: <T>(
            key: string,
            value: T,
            ttlSeconds?: number,
        ) => Effect.Effect<void, unknown>;
    }
>() { }
