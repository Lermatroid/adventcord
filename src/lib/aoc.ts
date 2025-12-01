import { fetcher } from "./fetch";
import { validateLeaderboardUrl } from "./validation";

export interface AocMember {
  id: number;
  name: string | null;
  stars: number;
  local_score: number;
  global_score: number;
  last_star_ts: number;
  completion_day_level: Record<
    string,
    {
      1?: { get_star_ts: number };
      2?: { get_star_ts: number };
    }
  >;
}

export interface AocLeaderboard {
  event: string;
  owner_id: number;
  members: Record<string, AocMember>;
}

/**
 * Fetches leaderboard data from Advent of Code
 */
export async function fetchLeaderboard(
  leaderboardUrl: string
): Promise<{ data?: AocLeaderboard; error?: string }> {
  const validation = validateLeaderboardUrl(leaderboardUrl);
  if (!validation.valid) {
    return { error: validation.error };
  }

  // Convert to JSON endpoint
  const url = new URL(leaderboardUrl);
  const jsonUrl = `https://adventofcode.com${url.pathname}.json?view_key=${validation.viewKey}`;

  try {
    const { data, error } = await fetcher<AocLeaderboard>(jsonUrl, {
      headers: {
        // AoC asks for identification in user-agent
        "User-Agent": "Adventcord (github.com/your-repo)",
      },
    });

    if (error) {
      return { error: `Failed to fetch leaderboard: ${error.message}` };
    }

    return { data };
  } catch (err) {
    return {
      error: `Failed to fetch leaderboard: ${err instanceof Error ? err.message : "Unknown error"}`,
    };
  }
}

/**
 * Sorts leaderboard members by local score (descending)
 */
export function sortLeaderboard(leaderboard: AocLeaderboard): AocMember[] {
  return Object.values(leaderboard.members)
    .filter((member) => member.stars > 0)
    .sort((a, b) => b.local_score - a.local_score);
}

/**
 * Formats a leaderboard position for display
 */
export function formatPosition(position: number): string {
  if (position === 1) return "🥇";
  if (position === 2) return "🥈";
  if (position === 3) return "🥉";
  return `${position}.`;
}

/**
 * Gets display name for a member (handles anonymous users)
 */
export function getMemberName(member: AocMember): string {
  return member.name || `(anonymous user #${member.id})`;
}

