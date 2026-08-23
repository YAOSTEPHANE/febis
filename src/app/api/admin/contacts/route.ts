import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const db = await getDb();
    const contacts = await db
      .collection("contacts")
      .find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .project({
        name: 1,
        email: 1,
        phone: 1,
        company: 1,
        activity: 1,
        message: 1,
        createdAt: 1,
      })
      .toArray();

    return NextResponse.json({
      contacts: contacts.map((c) => ({
        id: c._id.toString(),
        name: c.name,
        email: c.email,
        phone: c.phone ?? "",
        company: c.company ?? "",
        activity: c.activity ?? "general",
        message: c.message ?? "",
        createdAt:
          c.createdAt instanceof Date
            ? c.createdAt.toISOString()
            : String(c.createdAt ?? ""),
      })),
    });
  } catch {
    return NextResponse.json({ contacts: [] });
  }
}
