import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const saveDocument = mutation({
    args: {
        url: v.string(),
        title: v.string(),
        contentText: v.string(),
    },
    handler: async (ctx, args) => {
        // Upsert logic
        const existing = await ctx.db
            .query("documents")
            .withIndex("by_url", (q) => q.eq("url", args.url))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                title: args.title,
                contentText: args.contentText,
                crawledAt: new Date().toISOString(),
            });
            return existing._id;
        } else {
            const id = await ctx.db.insert("documents", {
                url: args.url,
                title: args.title,
                contentText: args.contentText,
                crawledAt: new Date().toISOString(),
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
                q.search("contentText", args.q)
            );

        // Note: Filter fields must be defined in the search index in schema.ts
        // Schema.ts already has language in filterFields for search_content
        if (args.language) {
            q = q.filter((f) => f.eq("language", args.language));
        }

        return await q.paginate(args.paginationOpts);
    },
});
