"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchServiceLive = void 0;
const effect_1 = require("effect");
const Search_js_1 = require("../Service/Search.js");
const Models_js_1 = require("../Domain/Models.js");
const browser_1 = require("convex/browser");
const server_1 = require("convex/server");
// We use "anyApi" here because we can't easily import the generated API from the monorepo root 
// without complex TS paths alias setups or building the `API` type.
// For now, we cast or use unchecked strings.
// Hardcoded or Env based URL
const CONFIG_CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL || "https://happy-otter-123.convex.cloud";
const client = new browser_1.ConvexHttpClient(CONFIG_CONVEX_URL);
const make = effect_1.Effect.succeed({
    search: (query) => effect_1.Effect.tryPromise({
        try: async () => {
            // Query the "search" function in convex/documents.ts
            const results = await client.query(server_1.anyApi.documents.search, { q: query.q });
            return results.map((doc) => new Models_js_1.SearchResult({
                id: doc._id,
                title: doc.title,
                url: doc.url,
                snippet: doc.contentText.substring(0, 200) + "...",
                score: doc._score || 1.0,
            }));
        },
        catch: (error) => new Error(`Convex error: ${String(error)}`),
    }),
});
exports.SearchServiceLive = effect_1.Layer.effect(Search_js_1.SearchService, make);
