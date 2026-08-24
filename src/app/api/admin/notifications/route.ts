import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import {
  enqueueNotification,
  getNotificationProviderStatus,
  listNotifications,
  scanDueInvoicesAndNotify,
  scanLowStockAndNotify,
} from "@/lib/notifications";
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_EVENTS,
  type NotificationChannel,
  type NotificationEvent,
} from "@/lib/direction-shared";

export async function GET() {
  const session = await getSession();
  if (!session || !can(session, "notifications")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  return NextResponse.json({
    notifications: await listNotifications(80),
    providers: getNotificationProviderStatus(),
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !can(session, "notifications")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  try {
    if (body.action === "scan_stock") {
      const to = String(body.toEmail ?? session.email);
      const result = await scanLowStockAndNotify(
        to,
        typeof body.toPhone === "string" ? body.toPhone : undefined,
      );
      return NextResponse.json({ result });
    }

    if (body.action === "scan_echeances") {
      const to = String(body.toEmail ?? session.email);
      const result = await scanDueInvoicesAndNotify(
        to,
        typeof body.toPhone === "string" ? body.toPhone : undefined,
      );
      return NextResponse.json({ result });
    }

    const channel = String(body.channel ?? "");
    const event = String(body.event ?? "");
    if (!(NOTIFICATION_CHANNELS as readonly string[]).includes(channel)) {
      return NextResponse.json({ error: "Canal invalide" }, { status: 400 });
    }
    if (!(NOTIFICATION_EVENTS as readonly string[]).includes(event)) {
      return NextResponse.json({ error: "Événement invalide" }, { status: 400 });
    }

    const notification = await enqueueNotification({
      channel: channel as NotificationChannel,
      event: event as NotificationEvent,
      to: String(body.to ?? ""),
      subject: String(body.subject ?? "FEBiS"),
      body: String(body.body ?? ""),
    });
    if (!notification) {
      return NextResponse.json({ error: "MongoDB indisponible" }, { status: 503 });
    }
    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur" },
      { status: 400 },
    );
  }
}
