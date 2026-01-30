"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchQuery = exports.SearchResult = void 0;
const effect_1 = require("effect");
class SearchResult extends effect_1.Schema.Class("SearchResult")({
    id: effect_1.Schema.String,
    title: effect_1.Schema.String,
    url: effect_1.Schema.String,
    snippet: effect_1.Schema.String,
    score: effect_1.Schema.Number,
}) {
}
exports.SearchResult = SearchResult;
class SearchQuery extends effect_1.Schema.Class("SearchQuery")({
    q: effect_1.Schema.String,
    page: effect_1.Schema.Number,
    limit: effect_1.Schema.Number,
}) {
}
exports.SearchQuery = SearchQuery;
