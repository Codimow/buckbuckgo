import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    documents: defineTable({
        url: v.string(),
        title: v.string(),
        contentText: v.string(),
        searchableText: v.string(), // Normalized and stemmed
        crawledAt: v.string(), // ISO String
        language: v.optional(v.string()),
    })
        .index("by_url", ["url"])
        .searchIndex("search_title", {
            searchField: "title",
            filterFields: ["language"],
        })
        .searchIndex("search_content", {
            searchField: "searchableText",
            filterFields: ["language"],
        }),
    // .vectorIndex("by_embedding", {
    //   vectorField: "embedding",
    //   dimensions: 1536, // if we use OpenAI later
    // }),

    crawled_urls: defineTable({
        url: v.string(),
        status: v.string(), // "queued", "visited", "failed"
        lastVisited: v.number(),
    }).index("by_url", ["url"]),
});
