import { z } from "zod";
import type { WebhookType } from "@/db/schema";

/**
 * Validates an AoC leaderboard URL
 * Expected format: https://adventofcode.com/YEAR/leaderboard/private/view/ID?view_key=KEY
 */
export function validateLeaderboardUrl(url: string): {
  valid: boolean;
  error?: string;
  viewKey?: string;
  leaderboardId?: string;
  year?: string;
} {
  try {
    const parsed = new URL(url);

    // Check hostname
    if (parsed.hostname !== "adventofcode.com") {
      return { valid: false, error: "URL must be from adventofcode.com" };
    }

    // Check path format: /YEAR/leaderboard/private/view/ID
    const pathMatch = parsed.pathname.match(
      /^\/(\d{4})\/leaderboard\/private\/view\/(\d+)$/
    );
    if (!pathMatch) {
      return {
        valid: false,
        error: "Invalid leaderboard URL path format",
      };
    }

    const [, year, leaderboardId] = pathMatch;

    // Check for view_key
    const viewKey = parsed.searchParams.get("view_key");
    if (!viewKey) {
      return {
        valid: false,
        error: "URL must include a view_key parameter",
      };
    }

    return {
      valid: true,
      viewKey,
      leaderboardId,
      year,
    };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}

/**
 * Detects the webhook type from a URL
 * Returns "discord", "slack", or null if unrecognized
 */
export function detectWebhookType(url: string): WebhookType | null {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;

    if (hostname === "discord.com" || hostname === "discordapp.com") {
      return "discord";
    }

    if (hostname === "hooks.slack.com") {
      return "slack";
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Validates a Discord webhook URL
 * Expected format: https://discord.com/api/webhooks/ID/TOKEN or https://discordapp.com/api/webhooks/ID/TOKEN
 */
export function validateDiscordWebhookUrl(url: string): {
  valid: boolean;
  error?: string;
} {
  try {
    const parsed = new URL(url);

    // Check hostname
    if (
      parsed.hostname !== "discord.com" &&
      parsed.hostname !== "discordapp.com"
    ) {
      return {
        valid: false,
        error: "URL must be from discord.com or discordapp.com",
      };
    }

    // Check path format: /api/webhooks/ID/TOKEN
    const pathMatch = parsed.pathname.match(/^\/api\/webhooks\/\d+\/[\w-]+$/);
    if (!pathMatch) {
      return {
        valid: false,
        error: "Invalid Discord webhook URL format",
      };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}

/**
 * Validates a Slack webhook URL
 * Expected format: https://hooks.slack.com/services/T.../B.../...
 */
export function validateSlackWebhookUrl(url: string): {
  valid: boolean;
  error?: string;
} {
  try {
    const parsed = new URL(url);

    // Check hostname
    if (parsed.hostname !== "hooks.slack.com") {
      return {
        valid: false,
        error: "URL must be from hooks.slack.com",
      };
    }

    // Check path format: /services/T.../B.../...
    const pathMatch = parsed.pathname.match(/^\/services\/T[A-Z0-9]+\/B[A-Z0-9]+\/[A-Za-z0-9]+$/);
    if (!pathMatch) {
      return {
        valid: false,
        error: "Invalid Slack webhook URL format",
      };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}

/**
 * Validates a webhook URL (Discord or Slack)
 * Returns the validation result and detected type
 */
export function validateWebhookUrl(url: string): {
  valid: boolean;
  error?: string;
  type?: WebhookType;
} {
  const detectedType = detectWebhookType(url);

  if (!detectedType) {
    return {
      valid: false,
      error: "URL must be a Discord or Slack webhook URL",
    };
  }

  if (detectedType === "discord") {
    const result = validateDiscordWebhookUrl(url);
    return { ...result, type: detectedType };
  }

  if (detectedType === "slack") {
    const result = validateSlackWebhookUrl(url);
    return { ...result, type: detectedType };
  }

  return { valid: false, error: "Unknown webhook type" };
}

/**
 * Validates a Discord role ID (snowflake format)
 */
export function validateDiscordRoleId(roleId: string): {
  valid: boolean;
  error?: string;
} {
  // Discord snowflakes are 17-19 digit numbers
  if (!/^\d{17,19}$/.test(roleId)) {
    return {
      valid: false,
      error: "Invalid Discord role ID format (must be 17-19 digits)",
    };
  }
  return { valid: true };
}

// Zod schemas for API validation
export const webhookCreateSchema = z.object({
  webhookUrl: z.string().url().refine(
    (url) => validateWebhookUrl(url).valid,
    { message: "Invalid webhook URL (must be Discord or Slack)" }
  ),
  type: z.enum(["discord", "slack"]),
  roleId: z
    .string()
    .optional()
    .refine(
      (val) => !val || validateDiscordRoleId(val).valid,
      { message: "Invalid Discord role ID" }
    ),
  pingChannel: z.boolean().optional(),
  hours: z
    .array(z.number().min(0).max(23))
    .min(1, "Select at least one hour"),
  leaderboardUrl: z.string().url().refine(
    (url) => validateLeaderboardUrl(url).valid,
    { message: "Invalid AoC leaderboard URL or missing view_key" }
  ),
  puzzleNotificationHour: z
    .number()
    .min(-1)
    .max(23)
    .optional()
    .transform((val) => (val === -1 ? null : val)), // -1 means disabled
});

export const webhookUpdateSchema = webhookCreateSchema.partial();

export type WebhookCreateInput = z.infer<typeof webhookCreateSchema>;
export type WebhookUpdateInput = z.infer<typeof webhookUpdateSchema>;

