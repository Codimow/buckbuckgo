import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { processNepaliText } from "./nlp.js";

export const saveDocument = mutation({
    args: {
        url: v.string(),
        title: v.string(),
        contentText: v.string(),
        language: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const searchableText = processNepaliText(args.contentText);
        const crawledAt = new Date().toISOString();

        // Upsert logic
        const existing = await ctx.db
            .query("documents")
            .withIndex("by_url", (q) => q.eq("url", args.url))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                title: args.title,
                contentText: args.contentText,
                searchableText,
                crawledAt,
                language: args.language,
            });
            return existing._id;
        } else {
            const id = await ctx.db.insert("documents", {
                url: args.url,
                title: args.title,
                contentText: args.contentText,
                searchableText,
                crawledAt,
                language: args.language,
            });
            return id;
        }
    },
});

export const search = query({
    args: {
        q: v.string(),
        paginationOpts: v.any(),
        language: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        let q = ctx.db
            .query("documents")
            .withSearchIndex("search_content", (q) =>
                q.search("searchableText", args.q)
            );

        if (args.language) {
            q = q.filter((f) => f.eq("language", args.language));
        }

        return await q.paginate(args.paginationOpts);
    },
});
