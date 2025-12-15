/**
 * Advent of Code Season Configuration
 *
 * Configure via environment variables:
 * - NEXT_PUBLIC_AOC_START_DAY: First day of puzzles (default: 1)
 * - NEXT_PUBLIC_AOC_END_DAY: Last day of puzzles (default: 12)
 * - NEXT_PUBLIC_AOC_MONTH: Month of the event (default: 12 for December)
 *
 * Use NEXT_PUBLIC_ prefix so these work in both client and server components.
 * The cron script also reads these (runs in Node.js context).
 */

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

export const AOC_CONFIG = {
  /** Start day of the event (inclusive) */
  startDay: getEnvNumber("NEXT_PUBLIC_AOC_START_DAY", 1),

  /** End day of the event (inclusive) */
  endDay: getEnvNumber("NEXT_PUBLIC_AOC_END_DAY", 12),

  /** Month of the event (12 = December) */
  month: getEnvNumber("NEXT_PUBLIC_AOC_MONTH", 12),
} as const;

/**
 * Checks if a given date is during the Advent of Code puzzle release period
 * (when new puzzles are being released)
 */
export function isAocPuzzleSeason(month: number, day: number): boolean {
  return (
    month === AOC_CONFIG.month &&
    day >= AOC_CONFIG.startDay &&
    day <= AOC_CONFIG.endDay
  );
}

/**
 * Checks if a given date is during the Advent of Code leaderboard season
 * (puzzles + 24 hours after last puzzle for final leaderboard updates)
 */
export function isAocLeaderboardSeason(month: number, day: number): boolean {
  return (
    month === AOC_CONFIG.month &&
    day >= AOC_CONFIG.startDay &&
    day <= AOC_CONFIG.endDay + 1 // +1 day for 24h after last puzzle
  );
}

/**
 * Returns a human-readable date range string for the AoC puzzle season
 * e.g., "Dec 1-12" or "Dec 1-25"
 */
export function getAocDateRangeString(): string {
  const monthName = new Date(2000, AOC_CONFIG.month - 1, 1).toLocaleString(
    "en-US",
    { month: "short" }
  );
  return `${monthName} ${AOC_CONFIG.startDay}-${AOC_CONFIG.endDay}`;
}

/**
 * Validates if a day number is within the AoC puzzle range
 */
export function isValidAocDay(day: number): boolean {
  return day >= AOC_CONFIG.startDay && day <= AOC_CONFIG.endDay;
}
