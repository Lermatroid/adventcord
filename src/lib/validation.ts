import { z } from "zod";

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
  discordWebhookUrl: z.string().url().refine(
    (url) => validateDiscordWebhookUrl(url).valid,
    { message: "Invalid Discord webhook URL" }
  ),
  roleId: z
    .string()
    .optional()
    .refine(
      (val) => !val || validateDiscordRoleId(val).valid,
      { message: "Invalid Discord role ID" }
    ),
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

