import { Effect, Layer } from "effect";
import { SearchService } from "../Service/Search.js";
import { SearchResult, SearchQuery, SearchResponse } from "../Domain/Models.js";
import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";

// Helper to generate a basic snippet with highlighting
const generateHighlight = (content: string, query: string): string => {
    const term = query.toLowerCase();
    const index = content.toLowerCase().indexOf(term);
    if (index === -1) return content.substring(0, 200) + "...";

    const start = Math.max(0, index - 100);
    const end = Math.min(content.length, index + 100);
    let snippet = content.substring(start, end);

    // Basic highlight with markdown-like formatting or bold
    const regex = new RegExp(`(${query})`, "gi");
    snippet = snippet.replace(regex, "**$1**");

    return (start > 0 ? "..." : "") + snippet + (end < content.length ? "..." : "");
};

// Hardcoded or Env based URL
const CONFIG_CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL || "https://happy-otter-123.convex.cloud";

const client = new ConvexHttpClient(CONFIG_CONVEX_URL);

const make = Effect.succeed({
    search: (query: SearchQuery) =>
        Effect.tryPromise({
            try: async () => {
                // Query the "search" function in convex/documents.ts
                const results = await client.query(anyApi.documents.search, {
                    q: query.q,
                    paginationOpts: {
                        numItems: query.limit,
                        cursor: query.cursor ?? null
                    },
                    language: query.language,
                });

                return new SearchResponse({
                    results: results.page.map((doc: any) => new SearchResult({
                        id: doc._id,
                        title: doc.title,
                        url: doc.url,
                        snippet: generateHighlight(doc.contentText, query.q),
                        score: doc._score || 1.0,
                    })),
                    continueCursor: results.continueCursor,
                    isDone: results.isDone,
                });
            },
            catch: (error) => new Error(`Convex error: ${String(error)}`),
        }),
});

export const SearchServiceLive = Layer.effect(SearchService, make);
