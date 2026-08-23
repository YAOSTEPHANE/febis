import { redirect } from "next/navigation";
import { getSession, type SessionPayload } from "@/lib/auth";

export async function requireAdminSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    redirect("/admin");
  }
  return session;
}

export function assertApiSession(session: SessionPayload | null): session is SessionPayload {
  return session !== null;
}
