import { fetcher } from "./fetch";
import {
  type AocLeaderboard,
  sortLeaderboard,
  formatPosition,
  getMemberName,
} from "./aoc";

export interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
    emoji?: boolean;
  };
  elements?: Array<{
    type: string;
    text?: string;
    emoji?: boolean;
  }>;
  accessory?: {
    type: string;
    text?: {
      type: string;
      text: string;
      emoji?: boolean;
    };
    url?: string;
  };
}

export interface SlackWebhookPayload {
  text?: string;
  blocks?: SlackBlock[];
  username?: string;
  icon_emoji?: string;
}

export interface SendWebhookResult {
  success: boolean;
  error?: string;
  webhookDeleted?: boolean;
}

/**
 * Sends a message to a Slack webhook
 */
export async function sendSlackWebhook(
  webhookUrl: string,
  payload: SlackWebhookPayload
): Promise<SendWebhookResult> {
  try {
    const response = await fetcher(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // Check if webhook was deleted or invalid
    if (response.error) {
      const status = (response.error as { status?: number }).status;
      if (status === 404 || status === 410) {
        return {
          success: false,
          error: "Webhook not found (deleted or invalid)",
          webhookDeleted: true,
        };
      }
      return {
        success: false,
        error: `Slack API error: ${response.error.message}`,
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
 * Formats leaderboard data as a Slack message with blocks
 */
export function formatLeaderboardSlackMessage(
  leaderboard: AocLeaderboard,
  pingChannel?: boolean,
  joinCode?: string | null
): SlackWebhookPayload {
  const sorted = sortLeaderboard(leaderboard);
  const topMembers = sorted.slice(0, 15); // Show top 15

  const leaderboardText = topMembers
    .map((member, index) => {
      const position = formatPosition(index + 1);
      const name = getMemberName(member);
      return `${position} *${name}* - ${member.local_score} pts (:star: ${member.stars})`;
    })
    .join("\n");

  const totalParticipants = Object.keys(leaderboard.members).length;
  const activeParticipants = sorted.length;

  const contextElements: SlackBlock["elements"] = [
    {
      type: "mrkdwn",
      text: `📊 ${activeParticipants} active / ${totalParticipants} total participants`,
    },
  ];

  if (joinCode) {
    contextElements.push({
      type: "mrkdwn",
      text: `🔗 Join code: \`${joinCode}\``,
    });
  }

  contextElements.push({
    type: "mrkdwn",
    text: `Updated: <!date^${Math.floor(Date.now() / 1000)}^{date_short_pretty} at {time}|${new Date().toISOString()}>`,
  });

  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `🎄 Advent of Code ${leaderboard.event} Leaderboard`,
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: leaderboardText || "_No participants with stars yet!_",
      },
    },
    {
      type: "context",
      elements: contextElements,
    },
  ];

  const text = pingChannel
    ? `<!channel> Advent of Code ${leaderboard.event} Leaderboard Update`
    : `Advent of Code ${leaderboard.event} Leaderboard Update`;

  return {
    text,
    blocks,
    username: "Adventcord",
    icon_emoji: ":christmas_tree:",
  };
}

/**
 * Sends a test message to verify Slack webhook
 */
export async function sendTestSlackWebhook(
  webhookUrl: string
): Promise<SendWebhookResult> {
  return sendSlackWebhook(webhookUrl, {
    text: "Adventcord - Test Message",
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🎄 Adventcord - Test Message",
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Your webhook is configured correctly! You'll receive leaderboard updates at your scheduled times.",
        },
      },
    ],
    username: "Adventcord",
    icon_emoji: ":christmas_tree:",
  });
}

/**
 * Formats a new puzzle notification for Slack
 */
export function formatPuzzleNotificationSlackMessage(
  day: number,
  year: number,
  pingChannel?: boolean
): SlackWebhookPayload {
  const puzzleUrl = `https://adventofcode.com/${year}/day/${day}`;

  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `🎄 Day ${day} is Live!`,
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `A new Advent of Code puzzle has been released!\n\n*<${puzzleUrl}|Click here to start Day ${day}>*\n\nGood luck and have fun! :star:`,
      },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `Advent of Code ${year}`,
        },
      ],
    },
  ];

  const text = pingChannel
    ? `<!channel> Day ${day} of Advent of Code ${year} is now live!`
    : `Day ${day} of Advent of Code ${year} is now live!`;

  return {
    text,
    blocks,
    username: "Adventcord",
    icon_emoji: ":christmas_tree:",
  };
}

