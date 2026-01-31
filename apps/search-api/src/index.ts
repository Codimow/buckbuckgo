import "dotenv/config";
import { Effect, Layer, Metric } from "effect";
import { NodeHttpServer, NodeContext, NodeRuntime } from "@effect/platform-node";
import { HttpMiddleware, HttpRouter, HttpServer, HttpServerResponse, HttpServerRequest } from "@effect/platform";
import { createServer } from "http";

import { SearchService } from "./Service/Search.js";
import { SearchServiceLive } from "./Infrastructure/SearchLive.js";
import { DatabaseClientLive } from "./Infrastructure/Database.js";
import { SearchQuery } from "./Domain/Models.js";
import { DatabaseClient } from "./Infrastructure/Database.js";

/**
 * Metrics
 */
const requestCounter = Metric.counter("search_api_requests_total", {
    description: "Total number of requests received"
});

/**
 * RequestId Middleware
 */
const RequestIdMiddleware = HttpMiddleware.make((httpApp) =>
    Effect.gen(function* () {
        const request = yield* HttpServerRequest.HttpServerRequest;
        const requestId = request.headers["x-request-id"] || crypto.randomUUID();

        return yield* httpApp.pipe(
            Effect.annotateLogs("requestId", requestId)
        );
    })
);

/**
 * Main application router
 */
const router = HttpRouter.empty.pipe(
    HttpRouter.get("/health/live", Effect.succeed(HttpServerResponse.text("OK"))),
    HttpRouter.get("/health/ready", Effect.gen(function* () {
        const db = yield* DatabaseClient;
        yield* db.query("SELECT 1");
        return HttpServerResponse.text("Ready");
    }).pipe(
        Effect.catchAll(() => Effect.succeed(HttpServerResponse.text("Service Unavailable", { status: 503 })))
    )),
    HttpRouter.get("/search", Effect.gen(function* () {
        const req = yield* HttpServerRequest.HttpServerRequest;
        const searchService = yield* SearchService;

        yield* Metric.increment(requestCounter);

        const url = new URL(req.url, "http://localhost");
        const q = url.searchParams.get("q");
        const cursor = url.searchParams.get("cursor") || undefined;
        const lang = url.searchParams.get("lang") || undefined;
        const limit = parseInt(url.searchParams.get("limit") || "10", 10);

        if (!q) {
            return yield* HttpServerResponse.json({ error: "Missing query parameter 'q'" }, { status: 400 });
        }

        yield* Effect.logInfo(`Searching for: ${q}`);

        const searchQuery = new SearchQuery({ q, limit, cursor, language: lang });
        const response = yield* searchService.search(searchQuery);

        return yield* HttpServerResponse.json(response);
    }).pipe(
        Effect.catchAllCause((cause) =>
            Effect.gen(function* () {
                yield* Effect.logError("Search request failed", cause);
                return yield* HttpServerResponse.json({ error: "Internal Server Error" }, { status: 500 });
            })
        )
    ))
);

/**
 * Apply middleware
 */
const app = router.pipe(
    RequestIdMiddleware,
    HttpMiddleware.logger,
    HttpMiddleware.cors({
        allowedOrigins: ["*"],
        allowedMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Request-Id"],
        exposedHeaders: ["Content-Range", "X-Content-Range", "X-Request-Id"],
        maxAge: "10 minutes"
    })
);

/**
 * Server infrastructure layer
 */
const ServerLive = NodeHttpServer.layer(createServer, { port: 4000 });

/**
 * Combined application layer
 * HttpServer.serve(app) returns a Layer that starts the server
 */
const MainLayer = HttpServer.serve(app).pipe(
    Layer.provide(SearchServiceLive),
    Layer.provide(DatabaseClientLive),
    Layer.provide(ServerLive),
    Layer.provide(NodeContext.layer)
);

/**
 * Run the application
 */
Layer.launch(MainLayer).pipe(NodeRuntime.runMain);
