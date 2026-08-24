import bcrypt from "bcryptjs";
import { ObjectId, type Db } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type { Role, UserDoc } from "@/lib/types";
import { ROLES } from "@/lib/types";
import { roleLabel, type SessionPayload } from "@/lib/auth";

export type Permission =
  | "dashboard"
  | "vitrine"
  | "crm"
  | "finance"
  | "facturation"
  | "paiements"
  | "operations"
  | "users"
  | "notifications"
  | "backup"
  | "search";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    "dashboard",
    "vitrine",
    "crm",
    "finance",
    "facturation",
    "paiements",
    "operations",
    "users",
    "notifications",
    "backup",
    "search",
  ],
  direction: [
    "dashboard",
    "crm",
    "finance",
    "facturation",
    "paiements",
    "operations",
    "notifications",
    "search",
    "backup",
  ],
  compta: [
    "dashboard",
    "crm",
    "finance",
    "facturation",
    "paiements",
    "notifications",
    "search",
  ],
  operationnels: [
    "dashboard",
    "operations",
    "crm",
    "notifications",
    "search",
  ],
};

export function permissionsFor(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function can(session: SessionPayload | null, permission: Permission) {
  if (!session) return false;
  return permissionsFor(session.role).includes(permission);
}

export function assertPermission(
  session: SessionPayload | null,
  permission: Permission,
) {
  if (!can(session, permission)) {
    throw new Error("Accès refusé pour ce profil");
  }
}

export type SerializedUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  roleLabel: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

async function tryDb(): Promise<Db | null> {
  try {
    return await getDb();
  } catch {
    return null;
  }
}

function serialize(doc: UserDoc & { _id: ObjectId }): SerializedUser {
  return {
    id: doc._id.toString(),
    email: doc.email,
    name: doc.name,
    role: doc.role,
    roleLabel: roleLabel(doc.role),
    active: doc.active,
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}

export async function listUsers(): Promise<SerializedUser[]> {
  const db = await tryDb();
  if (!db) return [];
  const rows = await db
    .collection<UserDoc>("users")
    .find({})
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();
  return rows
    .filter((r): r is UserDoc & { _id: ObjectId } => Boolean(r._id))
    .map(serialize);
}

export async function createUser(input: {
  email: string;
  name: string;
  role: Role;
  password: string;
  active?: boolean;
}): Promise<SerializedUser | null> {
  const db = await tryDb();
  if (!db) return null;
  if (!ROLES.includes(input.role)) return null;

  const email = input.email.trim().toLowerCase();
  const existing = await db.collection("users").findOne({ email });
  if (existing) throw new Error("Cet email existe déjà");

  const now = new Date();
  const passwordHash = await bcrypt.hash(input.password, 12);
  const doc: UserDoc = {
    email,
    name: input.name.trim(),
    role: input.role,
    passwordHash,
    active: input.active ?? true,
    createdAt: now,
    updatedAt: now,
  };

  const result = await db
    .collection<UserDoc>("users")
    .insertOne(doc as UserDoc & { _id?: ObjectId });

  return serialize({ ...doc, _id: result.insertedId } as unknown as UserDoc & { _id: ObjectId });
}

export async function updateUser(
  id: string,
  patch: Partial<{
    name: string;
    role: Role;
    active: boolean;
    password: string;
  }>,
): Promise<SerializedUser | null> {
  const db = await tryDb();
  if (!db || !ObjectId.isValid(id)) return null;

  const $set: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.name !== undefined) $set.name = patch.name.trim();
  if (patch.role !== undefined) {
    if (!ROLES.includes(patch.role)) return null;
    $set.role = patch.role;
  }
  if (patch.active !== undefined) $set.active = patch.active;
  if (patch.password) {
    $set.passwordHash = await bcrypt.hash(patch.password, 12);
  }

  await db.collection("users").updateOne({ _id: new ObjectId(id) }, { $set });
  const updated = await db
    .collection("users")
    .findOne({ _id: new ObjectId(id) });
  if (!updated?._id) return null;
  return serialize(updated as UserDoc & { _id: ObjectId });
}

export function roleMatrix() {
  return ROLES.map((role) => ({
    role,
    label: roleLabel(role),
    permissions: permissionsFor(role),
  }));
}
