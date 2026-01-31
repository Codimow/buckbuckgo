import { Effect, Layer, Context } from "effect";
import { SearchService } from "../Service/Search.js";
import { SearchResult, SearchQuery, SearchResponse } from "../Domain/Models.js";
import { DatabaseClient } from "./Database.js";
import { processNepaliText } from "@bsearch/nlp";

export const SearchServiceLive = Layer.effect(
  SearchService,
  Effect.gen(function* () {
    const db = yield* DatabaseClient;

    const generateHighlight = (content: string, query: string): string => {
      const term = query.toLowerCase();
      const index = content.toLowerCase().indexOf(term);
      if (index === -1) return content.substring(0, 200) + "...";

      const start = Math.max(0, index - 100);
      const end = Math.min(content.length, index + 100);
      let snippet = content.substring(start, end);

      const regex = new RegExp(`(${query})`, "gi");
      snippet = snippet.replace(regex, "**$1**");

      return (
        (start > 0 ? "..." : "") + snippet + (end < content.length ? "..." : "")
      );
    };

    return {
      search: (query: SearchQuery) =>
        Effect.gen(function* () {
          const processedQuery = processNepaliText(query.q);
          const searchTerm = processedQuery || query.q;

          const sql = `
            SELECT id, url, title, content_text, 
                   ts_rank(to_tsvector('simple', searchable_text), plainto_tsquery('simple', $1)) as rank
            FROM documents
            WHERE to_tsvector('simple', searchable_text) @@ plainto_tsquery('simple', $1)
            ORDER BY rank DESC
            LIMIT $2 OFFSET $3
          `;

          const limit = query.limit;
          const offset = query.cursor ? parseInt(query.cursor) : 0;

          const result = yield* db.query(sql, [searchTerm, limit, offset]);

          const results = result.rows.map(
            (row: any) =>
              new SearchResult({
                id: row.id.toString(),
                title: row.title,
                url: row.url,
                snippet: generateHighlight(row.content_text, query.q),
                score: Number(row.rank),
              }),
          );

          const nextCursor =
            result.rows.length === limit
              ? (offset + limit).toString()
              : undefined;

          return new SearchResponse({
            results,
            continueCursor: nextCursor ?? "",
            isDone: results.length < limit,
          });
        }),
    };
  }),
);
