import { fetcher } from "./fetch";
import {
  type AocLeaderboard,
  sortLeaderboard,
  formatPosition,
  getMemberName,
} from "./aoc";

export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  footer?: {
    text: string;
  };
  timestamp?: string;
}

export interface DiscordWebhookPayload {
  content?: string;
  embeds?: DiscordEmbed[];
  username?: string;
  avatar_url?: string;
}

export interface SendWebhookResult {
  success: boolean;
  error?: string;
  webhookDeleted?: boolean;
}

/**
 * Sends a message to a Discord webhook
 */
export async function sendDiscordWebhook(
  webhookUrl: string,
  payload: DiscordWebhookPayload
): Promise<SendWebhookResult> {
  try {
    const response = await fetcher(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // Check if webhook was deleted (404 Not Found)
    if (response.error) {
      // Access the status from the error if available
      const status = (response.error as { status?: number }).status;
      if (status === 404) {
        return {
          success: false,
          error: "Webhook not found (deleted)",
          webhookDeleted: true,
        };
      }
      return {
        success: false,
        error: `Discord API error: ${response.error.message}`,
      };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: `Failed to send webhook: ${err instanceof Error ? err.message : "Unknown error"}`,
    };
  }
}

/**
 * Formats leaderboard data as a Discord embed
 */
export function formatLeaderboardEmbed(
  leaderboard: AocLeaderboard,
  roleId?: string | null,
  joinCode?: string | null
): DiscordWebhookPayload {
  const sorted = sortLeaderboard(leaderboard);
  const topMembers = sorted.slice(0, 15); // Show top 15

  const leaderboardText = topMembers
    .map((member, index) => {
      const position = formatPosition(index + 1);
      const name = getMemberName(member);
      return `${position} **${name}** - ${member.local_score} pts (⭐ ${member.stars})`;
    })
    .join("\n");

  const totalParticipants = Object.keys(leaderboard.members).length;
  const activeParticipants = sorted.length;

  const fields: DiscordEmbed["fields"] = [
    {
      name: "📊 Stats",
      value: `${activeParticipants} active / ${totalParticipants} total participants`,
      inline: true,
    },
  ];

  if (joinCode) {
    fields.push({
      name: "🔗 Join Code",
      value: `\`${joinCode}\``,
      inline: true,
    });
  }

  const embed: DiscordEmbed = {
    title: `🎄 Advent of Code ${leaderboard.event} Leaderboard`,
    description: leaderboardText || "No participants with stars yet!",
    color: 0x0f9d58, // Green color
    fields,
    footer: {
      text: "Updated",
    },
    timestamp: new Date().toISOString(),
  };

  const content = roleId ? `<@&${roleId}>` : undefined;

  return {
    content,
    embeds: [embed],
    username: "Adventcord",
  };
}

/**
 * Sends a test message to verify webhook ownership
 */
export async function sendTestWebhook(
  webhookUrl: string
): Promise<SendWebhookResult> {
  return sendDiscordWebhook(webhookUrl, {
    embeds: [
      {
        title: "🎄 Adventcord - Test Message",
        description:
          "Your webhook is configured correctly! You'll receive leaderboard updates at your scheduled times.",
        color: 0x0f9d58,
        timestamp: new Date().toISOString(),
      },
    ],
    username: "Adventcord",
  });
}

/**
 * Formats a new puzzle notification embed
 */
export function formatPuzzleNotificationEmbed(
  day: number,
  year: number,
  roleId?: string | null
): DiscordWebhookPayload {
  const puzzleUrl = `https://adventofcode.com/${year}/day/${day}`;

  const embed: DiscordEmbed = {
    title: `🎄 Day ${day} is Live!`,
    description: `A new Advent of Code puzzle has been released!\n\n**[Click here to start Day ${day}](${puzzleUrl})**\n\nGood luck and have fun! ⭐`,
    color: 0xffff66, // Gold color for new puzzles
    footer: {
      text: `Advent of Code ${year}`,
    },
    timestamp: new Date().toISOString(),
  };

  const content = roleId ? `<@&${roleId}>` : undefined;

  return {
    content,
    embeds: [embed],
    username: "Adventcord",
  };
}

