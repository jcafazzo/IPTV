import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    channels: defineTable({
        name: v.string(),
        url: v.string(),
        type: v.union(
            v.literal("m3u8"),
            v.literal("youtube_video"),
            v.literal("youtube_live"),
            v.literal("iframe")
        ),
        logo: v.optional(v.string()),
        category: v.string(), // e.g. "Argentina", "Sports", "News"
        active: v.boolean(),
        order: v.optional(v.number()), // For custom sorting
    }).index("by_active_order", ["active", "order"]),
});
