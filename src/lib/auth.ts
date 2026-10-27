import { cookies } from "next/headers";
import type { Role } from "@/lib/types";
import {
  SESSION_COOKIE_NAME,
  createSessionToken,
  verifySessionToken,
  type SessionPayload,
} from "@/lib/session-token";

export {
  SESSION_COOKIE_NAME,
  createSessionToken,
  verifySessionToken,
  type SessionPayload,
};

const COOKIE_NAME = SESSION_COOKIE_NAME;

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function roleLabel(role: Role): string {
  switch (role) {
    case "admin":
      return "Admin";
    case "direction":
      return "Direction";
    case "compta":
      return "Compta";
    case "operationnels":
      return "Opérationnels";
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
}
