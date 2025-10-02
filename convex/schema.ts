import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    clerkUserId: v.string(),
  })
    .index("by_email", ["email"])
    .index("by_clerk_user_id", ["clerkUserId"]),

  apiKeys: defineTable({
    userId: v.id("users"),
    keyHash: v.string(), // Hashed API key
    keyPrefix: v.string(), // First 8 chars for display (e.g., "gate_liv")
    name: v.string(), // User-friendly label
    isActive: v.boolean(),
    rateLimit: v.number(), // requests per day
    lastUsedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_key_hash", ["keyHash"])
    .index("by_is_active", ["isActive"]),

  apiUsageLogs: defineTable({
    apiKeyId: v.id("apiKeys"),
    userId: v.id("users"),
    endpoint: v.string(),
    method: v.string(),
    statusCode: v.number(),
    timestamp: v.number(),
  })
    .index("by_api_key", ["apiKeyId", "timestamp"])
    .index("by_user", ["userId", "timestamp"]),
});

