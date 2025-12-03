import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { eq, sql } from "drizzle-orm";
import * as schema from "./schema";
import { stats } from "./schema";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });

/**
 * Increment a stat value by the given amount (default 1)
 */
export async function incrementStat(key: string, amount: number = 1) {
  await db
    .insert(stats)
    .values({
      key,
      value: amount,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: stats.key,
      set: {
        value: sql`${stats.value} + ${amount}`,
        updatedAt: new Date(),
      },
    });
}

export * from "./schema";
