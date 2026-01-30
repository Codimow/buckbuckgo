import { Effect, Context } from "effect";
import { SearchResult, SearchQuery } from "../Domain/Models.js";

export class SearchError extends Context.Tag("SearchError")<
    SearchError,
    { readonly message: string }
>() { }

export interface SearchService {
    readonly search: (
        query: SearchQuery
    ) => Effect.Effect<SearchResult[], Error>;
}

export const SearchService = Context.GenericTag<SearchService>("SearchService");
