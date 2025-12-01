"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function formatHour(hour: number): string {
  if (hour === 0) return "12am";
  if (hour === 12) return "12pm";
  if (hour < 12) return `${hour}am`;
  return `${hour - 12}pm`;
}

interface WebhookData {
  id: string;
  discordWebhookUrl: string;
  roleId: string | null;
  hours: number[];
  leaderboardUrl: string;
  puzzleNotificationHour: number | null;
}

export default function EditPage() {
  const router = useRouter();
  const [lookupUrl, setLookupUrl] = useState("");
  const [isLooking, setIsLooking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [webhookData, setWebhookData] = useState<WebhookData | null>(null);

  const [formData, setFormData] = useState({
    roleId: "",
    hours: [] as number[],
    leaderboardUrl: "",
    puzzleNotificationHour: 0 as number,
  });

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLooking(true);
    setError(null);
    setWebhookData(null);

    try {
      const response = await fetch(
        `/api/webhooks/lookup?url=${encodeURIComponent(lookupUrl)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Subscription not found");
      }

      setWebhookData(data);
      setFormData({
        roleId: data.roleId || "",
        hours: data.hours,
        leaderboardUrl: data.leaderboardUrl,
        puzzleNotificationHour: data.puzzleNotificationHour ?? 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLooking(false);
    }
  };

  const toggleHour = (hour: number) => {
    setFormData((prev) => ({
      ...prev,
      hours: prev.hours.includes(hour)
        ? prev.hours.filter((h) => h !== hour)
        : [...prev.hours, hour].sort((a, b) => a - b),
    }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookData) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/webhooks/${webhookData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update subscription");
      }

      setSuccess("Subscription updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!webhookData) return;
    if (!confirm("Are you sure you want to delete this subscription?")) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/webhooks/${webhookData.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete subscription");
      }

      setSuccess("Subscription deleted!");
      setTimeout(() => router.push("/"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-gold text-lg">--- Edit / View Subscription ---</h1>
        <p className="text-foreground/70 mt-2">
          Enter your Discord webhook URL to look up and edit your subscription.
        </p>
      </div>

      {error && (
        <div className="border border-red-500 bg-red-500/10 p-3 text-red-400">
          Error: {error}
        </div>
      )}

      {success && (
        <div className="border border-green bg-green/10 p-3 text-green">
          {success}
        </div>
      )}

      {/* Lookup Form */}
      {!webhookData && (
        <form onSubmit={handleLookup} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-silver">Discord Webhook URL</label>
            <input
              type="url"
              required
              value={lookupUrl}
              onChange={(e) => setLookupUrl(e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
              className="w-full bg-input-bg border border-input-border px-3 py-2 text-foreground placeholder:text-foreground/30 focus:border-green focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isLooking}
            className="border border-green px-4 py-2 hover:bg-green hover:text-background transition-colors disabled:opacity-50"
          >
            {isLooking ? "[Looking up...]" : "[Look Up]"}
          </button>
        </form>
      )}

      {/* Edit Form */}
      {webhookData && (
        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="border border-input-border p-3 bg-input-bg/50">
            <p className="text-foreground/50 text-sm">Webhook:</p>
            <p className="text-green text-xs break-all">
              {webhookData.discordWebhookUrl}
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
          </div>

          {/* Leaderboard URL */}
          <div className="space-y-2">
            <label className="block text-silver">Leaderboard URL</label>
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
          </div>

          {/* Puzzle Notification */}
          <div className="space-y-2">
            <label className="block text-silver">
              New Puzzle Notification (Eastern Time)
            </label>
            <select
              value={formData.puzzleNotificationHour ?? -1}
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
              Leaderboard Update Notification Hours (Eastern Time)
            </label>
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
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex flex-wrap gap-4">
            <button
              type="submit"
              disabled={isSubmitting || formData.hours.length === 0}
              className="border border-green px-4 py-2 hover:bg-green hover:text-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "[Updating...]" : "[Update Subscription]"}
            </button>
            <button
              type="button"
              onClick={() => {
                setWebhookData(null);
                setLookupUrl("");
              }}
              className="border border-input-border px-4 py-2 hover:border-green transition-colors"
            >
              [Look Up Another]
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="border border-red-500 text-red-400 px-4 py-2 hover:bg-red-500 hover:text-background transition-colors disabled:opacity-50"
            >
              {isDeleting ? "[Deleting...]" : "[Delete]"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
