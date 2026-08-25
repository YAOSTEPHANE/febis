"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState, useTransition } from "react";
import { AdminPageHeader } from "@/components/admin/AdminForms";
import { AdminFormOverlay } from "@/components/admin/AdminFormOverlay";
import {
  departmentLabel,
  employeeStatusLabel,
  EMPLOYEE_DEPARTMENTS,
  EMPLOYEE_STATUSES,
  type RhOverview,
  type SerializedEmployee,
} from "@/lib/rh-shared";
import { cn } from "@/lib/cn";

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  jobTitle: string;
  status: string;
  hireDate: string;
};

const emptyForm = (): FormState => ({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  department: "operations",
  jobTitle: "",
  status: "actif",
  hireDate: new Date().toISOString().slice(0, 10),
});

function employeeToForm(emp: SerializedEmployee): FormState {
  return {
    firstName: emp.firstName,
    lastName: emp.lastName,
    email: emp.email,
    phone: emp.phone ?? "",
    department: emp.department,
    jobTitle: emp.jobTitle,
    status: emp.status,
    hireDate: emp.hireDate?.slice(0, 10) ?? "",
  };
}

export function RhAdminClient() {
  const [employees, setEmployees] = useState<SerializedEmployee[]>([]);
  const [overview, setOverview] = useState<RhOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [department, setDepartment] = useState("all");
  const [status, setStatus] = useState("all");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
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

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setError("");
    setFormOpen(true);
  }

  function openEdit(emp: SerializedEmployee) {
    setEditingId(emp.id);
    setForm(employeeToForm(emp));
    setError("");
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      department: form.department,
      jobTitle: form.jobTitle,
      status: form.status,
      hireDate: form.hireDate,
      ...(editingId ? { action: "profile" } : {}),
    };
    try {
      const res = await fetch(
        editingId ? `/api/admin/rh/${editingId}` : "/api/admin/rh",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Enregistrement impossible");
      closeForm();
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
        title="Module RH"
        description="Dossiers employés numériques, contrats de travail, présences, congés et documents administratifs."
        actions={
          <button type="button" onClick={openCreate} className="cta-premium">
            + Nouveau dossier
          </button>
        }
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

      <div className="admin-panel admin-panel-premium mb-4 p-5">
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

      {error && !formOpen ? (
        <p className="mb-4 rounded-xl border border-febis-red/20 bg-febis-red/8 px-3 py-2 text-sm font-semibold text-febis-red">
          {error}
        </p>
      ) : null}

      <div className="admin-panel overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-febis-mist/80 text-[11px] uppercase tracking-wider text-febis-ink/55">
            <tr>
              <th className="px-4 py-3">Matricule</th>
              <th className="px-4 py-3">Employé</th>
              <th className="px-4 py-3">Poste</th>
              <th className="px-4 py-3">Département</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 text-right">Actions</th>
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
                <td colSpan={6} className="px-4 py-8 text-center text-febis-ink/50">
                  Aucun dossier.{" "}
                  <button
                    type="button"
                    onClick={openCreate}
                    className="font-bold text-febis-gold-deep underline"
                  >
                    Créer le premier collaborateur
                  </button>
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
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(emp)}
                        className="rounded-full border border-febis-ink/15 px-3 py-1.5 text-xs font-bold"
                      >
                        Modifier
                      </button>
                      <Link
                        href={`/admin/dashboard/rh/${emp.id}`}
                        className="rounded-full border border-febis-red/20 px-3 py-1.5 text-xs font-bold text-febis-red"
                      >
                        Dossier
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AdminFormOverlay
        open={formOpen}
        title={editingId ? "Modifier le dossier" : "Nouveau dossier employé"}
        subtitle="Identité et affectation — contrats / congés sur la fiche complète"
        onClose={closeForm}
        footer={
          <>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-full border border-febis-ink/15 px-4 py-2.5 text-sm font-bold"
            >
              Fermer
            </button>
            {editingId ? (
              <Link
                href={`/admin/dashboard/rh/${editingId}`}
                className="rounded-full border border-febis-red/20 px-4 py-2.5 text-sm font-bold text-febis-red"
              >
                Ouvrir le dossier
              </Link>
            ) : null}
            <button
              type="submit"
              form="rh-form"
              disabled={saving}
              className="cta-premium ml-auto disabled:opacity-60"
            >
              {saving
                ? "Enregistrement…"
                : editingId
                  ? "Enregistrer"
                  : "Créer le dossier"}
            </button>
          </>
        }
      >
        {error && formOpen ? (
          <p className="mb-4 rounded-xl border border-febis-red/20 bg-febis-red/5 px-3 py-2 text-sm font-semibold text-febis-red">
            {error}
          </p>
        ) : null}
        <form id="rh-form" onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
          <input
            required
            value={form.firstName}
            onChange={(e) =>
              setForm((f) => ({ ...f, firstName: e.target.value }))
            }
            className="field-premium"
            placeholder="Prénom *"
          />
          <input
            required
            value={form.lastName}
            onChange={(e) =>
              setForm((f) => ({ ...f, lastName: e.target.value }))
            }
            className="field-premium"
            placeholder="Nom *"
          />
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="field-premium sm:col-span-2"
            placeholder="Email *"
          />
          <input
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="field-premium"
            placeholder="Téléphone"
          />
          <input
            required
            value={form.jobTitle}
            onChange={(e) =>
              setForm((f) => ({ ...f, jobTitle: e.target.value }))
            }
            className="field-premium"
            placeholder="Poste *"
          />
          <select
            required
            value={form.department}
            onChange={(e) =>
              setForm((f) => ({ ...f, department: e.target.value }))
            }
            className="field-premium"
          >
            {EMPLOYEE_DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {departmentLabel(d)}
              </option>
            ))}
          </select>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            className="field-premium"
          >
            {EMPLOYEE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {employeeStatusLabel(s)}
              </option>
            ))}
          </select>
          <input
            required
            type="date"
            value={form.hireDate}
            onChange={(e) =>
              setForm((f) => ({ ...f, hireDate: e.target.value }))
            }
            className="field-premium sm:col-span-2"
          />
        </form>
      </AdminFormOverlay>
    </>
  );
}
