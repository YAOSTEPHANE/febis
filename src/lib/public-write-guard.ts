import { NextResponse } from "next/server";
import {
  clientIp,
  rateLimit,
  rateLimitHeaders,
  type RateLimitResult,
} from "@/lib/rate-limit";

/** Limites par défaut pour les POST publics (par IP / fenêtre). */
export const PUBLIC_WRITE_LIMITS = {
  paymentsInitiate: { limit: 20, windowMs: 60_000 },
  contact: { limit: 10, windowMs: 60_000 },
  btpProspect: { limit: 10, windowMs: 60_000 },
  reservation: { limit: 15, windowMs: 60_000 },
  eventQuote: { limit: 15, windowMs: 60_000 },
  shopOrder: { limit: 15, windowMs: 60_000 },
} as const;

export function guardPublicWrite(
  request: Request,
  bucket: keyof typeof PUBLIC_WRITE_LIMITS,
): { ok: true; result: RateLimitResult } | { ok: false; response: NextResponse } {
  const cfg = PUBLIC_WRITE_LIMITS[bucket];
  const ip = clientIp(request);
  const result = rateLimit(`pw:${bucket}:${ip}`, cfg.limit, cfg.windowMs);
  if (!result.ok) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Trop de requêtes. Réessayez dans un instant." },
        { status: 429, headers: rateLimitHeaders(result) },
      ),
    };
  }
  return { ok: true, result };
}
