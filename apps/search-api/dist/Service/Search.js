"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = exports.SearchError = void 0;
const effect_1 = require("effect");
class SearchError extends effect_1.Context.Tag("SearchError")() {
}
exports.SearchError = SearchError;
exports.SearchService = effect_1.Context.GenericTag("SearchService");
