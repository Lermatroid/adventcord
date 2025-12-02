import { NextRequest, NextResponse } from "next/server";
import { db, webhooks } from "@/db";
import { eq } from "drizzle-orm";
import { validateWebhookUrl } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "Missing webhook URL parameter" },
        { status: 400 }
      );
    }

    // Validate URL format (supports both Discord and Slack)
    const validation = validateWebhookUrl(url);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Look up webhook
    const webhook = await db.query.webhooks.findFirst({
      where: eq(webhooks.webhookUrl, url),
    });

    if (!webhook) {
      return NextResponse.json(
        { error: "No subscription found for this webhook URL" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: webhook.id,
      webhookUrl: webhook.webhookUrl,
      type: webhook.type,
      roleId: webhook.roleId,
      pingChannel: webhook.pingChannel,
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
