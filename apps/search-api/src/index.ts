import "dotenv/config";
import { Effect, Layer, Console } from "effect";
import { NodeHttpServer, NodeContext } from "@effect/platform-node";
import { HttpMiddleware, HttpRouter, HttpServer, HttpServerResponse, HttpServerRequest } from "@effect/platform";
import { SearchService } from "./Service/Search.js";
import { SearchServiceLive } from "./Infrastructure/SearchLive.js";
import { SearchQuery } from "./Domain/Models.js";
import { createServer } from "http";

const router = HttpRouter.empty.pipe(
    HttpRouter.get("/search", Effect.gen(function* (_) {
        const req = yield* _(HttpServerRequest.HttpServerRequest);
        const searchService = yield* _(SearchService);

        const url = new URL(req.url, "http://localhost");
        const q = url.searchParams.get("q");

        if (!q) {
            return yield* _(HttpServerResponse.json({ error: "Missing query 'q'" }, { status: 400 }));
        }

        const searchQuery = new SearchQuery({ q, page: 1, limit: 10 });
        const results = yield* _(searchService.search(searchQuery));

        return yield* _(HttpServerResponse.json({ results }));
    })),
    HttpRouter.get("/health", Effect.succeed(HttpServerResponse.text("OK")))
);

const ServerLive = NodeHttpServer.layer(createServer, { port: 3000 });

const MainLayer = router.pipe(
    HttpServer.serve(HttpMiddleware.logger),
    Layer.provide(ServerLive),
    Layer.provide(NodeContext.layer),
    Layer.provide(SearchServiceLive)
);

Effect.runFork(Layer.launch(MainLayer));

Console.log("Search API listening on port 3000");
