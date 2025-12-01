import { NextRequest, NextResponse } from "next/server";
import { db, webhooks } from "@/db";
import { eq } from "drizzle-orm";
import { validateDiscordWebhookUrl } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const webhookUrl = searchParams.get("url");

    if (!webhookUrl) {
      return NextResponse.json(
        { error: "Missing webhook URL parameter" },
        { status: 400 }
      );
    }

    // Validate URL format
    const validation = validateDiscordWebhookUrl(webhookUrl);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Look up webhook
    const webhook = await db.query.webhooks.findFirst({
      where: eq(webhooks.discordWebhookUrl, webhookUrl),
    });

    if (!webhook) {
      return NextResponse.json(
        { error: "No subscription found for this webhook URL" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: webhook.id,
      discordWebhookUrl: webhook.discordWebhookUrl,
      roleId: webhook.roleId,
      hours: JSON.parse(webhook.hours),
      leaderboardUrl: webhook.leaderboardUrl,
      puzzleNotificationHour: webhook.puzzleNotificationHour,
      createdAt: webhook.createdAt,
      updatedAt: webhook.updatedAt,
    });
  } catch (error) {
    console.error("Error looking up webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

