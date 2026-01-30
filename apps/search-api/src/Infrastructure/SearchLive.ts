import { Effect, Layer } from "effect";
import { SearchService } from "../Service/Search.js";
import { SearchResult, SearchQuery } from "../Domain/Models.js";
import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";

// We use "anyApi" here because we can't easily import the generated API from the monorepo root 
// without complex TS paths alias setups or building the `API` type.
// For now, we cast or use unchecked strings.

// Hardcoded or Env based URL
const CONFIG_CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL || "https://happy-otter-123.convex.cloud";

const client = new ConvexHttpClient(CONFIG_CONVEX_URL);

const make = Effect.succeed({
    search: (query: SearchQuery) =>
        Effect.tryPromise({
            try: async () => {
                // Query the "search" function in convex/documents.ts
                const results = await client.query(anyApi.documents.search, { q: query.q });

                return results.map((doc: any) => new SearchResult({
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

export const SearchServiceLive = Layer.effect(SearchService, make);
