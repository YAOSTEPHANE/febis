import "server-only";
import { ObjectId, type Db } from "mongodb";
import { getDb } from "@/lib/mongodb";

export type BackupDoc = {
  _id?: string;
  label: string;
  collections: string[];
  documentCount: number;
  sizeEstimate: number;
  createdBy?: string;
  createdAt: Date;
  payload: Record<string, unknown[]>;
};

export type SerializedBackup = {
  id: string;
  label: string;
  collections: string[];
  documentCount: number;
  sizeEstimate: number;
  createdBy: string;
  createdAt: string;
};

const DEFAULT_COLLECTIONS = [
  "users",
  "clients",
  "contacts",
  "lodgings",
  "reservations",
  "equipment",
  "eventQuotes",
  "equipmentMovements",
  "products",
  "shopOrders",
  "invoices",
  "projects",
  "btpProjects",
  "payments",
  "expenses",
  "blogPosts",
  "testimonials",
  "travaux",
  "homepage",
  "billingDocuments",
  "notifications",
];

async function tryDb(): Promise<Db | null> {
  try {
    return await getDb();
  } catch {
    return null;
  }
}

function serialize(doc: BackupDoc & { _id: ObjectId }): SerializedBackup {
  return {
    id: doc._id.toString(),
    label: doc.label,
    collections: doc.collections,
    documentCount: doc.documentCount,
    sizeEstimate: doc.sizeEstimate,
    createdBy: doc.createdBy ?? "",
    createdAt: new Date(doc.createdAt).toISOString(),
  };
}

export async function createBackupSnapshot(input?: {
  label?: string;
  createdBy?: string;
  collections?: string[];
}): Promise<SerializedBackup | null> {
  const db = await tryDb();
  if (!db) return null;

  const collections = input?.collections?.length
    ? input.collections
    : DEFAULT_COLLECTIONS;

  const payload: Record<string, unknown[]> = {};
  let documentCount = 0;

  for (const name of collections) {
    try {
      const rows = await db.collection(name).find({}).limit(5000).toArray();
      payload[name] = rows.map((row) => {
        const copy = { ...row } as Record<string, unknown>;
        if (copy._id) copy._id = String(copy._id);
        if (typeof copy.passwordHash === "string") {
          copy.passwordHash = "[REDACTED]";
        }
        return copy;
      });
      documentCount += rows.length;
    } catch {
      payload[name] = [];
    }
  }

  const json = JSON.stringify(payload);
  const now = new Date();
  const doc: BackupDoc = {
    label:
      input?.label?.trim() ||
      `Sauvegarde auto · ${now.toLocaleString("fr-FR")}`,
    collections,
    documentCount,
    sizeEstimate: json.length,
    createdBy: input?.createdBy,
    createdAt: now,
    payload,
  };

  const result = await db
    .collection<BackupDoc>("backups")
    .insertOne(doc as BackupDoc & { _id?: ObjectId });

  // Garde les 20 dernières sauvegardes
  const old = await db
    .collection("backups")
    .find({})
    .sort({ createdAt: -1 })
    .skip(20)
    .project({ _id: 1 })
    .toArray();
  if (old.length) {
    await db.collection("backups").deleteMany({
      _id: { $in: old.map((o) => o._id) },
    });
  }

  return serialize({ ...doc, _id: result.insertedId } as unknown as BackupDoc & { _id: ObjectId });
}

export async function listBackups(): Promise<SerializedBackup[]> {
  const db = await tryDb();
  if (!db) return [];
  const rows = await db
    .collection<BackupDoc>("backups")
    .find({}, { projection: { payload: 0 } })
    .sort({ createdAt: -1 })
    .limit(20)
    .toArray();
  return rows
    .filter((r): r is BackupDoc & { _id: ObjectId } => Boolean(r._id))
    .map(serialize);
}

export async function getBackupPayload(id: string) {
  const db = await tryDb();
  if (!db || !ObjectId.isValid(id)) return null;
  const doc = await db.collection("backups").findOne({ _id: new ObjectId(id) });
  if (!doc) return null;
  return doc as BackupDoc & { _id: ObjectId };
}

/** Déclenche une sauvegarde si la dernière a plus de 24h */
export async function ensureDailyBackup(createdBy?: string) {
  const db = await tryDb();
  if (!db) return null;
  const last = await db
    .collection<BackupDoc>("backups")
    .find({}, { projection: { payload: 0 } })
    .sort({ createdAt: -1 })
    .limit(1)
    .next();

  if (last?.createdAt) {
    const age = Date.now() - new Date(last.createdAt).getTime();
    if (age < 24 * 60 * 60 * 1000) {
      return serialize(last as BackupDoc & { _id: ObjectId });
    }
  }

  return createBackupSnapshot({
    label: `Sauvegarde automatique quotidienne`,
    createdBy,
  });
}
