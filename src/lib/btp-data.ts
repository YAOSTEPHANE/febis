import "server-only";
import { ObjectId, type Db, type Filter } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { linkProjectAndInvoice, touchClient } from "@/lib/crm";
import type { BtpProjectDoc, BtpStep } from "@/lib/types";
import {
  defaultProgressForStep,
  isBtpStep,
  type SerializedBtpProject,
} from "@/lib/btp-shared";

type BtpRecord = Omit<BtpProjectDoc, "_id"> & { _id: ObjectId };

async function tryDb(): Promise<Db | null> {
  try {
    return await Promise.race([
      getDb(),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), 3000);
      }),
    ]);
  } catch {
    return null;
  }
}

function toIso(value: Date | string | undefined | null) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function serializeBtpProject(
  doc: Omit<BtpProjectDoc, "_id"> & { _id?: { toString(): string } },
  idOverride?: string,
): SerializedBtpProject {
  return {
    id: idOverride ?? doc._id?.toString?.() ?? "",
    reference: doc.reference,
    title: doc.title,
    clientName: doc.clientName,
    clientEmail: doc.clientEmail ?? "",
    clientPhone: doc.clientPhone ?? "",
    clientCompany: doc.clientCompany ?? "",
    location: doc.location,
    description: doc.description ?? "",
    step: doc.step,
    quoteAmount: doc.quoteAmount,
    contractAmount: doc.contractAmount ?? doc.quoteAmount,
    progressPercent: doc.progressPercent,
    currency: "XOF",
    startDate: doc.startDate ?? "",
    expectedEndDate: doc.expectedEndDate ?? "",
    deliveredAt: doc.deliveredAt ?? null,
    notes: doc.notes ?? "",
    cancelled: Boolean(doc.cancelled),
    crmClientId: doc.crmClientId ?? null,
    crmProjectId: doc.crmProjectId ?? null,
    createdAt: toIso(doc.createdAt) ?? new Date(0).toISOString(),
    updatedAt: toIso(doc.updatedAt) ?? new Date(0).toISOString(),
  };
}

async function nextBtpReference(db: Db): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `BTP-${year}-`;
  const latest = await db
    .collection<BtpRecord>("btpProjects")
    .find({ reference: { $regex: `^${prefix}` } })
    .sort({ reference: -1 })
    .limit(1)
    .toArray();
  const last = latest[0]?.reference ?? `${prefix}0000`;
  const num = Number.parseInt(last.slice(prefix.length), 10);
  const next = Number.isFinite(num) ? num + 1 : 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export async function listBtpProjects(filters?: {
  q?: string;
  step?: string;
  includeCancelled?: boolean;
}): Promise<SerializedBtpProject[]> {
  const db = await tryDb();
  if (!db) return [];

  const filter: Filter<BtpRecord> = {};
  if (!filters?.includeCancelled) {
    filter.cancelled = { $ne: true };
  }
  if (filters?.step && filters.step !== "all" && isBtpStep(filters.step)) {
    filter.step = filters.step;
  }

  const docs = await db
    .collection<BtpRecord>("btpProjects")
    .find(filter)
    .sort({ updatedAt: -1 })
    .limit(200)
    .toArray();

  let rows = docs.map((doc) => serializeBtpProject(doc));

  const q = filters?.q?.trim().toLowerCase();
  if (q) {
    rows = rows.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.clientName.toLowerCase().includes(q) ||
        r.clientEmail.toLowerCase().includes(q) ||
        r.reference.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.clientCompany.toLowerCase().includes(q),
    );
  }

  return rows;
}

export async function getBtpProject(
  id: string,
): Promise<SerializedBtpProject | null> {
  const db = await tryDb();
  if (!db || !ObjectId.isValid(id)) return null;
  const doc = await db
    .collection<BtpRecord>("btpProjects")
    .findOne({ _id: new ObjectId(id) });
  return doc ? serializeBtpProject(doc) : null;
}

export async function createBtpProject(input: {
  title: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientCompany?: string;
  location: string;
  description?: string;
  quoteAmount?: number;
  step?: BtpStep;
  startDate?: string;
  expectedEndDate?: string;
  notes?: string;
}): Promise<SerializedBtpProject | null> {
  const title = input.title.trim();
  const clientName = input.clientName.trim();
  const location = input.location.trim();
  if (!title || !clientName || !location) {
    throw new Error("Titre, client et localisation sont requis.");
  }

  const db = await tryDb();
  if (!db) return null;

  const now = new Date();
  const step: BtpStep = input.step && isBtpStep(input.step) ? input.step : "prospect";
  const quoteAmount = Math.max(0, Number(input.quoteAmount) || 0);

  const doc: Omit<BtpProjectDoc, "_id"> = {
    reference: await nextBtpReference(db),
    title,
    clientName,
    clientEmail: input.clientEmail?.trim().toLowerCase() || undefined,
    clientPhone: input.clientPhone?.trim() || undefined,
    clientCompany: input.clientCompany?.trim() || undefined,
    location,
    description: input.description?.trim() || undefined,
    step,
    quoteAmount,
    contractAmount: step === "contrat" || btpStepReached(step, "contrat")
      ? quoteAmount
      : undefined,
    progressPercent: defaultProgressForStep(step),
    currency: "XOF",
    startDate: input.startDate || undefined,
    expectedEndDate: input.expectedEndDate || undefined,
    deliveredAt: step === "livraison" ? now.toISOString().slice(0, 10) : null,
    notes: input.notes?.trim() || undefined,
    cancelled: false,
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection("btpProjects").insertOne(doc);
  const id = result.insertedId.toString();

  await syncBtpToCrm(id, doc);

  return getBtpProject(id);
}

function btpStepReached(current: BtpStep, target: BtpStep): boolean {
  const order = [
    "prospect",
    "devis",
    "contrat",
    "chantier",
    "avancement",
    "livraison",
  ] as const;
  return order.indexOf(current) >= order.indexOf(target);
}

async function syncBtpToCrm(
  projectId: string,
  doc: Omit<BtpProjectDoc, "_id">,
) {
  const { clientId } = await touchClient({
    name: doc.clientName,
    email: doc.clientEmail,
    phone: doc.clientPhone,
    company: doc.clientCompany,
    activity: "btp",
    interaction: {
      type: "projet",
      title: `BTP · ${doc.reference}`,
      message: `${doc.title} · ${doc.location} · étape ${doc.step}`,
      refType: "project",
      refId: projectId,
    },
  });

  if (!clientId) return;

  const amount =
    doc.contractAmount && doc.contractAmount > 0
      ? doc.contractAmount
      : doc.quoteAmount;

  const linked = await linkProjectAndInvoice({
    clientId,
    clientName: doc.clientName,
    clientEmail: doc.clientEmail,
    activity: "btp",
    title: `BTP · ${doc.title}`,
    amount,
    sourceType: "btp",
    sourceId: projectId,
    invoiceStatus: btpStepReached(doc.step, "contrat") ? "emise" : "brouillon",
    projectStatus:
      doc.step === "livraison"
        ? "termine"
        : doc.cancelled
          ? "annule"
          : btpStepReached(doc.step, "chantier")
            ? "en_cours"
            : "ouvert",
  });

  const db = await tryDb();
  if (!db) return;

  await db.collection("btpProjects").updateOne(
    { _id: new ObjectId(projectId) },
    {
      $set: {
        crmClientId: clientId,
        crmProjectId: linked?.projectId ?? undefined,
        updatedAt: new Date(),
      },
    },
  );
}

export async function updateBtpProject(
  id: string,
  patch: {
    title?: string;
    clientName?: string;
    clientEmail?: string;
    clientPhone?: string;
    clientCompany?: string;
    location?: string;
    description?: string;
    step?: string;
    quoteAmount?: number;
    contractAmount?: number;
    progressPercent?: number;
    startDate?: string;
    expectedEndDate?: string;
    deliveredAt?: string | null;
    notes?: string;
    cancelled?: boolean;
  },
): Promise<SerializedBtpProject | null> {
  const db = await tryDb();
  if (!db || !ObjectId.isValid(id)) return null;

  const existing = await db
    .collection<BtpRecord>("btpProjects")
    .findOne({ _id: new ObjectId(id) });
  if (!existing) return null;

  const $set: Partial<BtpProjectDoc> = { updatedAt: new Date() };

  if (typeof patch.title === "string" && patch.title.trim()) {
    $set.title = patch.title.trim();
  }
  if (typeof patch.clientName === "string" && patch.clientName.trim()) {
    $set.clientName = patch.clientName.trim();
  }
  if (typeof patch.clientEmail === "string") {
    $set.clientEmail = patch.clientEmail.trim().toLowerCase() || undefined;
  }
  if (typeof patch.clientPhone === "string") {
    $set.clientPhone = patch.clientPhone.trim() || undefined;
  }
  if (typeof patch.clientCompany === "string") {
    $set.clientCompany = patch.clientCompany.trim() || undefined;
  }
  if (typeof patch.location === "string" && patch.location.trim()) {
    $set.location = patch.location.trim();
  }
  if (typeof patch.description === "string") {
    $set.description = patch.description.trim();
  }
  if (typeof patch.notes === "string") {
    $set.notes = patch.notes.trim();
  }
  if (typeof patch.startDate === "string") {
    $set.startDate = patch.startDate || undefined;
  }
  if (typeof patch.expectedEndDate === "string") {
    $set.expectedEndDate = patch.expectedEndDate || undefined;
  }
  if (patch.deliveredAt !== undefined) {
    $set.deliveredAt = patch.deliveredAt;
  }
  if (typeof patch.quoteAmount === "number" && Number.isFinite(patch.quoteAmount)) {
    $set.quoteAmount = Math.max(0, patch.quoteAmount);
  }
  if (
    typeof patch.contractAmount === "number" &&
    Number.isFinite(patch.contractAmount)
  ) {
    $set.contractAmount = Math.max(0, patch.contractAmount);
  }
  if (
    typeof patch.progressPercent === "number" &&
    Number.isFinite(patch.progressPercent)
  ) {
    $set.progressPercent = Math.min(100, Math.max(0, Math.round(patch.progressPercent)));
  }
  if (typeof patch.cancelled === "boolean") {
    $set.cancelled = patch.cancelled;
  }

  if (typeof patch.step === "string" && isBtpStep(patch.step)) {
    $set.step = patch.step;
    if (patch.progressPercent === undefined) {
      $set.progressPercent = defaultProgressForStep(patch.step);
    }
    if (patch.step === "livraison" && patch.deliveredAt === undefined) {
      $set.deliveredAt = new Date().toISOString().slice(0, 10);
      $set.progressPercent = 100;
    }
    if (
      (patch.step === "contrat" || btpStepReached(patch.step, "contrat")) &&
      existing.contractAmount == null &&
      patch.contractAmount === undefined
    ) {
      $set.contractAmount = existing.quoteAmount;
    }
  }

  await db
    .collection("btpProjects")
    .updateOne({ _id: new ObjectId(id) }, { $set });

  const updated = await getBtpProject(id);
  if (updated && !updated.cancelled) {
    await syncBtpToCrm(id, {
      reference: updated.reference,
      title: updated.title,
      clientName: updated.clientName,
      clientEmail: updated.clientEmail || undefined,
      clientPhone: updated.clientPhone || undefined,
      clientCompany: updated.clientCompany || undefined,
      location: updated.location,
      description: updated.description || undefined,
      step: updated.step,
      quoteAmount: updated.quoteAmount,
      contractAmount: updated.contractAmount,
      progressPercent: updated.progressPercent,
      currency: "XOF",
      startDate: updated.startDate || undefined,
      expectedEndDate: updated.expectedEndDate || undefined,
      deliveredAt: updated.deliveredAt,
      notes: updated.notes || undefined,
      cancelled: updated.cancelled,
      crmClientId: updated.crmClientId ?? undefined,
      crmProjectId: updated.crmProjectId ?? undefined,
      createdAt: new Date(updated.createdAt),
      updatedAt: new Date(updated.updatedAt),
    });
  }

  return getBtpProject(id);
}

/** Devis → contrat : fige le montant et avance l’étape */
export async function convertQuoteToContract(
  id: string,
  contractAmount?: number,
): Promise<SerializedBtpProject | null> {
  const current = await getBtpProject(id);
  if (!current) return null;
  if (current.cancelled) throw new Error("Projet annulé.");
  if (!btpStepReached(current.step, "devis") && current.step !== "prospect") {
    // allow from devis or earlier if amount set
  }
  const amount =
    typeof contractAmount === "number" && Number.isFinite(contractAmount)
      ? Math.max(0, contractAmount)
      : current.quoteAmount;
  if (amount <= 0) {
    throw new Error("Montant devis / contrat requis pour transformer.");
  }

  return updateBtpProject(id, {
    step: "contrat",
    quoteAmount: current.quoteAmount || amount,
    contractAmount: amount,
    progressPercent: defaultProgressForStep("contrat"),
  });
}

export async function getBtpStats() {
  const all = await listBtpProjects({ includeCancelled: true });
  const active = all.filter((p) => !p.cancelled);
  const byStep = Object.fromEntries(
    (
      [
        "prospect",
        "devis",
        "contrat",
        "chantier",
        "avancement",
        "livraison",
      ] as const
    ).map((s) => [s, active.filter((p) => p.step === s).length]),
  );
  const pipeline = active.filter((p) => p.step !== "livraison").length;
  const delivered = active.filter((p) => p.step === "livraison").length;
  const pipelineValue = active
    .filter((p) => p.step !== "livraison")
    .reduce((sum, p) => sum + (p.contractAmount || p.quoteAmount), 0);
  const deliveredValue = active
    .filter((p) => p.step === "livraison")
    .reduce((sum, p) => sum + (p.contractAmount || p.quoteAmount), 0);

  return {
    total: active.length,
    cancelled: all.length - active.length,
    pipeline,
    delivered,
    pipelineValue,
    deliveredValue,
    byStep,
  };
}
