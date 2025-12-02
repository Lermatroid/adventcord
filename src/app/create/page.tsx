"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

type WebhookType = "discord" | "slack" | null;

function formatHour(hour: number): string {
  if (hour === 0) return "12am";
  if (hour === 12) return "12pm";
  if (hour < 12) return `${hour}am`;
  return `${hour - 12}pm`;
}

function detectWebhookType(url: string): WebhookType {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "discord.com" || parsed.hostname === "discordapp.com") {
      return "discord";
    }
    if (parsed.hostname === "hooks.slack.com") {
      return "slack";
    }
    return null;
  } catch {
    return null;
  }
}

export default function CreatePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    webhookUrl: "",
    roleId: "",
    pingChannel: false,
    hours: [] as number[],
    leaderboardUrl: "",
    puzzleNotificationHour: 0, // Default to midnight (release time)
  });

  const webhookType = useMemo(
    () => detectWebhookType(formData.webhookUrl),
    [formData.webhookUrl]
  );

  const toggleHour = (hour: number) => {
    setFormData((prev) => ({
      ...prev,
      hours: prev.hours.includes(hour)
        ? prev.hours.filter((h) => h !== hour)
        : [...prev.hours, hour].sort((a, b) => a - b),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!webhookType) {
      setError("Please enter a valid Discord or Slack webhook URL");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhookUrl: formData.webhookUrl,
          type: webhookType,
          roleId: webhookType === "discord" ? formData.roleId : undefined,
          pingChannel: webhookType === "slack" ? formData.pingChannel : undefined,
          hours: formData.hours,
          leaderboardUrl: formData.leaderboardUrl,
          puzzleNotificationHour: formData.puzzleNotificationHour,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create subscription");
      }

      setSuccess(true);
      setTimeout(() => router.push("/"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-4">
        <pre className="text-green">
          {`
  *  SUCCESS!  *
  
  Your subscription has been created.
  You'll receive leaderboard updates at your scheduled times.
  
  Redirecting...
          `}
        </pre>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-gold text-lg">--- Create Subscription ---</h1>
        <p className="text-foreground/70 mt-2">
          Set up Discord or Slack notifications for your AoC leaderboard.
        </p>
      </div>

      {error && (
        <div className="border border-red-500 bg-red-500/10 p-3 text-red-400">
          Error: {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Webhook URL */}
        <div className="space-y-2">
          <label className="block text-silver">
            Webhook URL <span className="text-red-400">*</span>
          </label>
          <input
            type="url"
            required
            value={formData.webhookUrl}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                webhookUrl: e.target.value,
              }))
            }
            placeholder="https://discord.com/api/webhooks/... or https://hooks.slack.com/services/..."
            className="w-full bg-input-bg border border-input-border px-3 py-2 text-foreground placeholder:text-foreground/30 focus:border-green focus:outline-none"
          />
          <p className="text-xs text-foreground/50">
            {webhookType === "discord" && (
              <>
                <span className="text-green">Discord detected</span> - Server Settings → Integrations → Webhooks → Copy URL.{" "}
                <Link href="/img/adventcord-icon.png" target="_blank">
                  Need an icon?
                </Link>
              </>
            )}
            {webhookType === "slack" && (
              <>
                <span className="text-green">Slack detected</span> - Apps → Incoming Webhooks → Copy Webhook URL
              </>
            )}
            {!webhookType && formData.webhookUrl && (
              <span className="text-red-400">Unrecognized webhook URL format</span>
            )}
            {!formData.webhookUrl && (
              <>Enter a Discord or Slack webhook URL</>
            )}
          </p>
        </div>

        {/* Discord: Role ID */}
        {webhookType === "discord" && (
          <div className="space-y-2">
            <label className="block text-silver">
              Role ID to Mention{" "}
              <span className="text-foreground/50">(optional)</span>
            </label>
            <input
              type="text"
              value={formData.roleId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, roleId: e.target.value }))
              }
              placeholder="123456789012345678"
              className="w-full bg-input-bg border border-input-border px-3 py-2 text-foreground placeholder:text-foreground/30 focus:border-green focus:outline-none"
            />
            <p className="text-xs text-foreground/50">
              <Link
                target="_blank"
                href="https://discord.com/developers/docs/activities/building-an-activity#step-0-enable-developer-mode"
              >
                Enable Developer Mode
              </Link>{" "}
              → Right-click role → Copy Role ID
            </p>
          </div>
        )}

        {/* Slack: Ping Channel */}
        {webhookType === "slack" && (
          <div className="space-y-2">
            <label className="flex items-center gap-3 text-silver cursor-pointer">
              <input
                type="checkbox"
                checked={formData.pingChannel}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    pingChannel: e.target.checked,
                  }))
                }
                className="w-4 h-4 accent-green"
              />
              Ping channel on updates
            </label>
            <p className="text-xs text-foreground/50">
              When enabled, messages will include @channel to notify all members
            </p>
          </div>
        )}

        {/* Leaderboard URL */}
        <div className="space-y-2">
          <label className="block text-silver">
            Leaderboard URL <span className="text-red-400">*</span>
          </label>
          <input
            type="url"
            required
            value={formData.leaderboardUrl}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                leaderboardUrl: e.target.value,
              }))
            }
            placeholder="https://adventofcode.com/2025/leaderboard/private/view/123?view_key=..."
            className="w-full bg-input-bg border border-input-border px-3 py-2 text-foreground placeholder:text-foreground/30 focus:border-green focus:outline-none"
          />
          <p className="text-xs text-foreground/50">
            Must include the <span className="text-green">view_key</span>{" "}
            parameter
          </p>
        </div>

        {/* Puzzle Notification */}
        <div className="space-y-2">
          <label className="block text-silver">
            New Puzzle Notification (Eastern Time)
          </label>
          <select
            value={formData.puzzleNotificationHour}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                puzzleNotificationHour: parseInt(e.target.value, 10),
              }))
            }
            className="w-full bg-input-bg border border-input-border px-3 py-2 text-foreground focus:border-green focus:outline-none"
          >
            <option value={-1}>Disabled</option>
            <option value={0}>12:00am (puzzle release)</option>
            {HOURS.slice(1).map((hour) => (
              <option key={hour} value={hour}>
                {formatHour(hour)}
              </option>
            ))}
          </select>
          <p className="text-xs text-foreground/50">
            Get notified when a new puzzle is released (Dec 1-25)
          </p>
        </div>

        {/* Leaderboard Update Hours */}
        <div className="space-y-2">
          <label className="block text-silver">
            Leaderboard Update Notification Hours (Eastern Time){" "}
            <span className="text-red-400">*</span>
          </label>
          <p className="text-xs text-foreground/50 mb-3">
            Select when you want to receive leaderboard standings
          </p>
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-1">
            {HOURS.map((hour) => (
              <button
                key={hour}
                type="button"
                onClick={() => toggleHour(hour)}
                className={`px-2 py-1 text-xs border transition-colors ${
                  formData.hours.includes(hour)
                    ? "border-green bg-green text-background"
                    : "border-input-border hover:border-green"
                }`}
              >
                {formatHour(hour)}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({ ...prev, hours: [...HOURS] }))
              }
              className="text-xs text-green hover:text-link-hover"
            >
              [Select All]
            </button>
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, hours: [] }))}
              className="text-xs text-green hover:text-link-hover"
            >
              [Clear]
            </button>
            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({ ...prev, hours: [0, 6, 12, 18] }))
              }
              className="text-xs text-green hover:text-link-hover"
            >
              [Every 6h]
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting || formData.hours.length === 0 || !webhookType}
            className="border border-green px-4 py-2 hover:bg-green hover:text-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "[Creating...]" : "[Create Subscription]"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="border border-input-border px-4 py-2 hover:border-green transition-colors"
          >
            [Cancel]
          </button>
        </div>
      </form>
    </div>
  );
}
