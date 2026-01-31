import { Schema } from "effect";

export class SearchResult extends Schema.Class<SearchResult>("SearchResult")({
  id: Schema.String,
  title: Schema.String,
  url: Schema.String,
  snippet: Schema.String,
  score: Schema.Number,
}) {}

export class SearchQuery extends Schema.Class<SearchQuery>("SearchQuery")({
  q: Schema.String,
  limit: Schema.Number,
  cursor: Schema.optional(Schema.String),
  language: Schema.optional(Schema.String),
}) {}

export class SearchResponse extends Schema.Class<SearchResponse>(
  "SearchResponse",
)({
  results: Schema.Array(SearchResult),
  continueCursor: Schema.String,
  isDone: Schema.Boolean,
}) {}
