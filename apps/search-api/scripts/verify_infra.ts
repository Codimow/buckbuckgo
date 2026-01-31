import { Effect, Layer } from "effect";
import { DatabaseClient, DatabaseClientLive } from "../src/Infrastructure/Database.js";
import { RedisServiceLive } from "../src/Infrastructure/RedisLive.js";
import { RedisService } from "../src/Service/Redis.js";
import { NodeContext } from "@effect/platform-node";

const InfraTestLayer = Layer.mergeAll(
    DatabaseClientLive,
    RedisServiceLive,
    NodeContext.layer
);

const program = Effect.gen(function* () {
    const db = yield* DatabaseClient;
    const redis = yield* RedisService;

    console.log("Checking Postgres...");

    // Check Vector Extension
    const extensions = yield* db.query("SELECT * FROM pg_extension WHERE extname = 'vector'");
    if (extensions.rows.length === 0) {
        console.error("❌ pgvector extension NOT found!");
    } else {
        console.log("✅ pgvector extension enabled.");
    }

    // Check Schema
    const columns = yield* db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'documents'");
    const hasEmbedding = columns.rows.some((row: any) => row.column_name === 'embedding');

    if (hasEmbedding) {
        console.log("✅ 'embedding' column exists in 'documents' table.");
    } else {
        console.error("❌ 'embedding' column MISSING in 'documents' table!");
        console.log("Found columns:", columns.rows.map((r: any) => r.column_name));
    }

    console.log("Checking Redis...");
    yield* redis.set("infra_test", "ok", 10);
    const val = yield* redis.get("infra_test");

    if (val === "ok") {
        console.log("✅ Redis connection working.");
    } else {
        console.error("❌ Redis connection failed!");
    }

}).pipe(
    Effect.provide(InfraTestLayer),
    Effect.scoped
);

Effect.runPromise(program).catch(console.error);
