import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  convertQuoteToContract,
  getBtpProject,
  updateBtpProject,
} from "@/lib/btp-data";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await context.params;
  const project = await getBtpProject(id);
  if (!project) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  return NextResponse.json({ project });
}

export async function PATCH(request: NextRequest, context: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await context.params;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  try {
    if (body.action === "convert_contract") {
      const project = await convertQuoteToContract(
        id,
        typeof body.contractAmount === "number"
          ? body.contractAmount
          : Number(body.contractAmount) || undefined,
      );
      if (!project) {
        return NextResponse.json({ error: "Introuvable" }, { status: 404 });
      }
      return NextResponse.json({ project });
    }

    const project = await updateBtpProject(id, {
      title: typeof body.title === "string" ? body.title : undefined,
      clientName:
        typeof body.clientName === "string" ? body.clientName : undefined,
      clientEmail:
        typeof body.clientEmail === "string" ? body.clientEmail : undefined,
      clientPhone:
        typeof body.clientPhone === "string" ? body.clientPhone : undefined,
      clientCompany:
        typeof body.clientCompany === "string" ? body.clientCompany : undefined,
      location: typeof body.location === "string" ? body.location : undefined,
      description:
        typeof body.description === "string" ? body.description : undefined,
      step: typeof body.step === "string" ? body.step : undefined,
      quoteAmount:
        body.quoteAmount !== undefined ? Number(body.quoteAmount) : undefined,
      contractAmount:
        body.contractAmount !== undefined
          ? Number(body.contractAmount)
          : undefined,
      progressPercent:
        body.progressPercent !== undefined
          ? Number(body.progressPercent)
          : undefined,
      startDate: typeof body.startDate === "string" ? body.startDate : undefined,
      expectedEndDate:
        typeof body.expectedEndDate === "string"
          ? body.expectedEndDate
          : undefined,
      deliveredAt:
        body.deliveredAt === null
          ? null
          : typeof body.deliveredAt === "string"
            ? body.deliveredAt
            : undefined,
      notes: typeof body.notes === "string" ? body.notes : undefined,
      cancelled:
        typeof body.cancelled === "boolean" ? body.cancelled : undefined,
    });

    if (!project) {
      return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    }
    return NextResponse.json({ project });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Mise à jour impossible",
      },
      { status: 400 },
    );
  }
}
