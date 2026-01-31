import { Effect, Context } from "effect";
import { SearchResult, SearchQuery, SearchResponse } from "../Domain/Models.js";

export class SearchError extends Context.Tag("SearchError")<
  SearchError,
  { readonly message: string }
>() {}

export interface SearchService {
  readonly search: (query: SearchQuery) => Effect.Effect<SearchResponse, Error>;
}

export const SearchService = Context.GenericTag<SearchService>("SearchService");
