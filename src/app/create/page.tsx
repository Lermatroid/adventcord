"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function formatHour(hour: number): string {
  if (hour === 0) return "12am";
  if (hour === 12) return "12pm";
  if (hour < 12) return `${hour}am`;
  return `${hour - 12}pm`;
}

export default function CreatePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    discordWebhookUrl: "",
    roleId: "",
    hours: [] as number[],
    leaderboardUrl: "",
    puzzleNotificationHour: 0, // Default to midnight (release time)
  });

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

    try {
      const response = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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
          Set up Discord notifications for your AoC leaderboard.
        </p>
      </div>

      {error && (
        <div className="border border-red-500 bg-red-500/10 p-3 text-red-400">
          Error: {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Discord Webhook URL */}
        <div className="space-y-2">
          <label className="block text-silver">
            Discord Webhook URL <span className="text-red-400">*</span>
          </label>
          <input
            type="url"
            required
            value={formData.discordWebhookUrl}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                discordWebhookUrl: e.target.value,
              }))
            }
            placeholder="https://discord.com/api/webhooks/..."
            className="w-full bg-input-bg border border-input-border px-3 py-2 text-foreground placeholder:text-foreground/30 focus:border-green focus:outline-none"
          />
          <p className="text-xs text-foreground/50">
            Server Settings → Integrations → Webhooks → Copy URL.{" "}
            <Link href="/img/adventcord-icon.png" target="_blank">
              Need a icon?
            </Link>
          </p>
        </div>

        {/* Role ID */}
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
            disabled={isSubmitting || formData.hours.length === 0}
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
