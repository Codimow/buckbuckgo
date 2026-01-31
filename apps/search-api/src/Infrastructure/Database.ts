import { Context, Layer, Effect } from "effect";
import pg from "pg";
const { Pool } = pg;
import { DatabaseConfig } from "../Config/index.js";

export interface DatabaseClient {
    readonly query: (
        sql: string,
        params?: any[],
    ) => Effect.Effect<pg.QueryResult<any>, Error>;
}

export const DatabaseClient =
    Context.GenericTag<DatabaseClient>("DatabaseClient");

export const DatabaseClientLive = Layer.scoped(
    DatabaseClient,
    Effect.gen(function* () {
        const config = yield* DatabaseConfig;
        const pool = new Pool({
            connectionString: config.url,
            max: config.maxConnections,
        });

        yield* Effect.acquireRelease(
            Effect.sync(() => {
                console.log("Database pool created");
                return pool;
            }),
            (p) =>
                Effect.promise(() => p.end()).pipe(
                    Effect.tap(() =>
                        Effect.sync(() => console.log("Database pool closed")),
                    ),
                ),
        );

        return {
            query: (sql: string, params?: any[]) =>
                Effect.tryPromise({
                    try: () => pool.query(sql, params),
                    catch: (error) => new Error(`Database Query Error: ${String(error)}`),
                }),
        };
    }),
);
