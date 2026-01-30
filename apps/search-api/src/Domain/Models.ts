import { Schema } from "effect";

export class SearchResult extends Schema.Class<SearchResult>("SearchResult")({
    id: Schema.String,
    title: Schema.String,
    url: Schema.String,
    snippet: Schema.String,
    score: Schema.Number,
}) { }

export class SearchQuery extends Schema.Class<SearchQuery>("SearchQuery")({
    q: Schema.String,
    page: Schema.Number,
    limit: Schema.Number,
}) { }
