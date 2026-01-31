import { Context, Effect } from "effect";

export class EmbeddingService extends Context.Tag("EmbeddingService")<
    EmbeddingService,
    {
        readonly generate: (text: string) => Effect.Effect<number[], unknown, never>;
    }
>() { }
