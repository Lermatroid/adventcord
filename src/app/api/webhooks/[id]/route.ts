import { NextRequest, NextResponse } from "next/server";
import { db, webhooks } from "@/db";
import { webhookUpdateSchema } from "@/lib/validation";
import { eq } from "drizzle-orm";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const webhook = await db.query.webhooks.findFirst({
      where: eq(webhooks.id, id),
    });

    if (!webhook) {
      return NextResponse.json(
        { error: "Webhook not found" },
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
    console.error("Error fetching webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    // Validate input
    const result = webhookUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    // Check if webhook exists
    const existing = await db.query.webhooks.findFirst({
      where: eq(webhooks.id, id),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Webhook not found" },
        { status: 404 }
      );
    }

    // Build update object
    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (result.data.discordWebhookUrl !== undefined) {
      updates.discordWebhookUrl = result.data.discordWebhookUrl;
    }
    if (result.data.roleId !== undefined) {
      updates.roleId = result.data.roleId || null;
    }
    if (result.data.hours !== undefined) {
      updates.hours = JSON.stringify(result.data.hours);
    }
    if (result.data.leaderboardUrl !== undefined) {
      updates.leaderboardUrl = result.data.leaderboardUrl;
    }
    if (result.data.puzzleNotificationHour !== undefined) {
      updates.puzzleNotificationHour = result.data.puzzleNotificationHour;
    }

    await db.update(webhooks).set(updates).where(eq(webhooks.id, id));

    return NextResponse.json({
      message: "Webhook subscription updated successfully",
    });
  } catch (error) {
    console.error("Error updating webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    // Check if webhook exists
    const existing = await db.query.webhooks.findFirst({
      where: eq(webhooks.id, id),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Webhook not found" },
        { status: 404 }
      );
    }

    await db.delete(webhooks).where(eq(webhooks.id, id));

    return NextResponse.json({
      message: "Webhook subscription deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

