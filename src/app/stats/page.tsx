import { db, stats } from "@/db";
import { eq } from "drizzle-orm";
import Link from "next/link";

// Revalidate the page every hour (3600 seconds)
export const revalidate = 3600;

async function getStatValue(key: string): Promise<number> {
  const stat = await db.query.stats.findFirst({
    where: eq(stats.key, key),
  });
  return stat?.value ?? 0;
}

export default async function StatsPage() {
  const leaderboardCount = await getStatValue("leaderboards_subscribed");
  const notificationsSent = await getStatValue("notifications_sent");

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-green text-lg">--- Stats ---</h1>
        <p className="text-foreground/80">Adventcord usage statistics</p>
      </div>

      <div className="border border-input-border p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-input-border pb-4">
          <div className="space-y-1">
            <p className="text-silver text-sm">Subscribed Leaderboards</p>
            <p className="text-foreground/60 text-xs">
              Total leaderboard subscriptions created
            </p>
          </div>
          <p className="text-gold text-2xl font-bold tabular-nums">
            {leaderboardCount.toLocaleString()}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-silver text-sm">Notifications Sent</p>
            <p className="text-foreground/60 text-xs">
              Total webhook notifications delivered
            </p>
          </div>
          <p className="text-gold text-2xl font-bold tabular-nums">
            {notificationsSent.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-foreground/50 text-xs">
          * Stats are updated once an hour as new subscriptions are created and
          notifications are sent.
        </p>
      </div>

      <div className="pt-4">
        <Link href="/" className="text-green hover:text-link-hover">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
