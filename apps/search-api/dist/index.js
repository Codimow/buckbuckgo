"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const effect_1 = require("effect");
const platform_node_1 = require("@effect/platform-node");
const platform_1 = require("@effect/platform");
const Search_js_1 = require("./Service/Search.js");
const SearchLive_js_1 = require("./Infrastructure/SearchLive.js");
const Models_js_1 = require("./Domain/Models.js");
const http_1 = require("http");
const router = platform_1.HttpRouter.empty.pipe(platform_1.HttpRouter.get("/search", effect_1.Effect.gen(function* (_) {
    const req = yield* _(platform_1.HttpServerRequest.HttpServerRequest);
    const searchService = yield* _(Search_js_1.SearchService);
    const url = new URL(req.url, "http://localhost");
    const q = url.searchParams.get("q");
    if (!q) {
        return yield* _(platform_1.HttpServerResponse.json({ error: "Missing query 'q'" }, { status: 400 }));
    }
    const searchQuery = new Models_js_1.SearchQuery({ q, page: 1, limit: 10 });
    const results = yield* _(searchService.search(searchQuery));
    return yield* _(platform_1.HttpServerResponse.json({ results }));
})), platform_1.HttpRouter.get("/health", effect_1.Effect.succeed(platform_1.HttpServerResponse.text("OK"))));
const ServerLive = platform_node_1.NodeHttpServer.layer(http_1.createServer, { port: 3000 });
const MainLayer = router.pipe(platform_1.HttpServer.serve(platform_1.HttpMiddleware.logger), effect_1.Layer.provide(ServerLive), effect_1.Layer.provide(platform_node_1.NodeContext.layer), effect_1.Layer.provide(SearchLive_js_1.SearchServiceLive));
effect_1.Effect.runFork(effect_1.Layer.launch(MainLayer));
effect_1.Console.log("Search API listening on port 3000");
