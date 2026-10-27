import { NextRequest, NextResponse } from "next/server";
import { createBtpProject } from "@/lib/btp-data";
import { notifyEvent } from "@/lib/notifications";
import {
  parseHouseSpec,
  parseQuoteLines,
  sumQuoteLines,
} from "@/lib/btp-quote-catalog";
import { guardPublicWrite } from "@/lib/public-write-guard";

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  const guarded = guardPublicWrite(request, "btpProspect");
  if (!guarded.ok) return guarded.response;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const clientName = str(body.clientName);
  const clientEmail = str(body.clientEmail);
  const clientPhone = str(body.clientPhone);
  const location = str(body.location) || "Côte d’Ivoire";
  const workType = str(body.workType) || "Construction maison";
  const description = str(body.message);
  const budget = Number(body.budget ?? 0);
  const houseSpec = parseHouseSpec(body.houseSpec);
  const quoteLines = parseQuoteLines(body.quoteLines);
  const linesTotal = quoteLines ? sumQuoteLines(quoteLines) : 0;

  if (clientName.length < 2) {
    return NextResponse.json({ error: "Nom invalide" }, { status: 400 });
  }
  if (clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }
  if (clientPhone.length < 8) {
    return NextResponse.json({ error: "Téléphone invalide" }, { status: 400 });
  }
  if (quoteLines && quoteLines.length === 0) {
    return NextResponse.json(
      { error: "Ajoutez au moins un lot au devis." },
      { status: 400 },
    );
  }

  const specSummary = houseSpec
    ? `${houseSpec.surfaceM2} m² · ${houseSpec.floors} niveau(x) · ${houseSpec.rooms} pièce(s) · finition ${houseSpec.finishLevel}`
    : "";

  try {
    const project = await createBtpProject({
      title: quoteLines
        ? `Devis maison · ${workType}`
        : `Prospect public · ${workType}`,
      clientName,
      clientEmail: clientEmail || undefined,
      clientPhone,
      location,
      description:
        [
          description,
          specSummary ? `Programme : ${specSummary}` : "",
          quoteLines
            ? `Devis détaillé : ${quoteLines.length} poste(s) · total ${linesTotal.toLocaleString("fr-FR")} FCFA`
            : budget > 0
              ? `Budget indicatif ${budget} FCFA`
              : "",
        ]
          .filter(Boolean)
          .join("\n") || undefined,
      quoteAmount: linesTotal > 0 ? linesTotal : budget > 0 ? budget : 0,
      step: quoteLines ? "devis" : "prospect",
      notes: quoteLines
        ? "Origine : devis chantier maison /btp"
        : "Origine : formulaire public /btp",
      houseSpec,
      quoteLines,
    });

    if (!project) {
      return NextResponse.json(
        { error: "MongoDB indisponible" },
        { status: 503 },
      );
    }

    void notifyEvent({
      event: "echeance",
      fingerprint: `btp-prospect-${project.id}`,
      opsOnly: true,
      subject: `FEBiS — ${quoteLines ? "Devis" : "Prospect"} BTP · ${project.reference}`,
      body: [
        quoteLines
          ? `Nouveau devis chantier maison depuis le site.`
          : `Nouveau prospect BTP depuis le site.`,
        `Réf. ${project.reference}`,
        `Client : ${clientName}`,
        `Tél. : ${clientPhone}`,
        clientEmail ? `Email : ${clientEmail}` : "",
        `Type : ${workType}`,
        `Lieu : ${location}`,
        specSummary ? `Maison : ${specSummary}` : "",
        linesTotal > 0
          ? `Montant devis : ${linesTotal.toLocaleString("fr-FR")} FCFA`
          : "",
        description ? `Message : ${description}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      meta: { projectId: project.id, reference: project.reference },
    }).catch(() => undefined);

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur" },
      { status: 400 },
    );
  }
}
