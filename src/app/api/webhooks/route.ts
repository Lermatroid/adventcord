import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db, webhooks } from "@/db";
import { webhookCreateSchema } from "@/lib/validation";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const result = webhookCreateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { webhookUrl, type, roleId, pingChannel, hours, leaderboardUrl, puzzleNotificationHour } = result.data;

    // Check if webhook already exists
    const existing = await db.query.webhooks.findFirst({
      where: eq(webhooks.webhookUrl, webhookUrl),
    });

    if (existing) {
      return NextResponse.json(
        { error: "A subscription for this webhook URL already exists" },
        { status: 409 }
      );
    }

    // Create new webhook subscription
    const now = new Date();
    const newWebhook = {
      id: nanoid(),
      webhookUrl,
      type,
      roleId: type === "discord" ? (roleId || null) : null,
      pingChannel: type === "slack" ? (pingChannel || false) : null,
      hours: JSON.stringify(hours),
      leaderboardUrl,
      puzzleNotificationHour: puzzleNotificationHour ?? 0, // Default to midnight EST
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(webhooks).values(newWebhook);

    return NextResponse.json(
      {
        id: newWebhook.id,
        message: "Webhook subscription created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
