"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminForms";
import { cn } from "@/lib/cn";
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

const emptyEdit = {
  name: "",
  email: "",
  role: "operationnels" as Role,
  active: true,
  password: "",
};

export function UsersAdminClient() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [matrix, setMatrix] = useState<MatrixRow[]>([]);
  const [selfId, setSelfId] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [edit, setEdit] = useState(emptyEdit);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const selected = users.find((u) => u.id === selectedId) ?? null;

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/admin/users");
      const json = (await res.json()) as {
        users?: UserRow[];
        matrix?: MatrixRow[];
        selfId?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      setUsers(json.users ?? []);
      setMatrix(json.matrix ?? []);
      setSelfId(json.selfId ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!selected) {
      setEdit(emptyEdit);
      return;
    }
    setEdit({
      name: selected.name,
      email: selected.email,
      role: selected.role,
      active: selected.active,
      password: "",
    });
  }, [selected]);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
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
      const json = (await res.json()) as { error?: string; user?: UserRow };
      if (!res.ok) throw new Error(json.error ?? "Échec");
      event.currentTarget.reset();
      setMessage("Compte créé.");
      await load();
      if (json.user) setSelectedId(json.user.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function onSave(event: FormEvent) {
    event.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const body: Record<string, unknown> = {
        id: selectedId,
        name: edit.name,
        email: edit.email,
        role: edit.role,
        active: edit.active,
      };
      if (edit.password.trim().length > 0) {
        body.password = edit.password.trim();
      }
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Échec");
      setEdit((prev) => ({ ...prev, password: "" }));
      setMessage("Profil mis à jour.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!selected || selected.id === selfId) return;
    const ok = window.confirm(
      `Supprimer définitivement le compte « ${selected.name} » (${ROLE_LABELS[selected.role]}) ?`,
    );
    if (!ok) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(
        `/api/admin/users?id=${encodeURIComponent(selected.id)}`,
        { method: "DELETE" },
      );
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Échec");
      setSelectedId(null);
      setMessage("Compte supprimé.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Utilisateurs & profils"
        description="Gérez tous les comptes : Admin, Direction, Compta, Opérationnels — rôles, activation et mots de passe."
      />

      {error ? (
        <p className="mb-4 rounded-xl border border-febis-red/20 bg-febis-red/5 px-4 py-3 text-sm font-semibold text-febis-red">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm font-semibold text-emerald-800">
          {message}
        </p>
      ) : null}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {matrix.map((row) => (
          <div key={row.role} className="admin-panel admin-panel-premium p-4">
            <p className="font-display text-lg font-bold text-febis-ink">
              {row.label}
            </p>
            <p className="mt-1 text-xs text-febis-ink/45">
              {users.filter((u) => u.role === row.role).length} compte(s)
            </p>
            <p className="mt-2 text-xs leading-relaxed text-febis-ink/55">
              {row.permissions.join(" · ")}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr_0.95fr]">
        <div className="admin-panel overflow-hidden">
          <div className="border-b border-febis-ink/8 px-5 py-3 text-sm font-semibold">
            Comptes ({users.length})
          </div>
          <div className="divide-y divide-febis-ink/8">
            {users.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-febis-ink/45">
                Aucun utilisateur.
              </p>
            ) : null}
            {users.map((u) => {
              const isSelf = u.id === selfId;
              const active = selectedId === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setSelectedId(u.id)}
                  className={cn(
                    "flex w-full items-start justify-between gap-3 px-5 py-3 text-left transition",
                    active ? "bg-febis-red/5" : "hover:bg-febis-smoke/60",
                  )}
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-febis-ink">
                      {u.name}
                      {isSelf ? (
                        <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-febis-orange">
                          vous
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-xs text-febis-ink/50">
                      {u.email}
                    </p>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-febis-ink/40">
                      {u.roleLabel}
                      {" · "}
                      <span
                        className={
                          u.active ? "text-emerald-700" : "text-febis-red"
                        }
                      >
                        {u.active ? "Actif" : "Inactif"}
                      </span>
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <form
          onSubmit={(e) => void onSave(e)}
          className="admin-panel admin-panel-premium h-fit space-y-3 p-5"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-febis-gold-deep">
            Modifier le profil
          </p>
          {!selected ? (
            <p className="py-6 text-center text-sm text-febis-ink/45">
              Sélectionnez un compte pour l’éditer.
            </p>
          ) : (
            <>
              <label className="block text-sm font-semibold text-febis-ink/80">
                Nom
                <input
                  required
                  value={edit.name}
                  onChange={(e) =>
                    setEdit((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="field-premium mt-1.5"
                />
              </label>
              <label className="block text-sm font-semibold text-febis-ink/80">
                Email
                <input
                  required
                  type="email"
                  value={edit.email}
                  onChange={(e) =>
                    setEdit((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="field-premium mt-1.5"
                />
              </label>
              <label className="block text-sm font-semibold text-febis-ink/80">
                Profil
                <select
                  value={edit.role}
                  onChange={(e) =>
                    setEdit((prev) => ({
                      ...prev,
                      role: e.target.value as Role,
                    }))
                  }
                  className="field-premium mt-1.5"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-febis-ink/80">
                <input
                  type="checkbox"
                  checked={edit.active}
                  disabled={selected.id === selfId}
                  onChange={(e) =>
                    setEdit((prev) => ({ ...prev, active: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-febis-ink/20"
                />
                Compte actif
                {selected.id === selfId ? (
                  <span className="text-xs font-normal text-febis-ink/40">
                    (votre compte)
                  </span>
                ) : null}
              </label>
              <label className="block text-sm font-semibold text-febis-ink/80">
                Nouveau mot de passe
                <input
                  type="password"
                  minLength={8}
                  value={edit.password}
                  onChange={(e) =>
                    setEdit((prev) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder="Laisser vide pour ne pas changer"
                  className="field-premium mt-1.5"
                />
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="cta-premium flex-1 justify-center disabled:opacity-60"
                >
                  {saving ? "Enregistrement…" : "Enregistrer"}
                </button>
                <button
                  type="button"
                  disabled={saving || selected.id === selfId}
                  onClick={() => void onDelete()}
                  className="rounded-full border border-febis-red/25 px-4 py-2 text-sm font-bold text-febis-red transition hover:bg-febis-red/5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Supprimer
                </button>
              </div>
            </>
          )}
        </form>

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
