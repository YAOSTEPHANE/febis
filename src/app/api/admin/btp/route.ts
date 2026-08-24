import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  createBtpProject,
  getBtpStats,
  listBtpProjects,
} from "@/lib/btp-data";
import { isBtpStep } from "@/lib/btp-shared";
import type { BtpStep } from "@/lib/types";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  if (searchParams.get("tab") === "stats") {
    return NextResponse.json({ stats: await getBtpStats() });
  }

  const projects = await listBtpProjects({
    q: searchParams.get("q") ?? undefined,
    step: searchParams.get("step") ?? undefined,
    includeCancelled: searchParams.get("cancelled") === "1",
  });
  return NextResponse.json({ projects });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const stepRaw = String(body.step ?? "prospect");
  const step: BtpStep | undefined = isBtpStep(stepRaw) ? stepRaw : "prospect";

  try {
    const project = await createBtpProject({
      title: String(body.title ?? ""),
      clientName: String(body.clientName ?? ""),
      clientEmail:
        typeof body.clientEmail === "string" ? body.clientEmail : undefined,
      clientPhone:
        typeof body.clientPhone === "string" ? body.clientPhone : undefined,
      clientCompany:
        typeof body.clientCompany === "string" ? body.clientCompany : undefined,
      location: String(body.location ?? ""),
      description:
        typeof body.description === "string" ? body.description : undefined,
      quoteAmount: Number(body.quoteAmount ?? 0),
      step,
      startDate: typeof body.startDate === "string" ? body.startDate : undefined,
      expectedEndDate:
        typeof body.expectedEndDate === "string"
          ? body.expectedEndDate
          : undefined,
      notes: typeof body.notes === "string" ? body.notes : undefined,
    });
    if (!project) {
      return NextResponse.json(
        { error: "Impossible de créer (MongoDB ?)" },
        { status: 503 },
      );
    }
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Création impossible",
      },
      { status: 400 },
    );
  }
}
