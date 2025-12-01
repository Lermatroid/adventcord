/**
 * Cron script for sending AoC leaderboard updates to Discord webhooks.
 * Run with: bun run scripts/cron.ts
 * Configure Railway to run this at minute 0 of every hour: 0 * * * *
 *
 * Debug flags:
 *   --hour <0-23>      Override the current hour
 *   --day <1-25>       Override the current day (implies December)
 *   --dry-run          Don't send webhooks, just log what would happen
 *   --force-aoc        Force AoC season (Dec 1-25) even outside December
 *   --webhook-id <id>  Only process a specific webhook
 *   --skip-cache       Ignore cache and fetch fresh leaderboard data
 *   --test-url <url>   Send a test message directly to a webhook URL (bypasses DB)
 *   --test-leaderboard <url>  Leaderboard URL to use with --test-url
 *
 * Examples:
 *   bun run cron --dry-run --hour 0 --force-aoc --day 1
 *   bun run cron --webhook-id abc123 --dry-run
 *   bun run cron --test-url https://discord.com/api/webhooks/... --test-leaderboard https://adventofcode.com/...
 */

import { db, webhooks, leaderboardCache, logs } from "../src/db";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { fetchLeaderboard, type AocLeaderboard } from "../src/lib/aoc";
import {
  sendDiscordWebhook,
  formatLeaderboardEmbed,
  formatPuzzleNotificationEmbed,
} from "../src/lib/discord";
import { validateLeaderboardUrl } from "../src/lib/validation";

// Parse CLI arguments
function parseArgs(): {
  hour?: number;
  day?: number;
  dryRun: boolean;
  forceAoc: boolean;
  webhookId?: string;
  webhookUrl?: string;
  skipCache: boolean;
  testUrl?: string;
  testLeaderboard?: string;
} {
  const args = process.argv.slice(2);
  const result = {
    hour: undefined as number | undefined,
    day: undefined as number | undefined,
    dryRun: false,
    forceAoc: false,
    webhookId: undefined as string | undefined,
    webhookUrl: undefined as string | undefined,
    skipCache: false,
    testUrl: undefined as string | undefined,
    testLeaderboard: undefined as string | undefined,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--hour":
        result.hour = parseInt(args[++i], 10);
        if (isNaN(result.hour) || result.hour < 0 || result.hour > 23) {
          console.error("Invalid --hour value (must be 0-23)");
          process.exit(1);
        }
        break;
      case "--day":
        result.day = parseInt(args[++i], 10);
        if (isNaN(result.day) || result.day < 1 || result.day > 25) {
          console.error("Invalid --day value (must be 1-25)");
          process.exit(1);
        }
        break;
      case "--dry-run":
        result.dryRun = true;
        break;
      case "--force-aoc":
        result.forceAoc = true;
        break;
      case "--webhook-id":
        result.webhookId = args[++i];
        break;
      case "--webhook-url":
        result.webhookUrl = args[++i];
        break;
      case "--skip-cache":
        result.skipCache = true;
        break;
      case "--test-url":
        result.testUrl = args[++i];
        break;
      case "--test-leaderboard":
        result.testLeaderboard = args[++i];
        break;
      case "--help":
        console.log(`
Adventcord Cron Script

Usage: bun run cron [options]

Options:
  --hour <0-23>           Override the current hour
  --day <1-25>            Override the current day (implies December)
  --dry-run               Don't send webhooks, just log what would happen
  --force-aoc             Force AoC season (Dec 1-25) even outside December
  --webhook-id <id>       Only process a specific webhook (by DB id)
  --webhook-url <url>     Only process a specific webhook (by Discord URL)
  --skip-cache            Ignore cache and fetch fresh leaderboard data
  --test-url <url>        Send directly to a webhook URL (bypasses DB)
  --test-leaderboard <url> Leaderboard URL to use with --test-url
  --help                  Show this help message

Examples:
  bun run cron --dry-run --hour 0 --force-aoc --day 1
  bun run cron --webhook-id abc123 --dry-run
  bun run cron --test-url https://discord.com/api/webhooks/... --test-leaderboard https://adventofcode.com/...
        `);
        process.exit(0);
    }
  }

  return result;
}

const cliArgs = parseArgs();
const CACHE_TTL_MS = cliArgs.skipCache ? 0 : 5 * 60 * 1000; // 5 minutes (0 if skip-cache)

/**
 * Gets current time info in US Eastern timezone
 */
function getEasternTimeInfo(): {
  hour: number;
  month: number;
  day: number;
  year: number;
} {
  const now = new Date();

  const hour = parseInt(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour: "numeric",
      hour12: false,
    }).format(now),
    10
  );

  const month = parseInt(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      month: "numeric",
    }).format(now),
    10
  );

  const day = parseInt(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      day: "numeric",
    }).format(now),
    10
  );

  const year = parseInt(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
    }).format(now),
    10
  );

  return { hour, month, day, year };
}

/**
 * Checks if today is during Advent of Code (Dec 1-25)
 */
function isAocSeason(month: number, day: number): boolean {
  return month === 12 && day >= 1 && day <= 25;
}

/**
 * Creates a log entry
 */
async function createLog(
  webhookId: string | null,
  type: "success" | "error" | "webhook_deleted",
  message: string
) {
  await db.insert(logs).values({
    id: nanoid(),
    webhookId,
    type,
    message,
    createdAt: new Date(),
  });
}

/**
 * Gets cached leaderboard data or fetches fresh
 */
async function getLeaderboard(
  leaderboardUrl: string
): Promise<{ data?: AocLeaderboard; error?: string }> {
  const validation = validateLeaderboardUrl(leaderboardUrl);
  if (!validation.valid || !validation.viewKey) {
    return { error: validation.error || "Invalid leaderboard URL" };
  }

  // Check cache
  const cached = await db.query.leaderboardCache.findFirst({
    where: eq(leaderboardCache.viewKey, validation.viewKey),
  });

  if (cached) {
    const age = Date.now() - cached.fetchedAt.getTime();
    if (age < CACHE_TTL_MS) {
      console.log(
        `  Cache hit for ${validation.viewKey} (${Math.round(age / 1000)}s old)`
      );
      return { data: JSON.parse(cached.data) };
    }
  }

  // Fetch fresh data
  console.log(`  Fetching fresh data for ${validation.viewKey}...`);
  const result = await fetchLeaderboard(leaderboardUrl);

  if (result.data) {
    // Update cache
    await db
      .insert(leaderboardCache)
      .values({
        id: validation.viewKey,
        viewKey: validation.viewKey,
        data: JSON.stringify(result.data),
        fetchedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: leaderboardCache.viewKey,
        set: {
          data: JSON.stringify(result.data),
          fetchedAt: new Date(),
        },
      });
  }

  return result;
}

/**
 * Send puzzle notifications to webhooks scheduled for this hour
 */
async function sendPuzzleNotifications(
  allWebhooks: Awaited<ReturnType<typeof db.query.webhooks.findMany>>,
  currentHour: number,
  day: number,
  year: number
): Promise<{ success: number; errors: number; deleted: number }> {
  const stats = { success: 0, errors: 0, deleted: 0 };

  const puzzleWebhooks = allWebhooks.filter(
    (webhook) => webhook.puzzleNotificationHour === currentHour
  );

  if (puzzleWebhooks.length === 0) {
    console.log("No puzzle notifications scheduled for this hour.\n");
    return stats;
  }

  console.log(`\n--- Puzzle Notifications (Day ${day}) ---`);
  console.log(`Sending to ${puzzleWebhooks.length} webhook(s)...\n`);

  for (const webhook of puzzleWebhooks) {
    console.log(`  Sending puzzle notification to ${webhook.id}...`);

    const payload = formatPuzzleNotificationEmbed(day, year, webhook.roleId);

    // Dry run mode - don't actually send
    if (cliArgs.dryRun) {
      console.log(`    [DRY RUN] Would send puzzle notification`);
      console.log(`    Payload: ${JSON.stringify(payload.embeds?.[0]?.title)}`);
      stats.success++;
      continue;
    }

    const result = await sendDiscordWebhook(webhook.discordWebhookUrl, payload);

    if (result.webhookDeleted) {
      console.log(`    Webhook deleted - removing from database`);
      if (!cliArgs.dryRun) {
        await db.delete(webhooks).where(eq(webhooks.id, webhook.id));
        await createLog(
          webhook.id,
          "webhook_deleted",
          "Webhook was deleted from Discord"
        );
      }
      stats.deleted++;
    } else if (result.success) {
      console.log(`    Success!`);
      if (!cliArgs.dryRun) {
        await createLog(
          webhook.id,
          "success",
          `Day ${day} puzzle notification sent`
        );
      }
      stats.success++;
    } else {
      console.log(`    Error: ${result.error}`);
      if (!cliArgs.dryRun) {
        await createLog(webhook.id, "error", result.error || "Unknown error");
      }
      stats.errors++;
    }

    // Small delay between webhook calls to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return stats;
}

/**
 * Quick test mode - send directly to a webhook URL without DB
 */
async function runTestMode(webhookUrl: string, leaderboardUrl?: string) {
  console.log("========================================");
  console.log("Adventcord - TEST MODE");
  console.log("========================================\n");

  console.log(`Webhook URL: ${webhookUrl}\n`);

  if (leaderboardUrl) {
    console.log(`Fetching leaderboard: ${leaderboardUrl}...`);
    const result = await fetchLeaderboard(leaderboardUrl);

    if (result.error) {
      console.error(`Error fetching leaderboard: ${result.error}`);
      process.exit(1);
    }

    const leaderboard = result.data!;
    console.log(
      `Got leaderboard: ${leaderboard.event} with ${
        Object.keys(leaderboard.members).length
      } members\n`
    );

    const payload = formatLeaderboardEmbed(leaderboard, null);
    console.log("Sending leaderboard update...");

    const sendResult = await sendDiscordWebhook(webhookUrl, payload);

    if (sendResult.success) {
      console.log("Success! Check your Discord channel.");
    } else {
      console.error(`Error: ${sendResult.error}`);
      if (sendResult.webhookDeleted) {
        console.error("The webhook appears to be deleted.");
      }
    }
  } else {
    // Send a simple test message
    console.log("No leaderboard URL provided, sending test message...\n");

    const payload = {
      embeds: [
        {
          title: "🎄 Adventcord - Test Message",
          description:
            "Your webhook is working! If you provide a `--test-leaderboard` URL, you'll see actual leaderboard data.",
          color: 0x0f9d58,
          timestamp: new Date().toISOString(),
        },
      ],
      username: "Adventcord",
    };

    const sendResult = await sendDiscordWebhook(webhookUrl, payload);

    if (sendResult.success) {
      console.log("Success! Check your Discord channel.");
    } else {
      console.error(`Error: ${sendResult.error}`);
      if (sendResult.webhookDeleted) {
        console.error("The webhook appears to be deleted.");
      }
    }
  }
}

/**
 * Main cron job function
 */
async function main() {
  // Handle test mode first
  if (cliArgs.testUrl) {
    await runTestMode(cliArgs.testUrl, cliArgs.testLeaderboard);
    return;
  }

  const startTime = Date.now();
  const eastern = getEasternTimeInfo();

  // Apply CLI overrides
  const currentHour = cliArgs.hour ?? eastern.hour;
  const day = cliArgs.day ?? eastern.day;
  const month = cliArgs.day ? 12 : eastern.month; // If day is overridden, assume December
  const year = eastern.year;
  const isDuringAoc = cliArgs.forceAoc || isAocSeason(month, day);

  console.log("========================================");
  console.log(`Adventcord - Cron Job`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Eastern: ${month}/${day}/${year} at ${currentHour}:00`);
  console.log(`AoC Season: ${isDuringAoc ? "Yes" : "No"}`);

  // Show debug mode info
  if (
    cliArgs.dryRun ||
    cliArgs.hour !== undefined ||
    cliArgs.day !== undefined ||
    cliArgs.forceAoc ||
    cliArgs.webhookId ||
    cliArgs.skipCache
  ) {
    console.log("--- DEBUG MODE ---");
    if (cliArgs.dryRun) console.log("  Dry run: webhooks will NOT be sent");
    if (cliArgs.hour !== undefined)
      console.log(`  Hour override: ${cliArgs.hour}`);
    if (cliArgs.day !== undefined)
      console.log(`  Day override: ${cliArgs.day}`);
    if (cliArgs.forceAoc) console.log("  Force AoC season: enabled");
    if (cliArgs.webhookId)
      console.log(`  Webhook filter: ${cliArgs.webhookId}`);
    if (cliArgs.skipCache) console.log("  Skip cache: enabled");
  }
  console.log("========================================\n");

  // Get all webhooks (or filter by ID/URL if specified)
  let allWebhooks = await db.query.webhooks.findMany();

  if (cliArgs.webhookId) {
    allWebhooks = allWebhooks.filter((w) => w.id === cliArgs.webhookId);
    if (allWebhooks.length === 0) {
      console.log(`No webhook found with ID: ${cliArgs.webhookId}`);
      return;
    }
    console.log(`Filtering to webhook ID: ${cliArgs.webhookId}\n`);
  }

  if (cliArgs.webhookUrl) {
    allWebhooks = allWebhooks.filter(
      (w) => w.discordWebhookUrl === cliArgs.webhookUrl
    );
    if (allWebhooks.length === 0) {
      console.log(`No webhook found with URL: ${cliArgs.webhookUrl}`);
      return;
    }
    console.log(`Filtering to webhook URL: ${allWebhooks[0].id}\n`);
  }

  let puzzleStats = { success: 0, errors: 0, deleted: 0 };

  // Send puzzle notifications if during AoC season
  if (isDuringAoc) {
    puzzleStats = await sendPuzzleNotifications(
      allWebhooks,
      currentHour,
      day,
      year
    );
  }

  // Get webhooks for leaderboard updates this hour
  const activeWebhooks = allWebhooks.filter((webhook) => {
    const hours: number[] = JSON.parse(webhook.hours);
    return hours.includes(currentHour);
  });

  console.log(`\n--- Leaderboard Updates ---`);
  console.log(
    `Found ${activeWebhooks.length} webhooks scheduled for hour ${currentHour}\n`
  );

  if (
    activeWebhooks.length === 0 &&
    puzzleStats.success === 0 &&
    puzzleStats.errors === 0
  ) {
    console.log("No webhooks to process. Exiting.");
    return;
  }

  if (activeWebhooks.length === 0) {
    // Only puzzle notifications were sent, skip leaderboard section
    const duration = Date.now() - startTime;
    console.log("\n========================================");
    console.log("Summary:");
    console.log(
      `  Puzzle notifications: ${puzzleStats.success} sent, ${puzzleStats.errors} errors`
    );
    console.log(`  Leaderboard updates: 0`);
    console.log(`  Deleted webhooks: ${puzzleStats.deleted}`);
    console.log(`  Duration: ${duration}ms`);
    console.log("========================================\n");
    return;
  }

  // Group webhooks by leaderboard URL to minimize fetches
  const webhooksByLeaderboard = new Map<string, typeof activeWebhooks>();
  for (const webhook of activeWebhooks) {
    const existing = webhooksByLeaderboard.get(webhook.leaderboardUrl) || [];
    existing.push(webhook);
    webhooksByLeaderboard.set(webhook.leaderboardUrl, existing);
  }

  console.log(
    `Grouped into ${webhooksByLeaderboard.size} unique leaderboard(s)\n`
  );

  // Process each leaderboard
  let successCount = 0;
  let errorCount = 0;
  let deletedCount = 0;

  for (const [
    leaderboardUrl,
    webhooksForLeaderboard,
  ] of webhooksByLeaderboard) {
    console.log(
      `\nProcessing leaderboard: ${leaderboardUrl.substring(0, 60)}...`
    );

    // Fetch leaderboard data
    const leaderboardResult = await getLeaderboard(leaderboardUrl);

    if (leaderboardResult.error) {
      console.log(`  Error fetching leaderboard: ${leaderboardResult.error}`);

      // Log error for all webhooks using this leaderboard
      for (const webhook of webhooksForLeaderboard) {
        if (!cliArgs.dryRun) {
          await createLog(
            webhook.id,
            "error",
            `Failed to fetch leaderboard: ${leaderboardResult.error}`
          );
        }
        errorCount++;
      }
      continue;
    }

    const leaderboard = leaderboardResult.data!;
    console.log(
      `  Got leaderboard: ${leaderboard.event} with ${
        Object.keys(leaderboard.members).length
      } members`
    );

    // Send to each webhook
    for (const webhook of webhooksForLeaderboard) {
      console.log(`  Sending to webhook ${webhook.id}...`);

      const payload = formatLeaderboardEmbed(leaderboard, webhook.roleId);

      // Dry run mode - don't actually send
      if (cliArgs.dryRun) {
        console.log(`    [DRY RUN] Would send leaderboard update`);
        console.log(
          `    Payload: ${JSON.stringify(payload.embeds?.[0]?.title)}`
        );
        successCount++;
        continue;
      }

      const result = await sendDiscordWebhook(
        webhook.discordWebhookUrl,
        payload
      );

      if (result.webhookDeleted) {
        console.log(`    Webhook deleted - removing from database`);
        if (!cliArgs.dryRun) {
          await db.delete(webhooks).where(eq(webhooks.id, webhook.id));
          await createLog(
            webhook.id,
            "webhook_deleted",
            "Webhook was deleted from Discord"
          );
        }
        deletedCount++;
      } else if (result.success) {
        console.log(`    Success!`);
        if (!cliArgs.dryRun) {
          await createLog(
            webhook.id,
            "success",
            "Leaderboard update sent successfully"
          );
        }
        successCount++;
      } else {
        console.log(`    Error: ${result.error}`);
        if (!cliArgs.dryRun) {
          await createLog(webhook.id, "error", result.error || "Unknown error");
        }
        errorCount++;
      }

      // Small delay between webhook calls to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  const duration = Date.now() - startTime;

  console.log("\n========================================");
  console.log("Summary:");
  if (isDuringAoc) {
    console.log(
      `  Puzzle notifications: ${puzzleStats.success} sent, ${puzzleStats.errors} errors`
    );
  }
  console.log(
    `  Leaderboard updates: ${successCount} sent, ${errorCount} errors`
  );
  console.log(`  Deleted webhooks: ${deletedCount + puzzleStats.deleted}`);
  console.log(`  Duration: ${duration}ms`);
  console.log("========================================\n");
}

// Run the cron job
main()
  .then(() => {
    console.log("Cron job completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Cron job failed:", error);
    process.exit(1);
  });
