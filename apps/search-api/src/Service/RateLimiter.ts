import { Effect, Context } from "effect";

export class RateLimiterService extends Context.Tag("RateLimiterService")<
    RateLimiterService,
    {
        /**
         * Checks if the key has exceeded the limit within the window.
         * Returns true if allowed, false if limit exceeded.
         */
        readonly allowable: (
            key: string,
            limit: number,
            windowSeconds: number,
        ) => Effect.Effect<boolean, unknown>;
    }
>() { }
