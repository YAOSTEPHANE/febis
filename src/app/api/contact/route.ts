import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ACTIVITIES } from "@/lib/types";

type ContactBody = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  company?: unknown;
  activity?: unknown;
  message?: unknown;
};

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  let body: ContactBody;

  try {
    body = (await request.json()) as ContactBody;
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const name = asTrimmedString(body.name);
  const email = asTrimmedString(body.email);
  const phone = asTrimmedString(body.phone);
  const company = asTrimmedString(body.company);
  const activityRaw = asTrimmedString(body.activity) || "general";
  const message = asTrimmedString(body.message);

  if (name.length < 2) {
    return NextResponse.json(
      { error: "Le nom doit contenir au moins 2 caractères." },
      { status: 400 },
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email invalide." }, { status: 400 });
  }

  if (message.length < 10) {
    return NextResponse.json(
      { error: "Le message doit contenir au moins 10 caractères." },
      { status: 400 },
    );
  }

  const allowedActivities = ["general", ...ACTIVITIES] as const;
  const activity = allowedActivities.includes(
    activityRaw as (typeof allowedActivities)[number],
  )
    ? activityRaw
    : "general";

  try {
    const db = await getDb();
    await db.collection("contacts").insertOne({
      name,
      email: email.toLowerCase(),
      phone: phone || null,
      company: company || null,
      activity,
      message,
      createdAt: new Date(),
      source: "site-vitrine",
    });

    // CRM transversal : client unique partagé (CDC §4.6)
    const clientEmail = email.toLowerCase();
    const clients = db.collection<{
      email: string;
      name: string;
      phone: string | null;
      company: string | null;
      createdAt: Date;
      updatedAt: Date;
      interactions: Array<{
        type: string;
        activity: string;
        message: string;
        at: Date;
      }>;
    }>("clients");

    await clients.updateOne(
      { email: clientEmail },
      {
        $set: {
          name,
          email: clientEmail,
          phone: phone || null,
          company: company || null,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
        $push: {
          interactions: {
            type: "contact_form",
            activity,
            message,
            at: new Date(),
          },
        },
      },
      { upsert: true },
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Contact API error:", error);
    return NextResponse.json(
      {
        error:
          "Impossible d’enregistrer le message. Vérifiez la connexion MongoDB.",
      },
      { status: 503 },
    );
  }
}
