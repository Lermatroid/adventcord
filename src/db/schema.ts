import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export type WebhookType = "discord" | "slack";

export const webhooks = sqliteTable(
  "webhooks",
  {
    id: text("id").primaryKey(),
    webhookUrl: text("webhook_url").notNull().unique(),
    type: text("type").$type<WebhookType>().notNull().default("discord"),
    roleId: text("role_id"), // Discord only: role ID to mention
    pingChannel: integer("ping_channel", { mode: "boolean" }), // Slack only: whether to use <!channel>
    hours: text("hours").notNull(), // JSON array e.g., "[6, 12, 18]"
    leaderboardUrl: text("leaderboard_url").notNull(),
    joinCode: text("join_code"), // Optional: join code to include in messages
    puzzleNotificationHour: integer("puzzle_notification_hour"), // null = disabled, 0-23 for hour (EST)
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [index("webhook_url_idx").on(table.webhookUrl)]
);

export const leaderboardCache = sqliteTable(
  "leaderboard_cache",
  {
    id: text("id").primaryKey(),
    viewKey: text("view_key").notNull().unique(),
    data: text("data").notNull(), // JSON leaderboard response
    fetchedAt: integer("fetched_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [index("view_key_idx").on(table.viewKey)]
);

export const logs = sqliteTable("logs", {
  id: text("id").primaryKey(),
  webhookId: text("webhook_id").references(() => webhooks.id, {
    onDelete: "cascade",
  }),
  type: text("type").notNull(), // "success", "error", "webhook_deleted"
  message: text("message").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// Stats table - pseudo key-value store for tracking counts
export const stats = sqliteTable("stats", {
  key: text("key").primaryKey(),
  value: integer("value").notNull().default(0),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// Type exports
export type Webhook = typeof webhooks.$inferSelect;
export type NewWebhook = typeof webhooks.$inferInsert;
export type LeaderboardCache = typeof leaderboardCache.$inferSelect;
export type NewLeaderboardCache = typeof leaderboardCache.$inferInsert;
export type Log = typeof logs.$inferSelect;
export type NewLog = typeof logs.$inferInsert;
export type Stat = typeof stats.$inferSelect;
export type NewStat = typeof stats.$inferInsert;

