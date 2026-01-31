import { Effect, Layer } from "effect";
import { DatabaseClient, DatabaseClientLive } from "../src/Infrastructure/Database.js";
import { EmbeddingService } from "../src/Service/Embedding.js";
import { EmbeddingServiceLive } from "../src/Infrastructure/EmbeddingLive.js";
import { NodeContext } from "@effect/platform-node";
// import { RedisServiceLive } from "../src/Infrastructure/RedisLive.js";

// Minimal Layer for Script
const ScriptLayer = Layer.mergeAll(
    DatabaseClientLive,
    EmbeddingServiceLive,
    NodeContext.layer
);

const program = Effect.gen(function* () {
    const db = yield* DatabaseClient;
    const embedder = yield* EmbeddingService;

    console.log("Fetching documents without embeddings...");
    const result = yield* db.query("SELECT id, searchable_text FROM documents WHERE embedding IS NULL LIMIT 100"); // Process in batches

    const docs = result.rows;
    console.log(`Found ${docs.length} documents to process.`);

    for (const doc of docs) {
        console.log(`Processing doc ${doc.id}...`);
        try {
            // Generate embedding
            // Truncate text if too long (optional, model handles it but performance)
            const text = doc.searchable_text.slice(0, 1000);
            const vector = yield* embedder.generate(text);

            // Update DB
            // format vector as string "[0.1, 0.2, ...]" for pgvector input? 
            // node-postgres usually handles array? Or need to verify pgvector input format.
            // usually `[1,2,3]` string representation works.
            const vectorStr = JSON.stringify(vector);

            yield* db.query("UPDATE documents SET embedding = $1 WHERE id = $2", [vectorStr, doc.id]);
            console.log(`Updated doc ${doc.id}`);
        } catch (e) {
            console.error(`Failed doc ${doc.id}`, e);
        }
    }

    console.log("Batch complete.");
}).pipe(
    Effect.provide(ScriptLayer),
    Effect.scoped
);

Effect.runPromise(program).catch(console.error);
