import { NextRequest, NextResponse } from "next/server";
import { ensureDailyBackup } from "@/lib/backup";
import { runAutomaticNotificationScans } from "@/lib/notifications";

/**
 * Cron quotidien — header `Authorization: Bearer <CRON_SECRET>`
 * ou `x-cron-secret: <CRON_SECRET>`.
 * Sans secret en local, autorisé uniquement hors production.
 */
export async function POST(request: NextRequest) {
  const configured = process.env.CRON_SECRET?.trim();
  const auth =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ||
    request.headers.get("x-cron-secret")?.trim() ||
    "";

  const isProd = process.env.NODE_ENV === "production";
  if (configured) {
    if (auth !== configured) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
  } else if (isProd) {
    return NextResponse.json(
      { error: "CRON_SECRET requis en production" },
      { status: 401 },
    );
  }

  const [backup, scans] = await Promise.all([
    ensureDailyBackup("cron-daily"),
    runAutomaticNotificationScans(),
  ]);

  return NextResponse.json({
    ok: true,
    backup: backup
      ? { id: backup.id, createdAt: backup.createdAt, label: backup.label }
      : null,
    stockAlerts: scans.stock.length,
    dueAlerts: scans.due.length,
    at: new Date().toISOString(),
  });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
