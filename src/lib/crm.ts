import "server-only";
import { ObjectId, type Db, type Filter } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type {
  Activity,
  ClientDoc,
  ClientInteraction,
  ClientStatus,
  InteractionType,
  InvoiceDoc,
  InvoiceStatus,
  ProjectDoc,
  ProjectStatus,
} from "@/lib/types";
import type {
  SerializedClient,
  SerializedInteraction,
  SerializedInvoice,
  SerializedProject,
} from "@/lib/crm-shared";

export type {
  SerializedClient,
  SerializedInteraction,
  SerializedInvoice,
  SerializedProject,
} from "@/lib/crm-shared";
export {
  activityLabel,
  formatXof,
  interactionTypeLabel,
} from "@/lib/crm-shared";

export type ClientTouchInput = {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  activity?: Activity | "general";
  interaction: {
    type: InteractionType | string;
    title?: string;
    message: string;
    refType?: ClientInteraction["refType"];
    refId?: string;
  };
};

async function tryDb(): Promise<Db | null> {
  try {
    return await getDb();
  } catch {
    return null;
  }
}

function newInteractionId() {
  return `ix_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeEmail(email?: string) {
  return email?.trim().toLowerCase() || undefined;
}

function toIso(value: Date | string | undefined | null) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function serializeClient(
  doc: ClientDoc & { _id: ObjectId },
): SerializedClient {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email ?? "",
    phone: doc.phone ?? "",
    company: doc.company ?? "",
    notes: doc.notes ?? "",
    tags: doc.tags ?? [],
    modules: (doc.modules ?? []).map(String),
    status: doc.status ?? "prospect",
    interactionsCount: doc.interactions?.length ?? 0,
    lastInteractionAt: toIso(doc.lastInteractionAt ?? null),
    createdAt: toIso(doc.createdAt) ?? new Date(0).toISOString(),
    updatedAt: toIso(doc.updatedAt) ?? new Date(0).toISOString(),
  };
}

function serializeInteraction(ix: ClientInteraction): SerializedInteraction {
  return {
    id: ix.id,
    type: ix.type,
    activity: String(ix.activity),
    title: ix.title ?? "",
    message: ix.message,
    refType: ix.refType,
    refId: ix.refId,
    at: toIso(ix.at) ?? new Date(0).toISOString(),
  };
}

function serializeInvoice(
  doc: InvoiceDoc & { _id: ObjectId },
): SerializedInvoice {
  return {
    id: doc._id.toString(),
    number: doc.number,
    clientId: doc.clientId,
    clientName: doc.clientName,
    activity: String(doc.activity),
    title: doc.title,
    amount: doc.amount,
    currency: "XOF",
    status: doc.status,
    sourceType: doc.sourceType,
    sourceId: doc.sourceId,
    createdAt: toIso(doc.createdAt) ?? new Date(0).toISOString(),
  };
}

function serializeProject(
  doc: ProjectDoc & { _id: ObjectId },
): SerializedProject {
  return {
    id: doc._id.toString(),
    title: doc.title,
    clientId: doc.clientId,
    clientName: doc.clientName,
    activity: String(doc.activity),
    status: doc.status,
    amount: doc.amount ?? null,
    currency: "XOF",
    sourceType: doc.sourceType,
    sourceId: doc.sourceId,
    createdAt: toIso(doc.createdAt) ?? new Date(0).toISOString(),
    updatedAt: toIso(doc.updatedAt) ?? new Date(0).toISOString(),
  };
}

async function nextDocumentNumber(db: Db, prefix: string, counterKey: string) {
  const counters = db.collection<{ _id: string; seq: number }>("counters");
  const result = await counters.findOneAndUpdate(
    { _id: counterKey },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" },
  );
  const seq = result?.seq ?? 1;
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(seq).padStart(4, "0")}`;
}

/**
 * Upsert client unique + journalise une interaction (CRM transversal CDC §4.6).
 */
export async function touchClient(input: ClientTouchInput): Promise<{
  clientId: string | null;
  persisted: boolean;
}> {
  const db = await tryDb();
  if (!db) return { clientId: null, persisted: false };

  const now = new Date();
  const email = normalizeEmail(input.email);
  const activity = input.activity ?? "general";
  const interaction: ClientInteraction = {
    id: newInteractionId(),
    type: input.interaction.type,
    activity,
    title: input.interaction.title,
    message: input.interaction.message,
    refType: input.interaction.refType,
    refId: input.interaction.refId,
    at: now,
  };

  const filter: Filter<ClientDoc> = email
    ? { email }
    : input.phone
      ? { phone: input.phone.trim() }
      : { name: input.name.trim(), email: { $exists: false } };

  const clients = db.collection("clients");
  const existing = await clients.findOne(filter as never);

  if (existing?._id) {
    await clients.updateOne(
      { _id: existing._id },
      {
        $set: {
          name: input.name.trim(),
          ...(email ? { email } : {}),
          ...(input.phone ? { phone: input.phone.trim() } : {}),
          ...(input.company ? { company: input.company.trim() } : {}),
          ...(input.notes ? { notes: input.notes } : {}),
          status: existing.status === "inactif" ? "actif" : (existing.status ?? "actif"),
          updatedAt: now,
          lastInteractionAt: now,
        },
        $addToSet: { modules: activity },
        $push: {
          interactions: {
            $each: [interaction],
            $position: 0,
            $slice: 200,
          },
        },
      } as never,
    );
    return { clientId: String(existing._id), persisted: true };
  }

  const doc: ClientDoc = {
    name: input.name.trim(),
    email,
    phone: input.phone?.trim() || undefined,
    company: input.company?.trim() || undefined,
    notes: input.notes,
    tags: [],
    modules: [activity],
    status: activity === "general" ? "prospect" : "actif",
    interactions: [interaction],
    lastInteractionAt: now,
    createdAt: now,
    updatedAt: now,
  };

  const result = await clients.insertOne(doc as ClientDoc & { _id?: ObjectId });
  return { clientId: result.insertedId.toString(), persisted: true };
}

export async function linkProjectAndInvoice(input: {
  clientId: string;
  clientName: string;
  clientEmail?: string;
  activity: Activity | "general";
  title: string;
  amount: number;
  sourceType: NonNullable<ProjectDoc["sourceType"]>;
  sourceId: string;
  invoiceStatus?: InvoiceStatus;
  projectStatus?: ProjectStatus;
}) {
  const db = await tryDb();
  if (!db || !ObjectId.isValid(input.clientId)) return null;

  const now = new Date();
  const projects = db.collection<ProjectDoc>("projects");
  const invoices = db.collection<InvoiceDoc>("invoices");

  const existingProject = await projects.findOne({
    sourceType: input.sourceType,
    sourceId: input.sourceId,
  });

  let projectId = existingProject?._id
    ? String(existingProject._id)
    : null;
  let created = false;

  if (!existingProject) {
    const project: ProjectDoc = {
      title: input.title,
      clientId: input.clientId,
      clientEmail: normalizeEmail(input.clientEmail),
      clientName: input.clientName,
      activity: input.activity,
      status: input.projectStatus ?? "ouvert",
      amount: input.amount,
      currency: "XOF",
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      createdAt: now,
      updatedAt: now,
    };
    const inserted = await db.collection("projects").insertOne({ ...project } as never);
    projectId = inserted.insertedId.toString();
    created = true;
  }

  const invoiceSourceType =
    input.sourceType === "btp" ? "manual" : input.sourceType;

  const existingInvoice = await invoices.findOne({
    sourceType: invoiceSourceType,
    sourceId: input.sourceId,
  });

  let invoiceId = existingInvoice?._id
    ? String(existingInvoice._id)
    : null;

  if (!existingInvoice) {
    const number = await nextDocumentNumber(db, "FAC", "invoices");
    const invoice: InvoiceDoc = {
      number,
      clientId: input.clientId,
      clientEmail: normalizeEmail(input.clientEmail),
      clientName: input.clientName,
      activity: input.activity,
      title: input.title,
      amount: input.amount,
      currency: "XOF",
      status: input.invoiceStatus ?? "brouillon",
      sourceType: invoiceSourceType,
      sourceId: input.sourceId,
      createdAt: now,
      updatedAt: now,
    };
    const inserted = await db.collection("invoices").insertOne({ ...invoice } as never);
    invoiceId = inserted.insertedId.toString();
    created = true;
  }

  if (created) {
    await db.collection("clients").updateOne(
      { _id: new ObjectId(input.clientId) },
      {
        $set: { updatedAt: now, lastInteractionAt: now },
        $push: {
          interactions: {
            $each: [
              {
                id: newInteractionId(),
                type: "facture",
                activity: input.activity,
                title: "Facture / projet liés",
                message: `${input.title} · ${input.amount} XOF`,
                refType: "invoice",
                refId: invoiceId ?? undefined,
                at: now,
              },
            ],
            $position: 0,
            $slice: 200,
          },
        },
      } as never,
    );
  }

  return { projectId, invoiceId };
}

export type ClientListFilters = {
  q?: string;
  activity?: string;
  status?: ClientStatus | "all";
  tag?: string;
};

export async function listClients(
  filters: ClientListFilters = {},
): Promise<SerializedClient[]> {
  const db = await tryDb();
  if (!db) return [];

  const query: Filter<ClientDoc> = {};
  const q = filters.q?.trim();

  if (q) {
    const rx = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    query.$or = [{ name: rx }, { email: rx }, { phone: rx }, { company: rx }];
  }
  if (filters.activity && filters.activity !== "all") {
    query.modules = filters.activity as Activity;
  }
  if (filters.status && filters.status !== "all") {
    query.status = filters.status;
  }
  if (filters.tag) {
    query.tags = filters.tag;
  }

  const rows = await db
    .collection<ClientDoc>("clients")
    .find(query)
    .sort({ lastInteractionAt: -1, updatedAt: -1 })
    .limit(200)
    .toArray();

  return rows
    .filter((row): row is ClientDoc & { _id: ObjectId } => Boolean(row._id))
    .map(serializeClient);
}

export async function getClientDetail(id: string): Promise<{
  client: SerializedClient;
  interactions: SerializedInteraction[];
  invoices: SerializedInvoice[];
  projects: SerializedProject[];
} | null> {
  const db = await tryDb();
  if (!db || !ObjectId.isValid(id)) return null;

  const client = await db
    .collection("clients")
    .findOne({ _id: new ObjectId(id) });
  if (!client?._id) return null;

  const typed = client as ClientDoc & { _id: ObjectId };
  const clientId = typed._id.toString();
  const email = typed.email?.toLowerCase();

  const invoiceFilter: Filter<InvoiceDoc> = email
    ? { $or: [{ clientId }, { clientEmail: email }] }
    : { clientId };
  const projectFilter: Filter<ProjectDoc> = email
    ? { $or: [{ clientId }, { clientEmail: email }] }
    : { clientId };

  const [invoices, projects] = await Promise.all([
    db
      .collection<InvoiceDoc>("invoices")
      .find(invoiceFilter)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray(),
    db
      .collection<ProjectDoc>("projects")
      .find(projectFilter)
      .sort({ updatedAt: -1 })
      .limit(50)
      .toArray(),
  ]);

  const interactions = [...(typed.interactions ?? [])]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .map(serializeInteraction);

  return {
    client: serializeClient(typed),
    interactions,
    invoices: invoices
      .filter((row): row is InvoiceDoc & { _id: ObjectId } => Boolean(row._id))
      .map(serializeInvoice),
    projects: projects
      .filter((row): row is ProjectDoc & { _id: ObjectId } => Boolean(row._id))
      .map(serializeProject),
  };
}

export async function createManualClient(input: {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  status?: ClientStatus;
  tags?: string[];
}): Promise<SerializedClient | null> {
  const db = await tryDb();
  if (!db) return null;

  const now = new Date();
  const email = normalizeEmail(input.email);
  if (email) {
    const existing = await db.collection<ClientDoc>("clients").findOne({ email });
    if (existing?._id) {
      return serializeClient(existing as ClientDoc & { _id: ObjectId });
    }
  }

  const doc: ClientDoc = {
    name: input.name.trim(),
    email,
    phone: input.phone?.trim() || undefined,
    company: input.company?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    tags: input.tags ?? [],
    modules: [],
    status: input.status ?? "prospect",
    interactions: [
      {
        id: newInteractionId(),
        type: "note",
        activity: "general",
        title: "Création CRM",
        message: "Fiche client créée manuellement",
        at: now,
      },
    ],
    lastInteractionAt: now,
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection("clients").insertOne({ ...doc } as never);

  return serializeClient({
    ...doc,
    _id: result.insertedId,
  } as ClientDoc & { _id: ObjectId });
}

export async function addClientNote(
  clientId: string,
  message: string,
): Promise<boolean> {
  const db = await tryDb();
  if (!db || !ObjectId.isValid(clientId) || message.trim().length < 2) {
    return false;
  }

  const client = await db
    .collection("clients")
    .findOne({ _id: new ObjectId(clientId) });
  if (!client) return false;

  const typed = client as unknown as ClientDoc;
  await touchClient({
    name: typed.name,
    email: typed.email,
    phone: typed.phone,
    activity: "general",
    interaction: {
      type: "note",
      title: "Note interne",
      message: message.trim(),
    },
  });
  return true;
}

export async function updateClientProfile(
  clientId: string,
  patch: Partial<{
    name: string;
    email: string;
    phone: string;
    company: string;
    notes: string;
    status: ClientStatus;
    tags: string[];
  }>,
): Promise<SerializedClient | null> {
  const db = await tryDb();
  if (!db || !ObjectId.isValid(clientId)) return null;

  const now = new Date();
  const $set: Record<string, unknown> = { updatedAt: now };
  if (patch.name !== undefined) $set.name = patch.name.trim();
  if (patch.email !== undefined) $set.email = normalizeEmail(patch.email) ?? "";
  if (patch.phone !== undefined) $set.phone = patch.phone.trim();
  if (patch.company !== undefined) $set.company = patch.company.trim();
  if (patch.notes !== undefined) $set.notes = patch.notes;
  if (patch.status !== undefined) $set.status = patch.status;
  if (patch.tags !== undefined) $set.tags = patch.tags;

  await db.collection("clients").updateOne(
    { _id: new ObjectId(clientId) },
    { $set },
  );

  const updated = await db
    .collection("clients")
    .findOne({ _id: new ObjectId(clientId) });
  if (!updated?._id) return null;
  return serializeClient(updated as ClientDoc & { _id: ObjectId });
}

