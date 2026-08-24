"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState, useTransition } from "react";
import { AdminPageHeader } from "@/components/admin/AdminForms";
import {
  departmentLabel,
  employeeStatusLabel,
  EMPLOYEE_DEPARTMENTS,
  EMPLOYEE_STATUSES,
  type RhOverview,
  type SerializedEmployee,
} from "@/lib/rh-shared";
import { cn } from "@/lib/cn";

export function RhAdminClient() {
  const [employees, setEmployees] = useState<SerializedEmployee[]>([]);
  const [overview, setOverview] = useState<RhOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [department, setDepartment] = useState("all");
  const [status, setStatus] = useState("all");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [pending, startTransition] = useTransition();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (department !== "all") params.set("department", department);
      if (status !== "all") params.set("status", status);
      const res = await fetch(`/api/admin/rh?${params.toString()}`);
      const json = (await res.json()) as {
        employees?: SerializedEmployee[];
        overview?: RhOverview;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Erreur chargement");
      setEmployees(json.employees ?? []);
      setOverview(json.overview ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [q, department, status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        void load();
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [load]);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const res = await fetch("/api/admin/rh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: data.get("firstName"),
          lastName: data.get("lastName"),
          email: data.get("email"),
          phone: data.get("phone"),
          department: data.get("department"),
          jobTitle: data.get("jobTitle"),
          status: data.get("status") || "actif",
          hireDate: data.get("hireDate"),
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Création impossible");
      event.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Module RH"
        description="Dossiers employés numériques, contrats de travail, présences, congés et documents administratifs."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {(
          [
            ["Dossiers", overview?.employeesTotal ?? 0],
            ["Actifs", overview?.employeesActive ?? 0],
            ["Présences (jour)", overview?.attendanceToday ?? 0],
            ["Congés en attente", overview?.leavesPending ?? 0],
            ["Contrats ≤ 60 j", overview?.contractsExpiring ?? 0],
            ["Documents", overview?.documentsTotal ?? 0],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="admin-panel admin-panel-premium p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-febis-gold-deep">
              {label}
            </p>
            <p className="mt-1 font-display text-2xl font-extrabold text-febis-ink">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <div className="admin-panel admin-panel-premium p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-febis-gold-deep">
            Recherche & filtres
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="block text-sm font-semibold text-febis-ink/80 sm:col-span-3">
              Rechercher
              <input
                className="field-premium mt-2"
                placeholder="Nom, email, matricule, poste…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold text-febis-ink/80">
              Département
              <select
                className="field-premium mt-2"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="all">Tous</option>
                {EMPLOYEE_DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {departmentLabel(d)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold text-febis-ink/80">
              Statut
              <select
                className="field-premium mt-2"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="all">Tous</option>
                {EMPLOYEE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {employeeStatusLabel(s)}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <p className="pb-3 text-sm text-febis-ink/45">
                {pending || loading
                  ? "Actualisation…"
                  : `${employees.length} dossier${employees.length > 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={onCreate} className="admin-panel space-y-3 p-5">
          <p className="font-display text-lg font-bold text-febis-ink">
            Nouveau dossier employé
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              name="firstName"
              className="field-premium"
              placeholder="Prénom *"
            />
            <input
              required
              name="lastName"
              className="field-premium"
              placeholder="Nom *"
            />
          </div>
          <input
            required
            name="email"
            type="email"
            className="field-premium"
            placeholder="Email *"
          />
          <input name="phone" className="field-premium" placeholder="Téléphone" />
          <input
            required
            name="jobTitle"
            className="field-premium"
            placeholder="Poste *"
          />
          <select name="department" className="field-premium" required defaultValue="operations">
            {EMPLOYEE_DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {departmentLabel(d)}
              </option>
            ))}
          </select>
          <input required name="hireDate" type="date" className="field-premium" />
          <select name="status" className="field-premium" defaultValue="actif">
            {EMPLOYEE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {employeeStatusLabel(s)}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={creating}
            className="cta-premium w-full justify-center disabled:opacity-60"
          >
            {creating ? "Création…" : "Créer le dossier"}
          </button>
        </form>
      </div>

      {error && (
        <p className="mb-4 rounded-xl border border-febis-red/20 bg-febis-red/8 px-3 py-2 text-sm font-semibold text-febis-red">
          {error}
        </p>
      )}

      <div className="admin-panel overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-febis-mist/80 text-[11px] uppercase tracking-wider text-febis-ink/55">
            <tr>
              <th className="px-4 py-3">Matricule</th>
              <th className="px-4 py-3">Employé</th>
              <th className="px-4 py-3">Poste</th>
              <th className="px-4 py-3">Département</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-febis-ink/8">
            {loading && employees.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-febis-ink/50">
                  Chargement RH…
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-febis-ink/50">
                  Aucun dossier. Créez le premier collaborateur ci-dessus.
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-white/60">
                  <td className="px-4 py-3 font-semibold text-febis-ink">
                    {emp.employeeNumber}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-febis-ink">{emp.fullName}</p>
                    <p className="text-xs text-febis-ink/45">{emp.email}</p>
                  </td>
                  <td className="px-4 py-3 text-febis-ink/70">{emp.jobTitle}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-febis-mist px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-febis-ink/65">
                      {departmentLabel(emp.department)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-md px-2 py-1 text-[11px] font-bold",
                        emp.status === "actif" && "bg-emerald-50 text-emerald-800",
                        emp.status === "essai" && "bg-amber-50 text-amber-900",
                        emp.status === "suspendu" && "bg-orange-50 text-orange-900",
                        emp.status === "sortie" && "bg-febis-mist text-febis-ink/55",
                      )}
                    >
                      {employeeStatusLabel(emp.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/dashboard/rh/${emp.id}`}
                      className="text-sm font-bold text-febis-red hover:underline"
                    >
                      Dossier →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
