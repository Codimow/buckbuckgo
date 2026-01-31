import { useQuery } from "@tanstack/react-query";

interface SearchResult {
    id: string;
    title: string;
    url: string;
    snippet: string;
    score: number;
}

interface SearchResponse {
    results: SearchResult[];
    continueCursor: string | null;
    isDone: boolean;
}

const fetchSearch = async (query: string, cursor?: string, lang?: string) => {
    if (!query) return null;

    const params = new URLSearchParams({ q: query });
    if (cursor) params.append("cursor", cursor);
    if (lang) params.append("lang", lang);

    // Assuming API is proxied or CORS handled.
    // For dev we might need to point to localhost:4000 directly.
    const res = await fetch(`http://localhost:4000/search?${params.toString()}`);
    if (!res.ok) throw new Error("Search failed");
    return res.json() as Promise<SearchResponse>;
};

export function useSearch(query: string, lang?: string) {
    return useQuery({
        queryKey: ["search", query, lang],
        queryFn: () => fetchSearch(query, undefined, lang),
        enabled: !!query,
    });
}
