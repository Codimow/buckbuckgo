import { Effect, Layer } from "effect";
import { pipeline } from "@xenova/transformers";
import { EmbeddingService } from "../Service/Embedding.js";

export const EmbeddingServiceLive = Layer.effect(
    EmbeddingService,
    Effect.gen(function* () {
        console.log("Initializing Embedding Model...");

        // Initialize the pipeline (downloads model if not cached)
        // Using 'any' cast because pipeline types might be tricky with Effect's strictness
        const extractor = yield* Effect.tryPromise({
            try: () => pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2'),
            catch: (e) => new Error(`Failed to load embedding model: ${e}`)
        });

        console.log("Embedding Model Loaded.");

        return {
            generate: (text: string) =>
                Effect.tryPromise({
                    try: async () => {
                        // @ts-ignore
                        const output = await extractor(text, { pooling: 'mean', normalize: true });
                        return Array.from(output.data) as number[];
                    },
                    catch: (e) => new Error(`Embedding Generation Error: ${e}`)
                })
        };
    })
);
