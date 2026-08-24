"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminForms";
import { ROLES, type Role } from "@/lib/types";

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: Role;
  roleLabel: string;
  active: boolean;
};

type MatrixRow = {
  role: Role;
  label: string;
  permissions: string[];
};

const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  direction: "Direction",
  compta: "Compta",
  operationnels: "Opérationnels",
};

export function UsersAdminClient() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [matrix, setMatrix] = useState<MatrixRow[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/admin/users");
      const json = (await res.json()) as {
        users?: UserRow[];
        matrix?: MatrixRow[];
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      setUsers(json.users ?? []);
      setMatrix(json.matrix ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          role: data.get("role"),
          password: data.get("password"),
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Échec");
      event.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(user: UserRow) {
    setError("");
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id, active: !user.active }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(json.error ?? "Échec");
      return;
    }
    await load();
  }

  return (
    <>
      <AdminPageHeader
        title="Utilisateurs & droits"
        description="Quatre profils CDC : Admin, Direction, Compta, Opérationnels — matrice de permissions."
      />

      {error ? (
        <p className="mb-4 rounded-xl border border-febis-red/20 bg-febis-red/5 px-4 py-3 text-sm font-semibold text-febis-red">
          {error}
        </p>
      ) : null}

      <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {matrix.map((row) => (
          <div key={row.role} className="admin-panel admin-panel-premium p-4">
            <p className="font-display text-lg font-bold text-febis-ink">
              {row.label}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-febis-ink/55">
              {row.permissions.join(" · ")}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="admin-panel overflow-hidden">
          <div className="border-b border-febis-ink/8 px-5 py-3 text-sm font-semibold">
            Comptes ({users.length})
          </div>
          <div className="divide-y divide-febis-ink/8">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
              >
                <div>
                  <p className="font-semibold text-febis-ink">{u.name}</p>
                  <p className="text-xs text-febis-ink/50">
                    {u.email} · {u.roleLabel}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void toggleActive(u)}
                  className="text-xs font-bold text-febis-red hover:underline"
                >
                  {u.active ? "Désactiver" : "Activer"}
                </button>
              </div>
            ))}
          </div>
        </div>

        <form
          onSubmit={onCreate}
          className="admin-panel admin-panel-premium h-fit space-y-3 p-5"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-febis-gold-deep">
            Nouvel utilisateur
          </p>
          <input name="name" required placeholder="Nom" className="field-premium" />
          <input
            name="email"
            required
            type="email"
            placeholder="Email"
            className="field-premium"
          />
          <select name="role" className="field-premium" defaultValue="operationnels">
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          <input
            name="password"
            required
            type="password"
            minLength={8}
            placeholder="Mot de passe (8+)"
            className="field-premium"
          />
          <button
            type="submit"
            disabled={saving}
            className="cta-premium w-full justify-center disabled:opacity-60"
          >
            {saving ? "Création…" : "Créer le compte"}
          </button>
        </form>
      </div>
    </>
  );
}
