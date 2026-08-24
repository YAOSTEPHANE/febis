import type { Role } from "@/lib/types";

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

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
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

export function roleHasPermission(role: Role, permission: Permission) {
  return permissionsFor(role).includes(permission);
}
