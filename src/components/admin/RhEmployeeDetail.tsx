"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AdminPageHeader, AdminSaveButton } from "@/components/admin/AdminForms";
import {
  attendanceStatusLabel,
  contractStatusLabel,
  contractTypeLabel,
  departmentLabel,
  employeeStatusLabel,
  hrDocCategoryLabel,
  leaveStatusLabel,
  leaveTypeLabel,
  ATTENDANCE_STATUSES,
  CONTRACT_TYPES,
  EMPLOYEE_DEPARTMENTS,
  EMPLOYEE_STATUSES,
  HR_DOC_CATEGORIES,
  LEAVE_TYPES,
  type SerializedAttendance,
  type SerializedContract,
  type SerializedEmployee,
  type SerializedHrDocument,
  type SerializedLeave,
} from "@/lib/rh-shared";
import { cn } from "@/lib/cn";

type DetailPayload = {
  employee: SerializedEmployee;
  contracts: SerializedContract[];
  attendances: SerializedAttendance[];
  leaves: SerializedLeave[];
  documents: SerializedHrDocument[];
};

type Tab = "profil" | "contrats" | "presences" | "conges" | "documents";

export function RhEmployeeDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [detail, setDetail] = useState<DetailPayload | null>(null);
  const [tab, setTab] = useState<Tab>("profil");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/rh/${id}`);
      const json = (await res.json()) as DetailPayload & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Introuvable");
      setDetail(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`/api/admin/rh/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as DetailPayload & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Échec");
      setDetail(json);
      setMessage("Enregistré.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function onSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await patch({
      action: "profile",
      firstName: data.get("firstName"),
      lastName: data.get("lastName"),
      email: data.get("email"),
      phone: data.get("phone"),
      department: data.get("department"),
      jobTitle: data.get("jobTitle"),
      status: data.get("status"),
      hireDate: data.get("hireDate"),
      endDate: data.get("endDate"),
      address: data.get("address"),
      emergencyContact: data.get("emergencyContact"),
      notes: data.get("notes"),
    });
  }

  async function onContract(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await patch({
      action: "contract",
      type: data.get("type"),
      title: data.get("title"),
      startDate: data.get("startDate"),
      endDate: data.get("endDate"),
      salaryGross: Number(data.get("salaryGross") || 0) || undefined,
      notes: data.get("notes"),
    });
    event.currentTarget.reset();
  }

  async function onAttendance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await patch({
      action: "attendance",
      date: data.get("date"),
      status: data.get("status"),
      checkIn: data.get("checkIn"),
      checkOut: data.get("checkOut"),
      note: data.get("note"),
    });
  }

  async function onLeave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await patch({
      action: "leave",
      type: data.get("type"),
      startDate: data.get("startDate"),
      endDate: data.get("endDate"),
      reason: data.get("reason"),
    });
    event.currentTarget.reset();
  }

  async function onDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = (form.elements.namedItem("file") as HTMLInputElement)?.files?.[0];

    let fileUrl = String(data.get("fileUrl") || "").trim();
    let fileName = String(data.get("fileName") || "document");
    let mimeType: string | undefined;

    if (file) {
      if (file.size > 500_000) {
        setError("Fichier max 500 Ko en base. Hébergez-le et collez l’URL.");
        return;
      }
      fileName = file.name;
      mimeType = file.type;
      fileUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Lecture fichier impossible"));
        reader.readAsDataURL(file);
      });
    }

    if (!fileUrl) {
      setError("Ajoutez un fichier ou une URL de document.");
      return;
    }

    await patch({
      action: "document",
      category: data.get("category"),
      title: data.get("title"),
      fileName,
      fileUrl,
      mimeType,
      notes: data.get("notes"),
    });
    form.reset();
  }

  if (loading) {
    return <p className="text-sm text-febis-ink/55">Chargement du dossier…</p>;
  }

  if (!detail) {
    return (
      <div>
        <p className="text-sm font-semibold text-febis-red">
          {error || "Employé introuvable"}
        </p>
        <Link
          href="/admin/dashboard/rh"
          className="mt-4 inline-block text-sm font-bold text-febis-red"
        >
          ← Retour RH
        </Link>
      </div>
    );
  }

  const { employee, contracts, attendances, leaves, documents } = detail;
  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "profil", label: "Profil" },
    { id: "contrats", label: `Contrats (${contracts.length})` },
    { id: "presences", label: `Présences (${attendances.length})` },
    { id: "conges", label: `Congés (${leaves.length})` },
    { id: "documents", label: `Documents (${documents.length})` },
  ];

  return (
    <>
      <AdminPageHeader
        title={employee.fullName}
        description={`${employee.employeeNumber} · ${employee.jobTitle} · ${departmentLabel(employee.department)}`}
        actions={
          <Link
            href="/admin/dashboard/rh"
            className="inline-flex rounded-xl border border-febis-ink/12 bg-white/80 px-4 py-2 text-sm font-semibold text-febis-ink"
          >
            ← RH
          </Link>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <span className="rounded-md bg-febis-red/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-febis-red">
          {employeeStatusLabel(employee.status)}
        </span>
        <span className="rounded-md bg-febis-mist px-2.5 py-1 text-[11px] font-bold text-febis-ink/60">
          Embauche {employee.hireDate}
        </span>
      </div>

      <div className="mb-6 flex gap-1.5 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "shrink-0 rounded-xl px-3.5 py-2 text-sm font-bold transition",
              tab === t.id
                ? "bg-febis-red text-white"
                : "bg-white/80 text-febis-ink/65 hover:bg-white",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {(error || message) && (
        <p
          className={cn(
            "mb-4 rounded-xl px-3 py-2 text-sm font-semibold",
            error
              ? "border border-febis-red/20 bg-febis-red/8 text-febis-red"
              : "border border-emerald-600/20 bg-emerald-50 text-emerald-800",
          )}
        >
          {error || message}
        </p>
      )}

      {tab === "profil" && (
        <form onSubmit={onSaveProfile} className="admin-panel admin-panel-premium grid gap-3 p-5 md:grid-cols-2">
          <label className="text-sm font-semibold text-febis-ink/80">
            Prénom
            <input name="firstName" required className="field-premium mt-2" defaultValue={employee.firstName} />
          </label>
          <label className="text-sm font-semibold text-febis-ink/80">
            Nom
            <input name="lastName" required className="field-premium mt-2" defaultValue={employee.lastName} />
          </label>
          <label className="text-sm font-semibold text-febis-ink/80">
            Email
            <input name="email" type="email" required className="field-premium mt-2" defaultValue={employee.email} />
          </label>
          <label className="text-sm font-semibold text-febis-ink/80">
            Téléphone
            <input name="phone" className="field-premium mt-2" defaultValue={employee.phone} />
          </label>
          <label className="text-sm font-semibold text-febis-ink/80">
            Poste
            <input name="jobTitle" required className="field-premium mt-2" defaultValue={employee.jobTitle} />
          </label>
          <label className="text-sm font-semibold text-febis-ink/80">
            Département
            <select name="department" className="field-premium mt-2" defaultValue={employee.department}>
              {EMPLOYEE_DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{departmentLabel(d)}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-febis-ink/80">
            Statut
            <select name="status" className="field-premium mt-2" defaultValue={employee.status}>
              {EMPLOYEE_STATUSES.map((s) => (
                <option key={s} value={s}>{employeeStatusLabel(s)}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-febis-ink/80">
            Date d’embauche
            <input name="hireDate" type="date" className="field-premium mt-2" defaultValue={employee.hireDate} />
          </label>
          <label className="text-sm font-semibold text-febis-ink/80">
            Date de sortie
            <input name="endDate" type="date" className="field-premium mt-2" defaultValue={employee.endDate} />
          </label>
          <label className="text-sm font-semibold text-febis-ink/80 md:col-span-2">
            Adresse
            <input name="address" className="field-premium mt-2" defaultValue={employee.address} />
          </label>
          <label className="text-sm font-semibold text-febis-ink/80 md:col-span-2">
            Contact d’urgence
            <input name="emergencyContact" className="field-premium mt-2" defaultValue={employee.emergencyContact} />
          </label>
          <label className="text-sm font-semibold text-febis-ink/80 md:col-span-2">
            Notes dossier
            <textarea name="notes" className="field-premium mt-2 min-h-24" defaultValue={employee.notes} />
          </label>
          <div className="md:col-span-2">
            <AdminSaveButton saving={saving} label="Enregistrer le profil" />
          </div>
        </form>
      )}

      {tab === "contrats" && (
        <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
          <form onSubmit={onContract} className="admin-panel space-y-3 p-5">
            <p className="font-display text-lg font-bold text-febis-ink">Nouveau contrat</p>
            <select name="type" className="field-premium" required defaultValue="cdi">
              {CONTRACT_TYPES.map((t) => (
                <option key={t} value={t}>{contractTypeLabel(t)}</option>
              ))}
            </select>
            <input name="title" required className="field-premium" placeholder="Intitulé du contrat *" />
            <input name="startDate" type="date" required className="field-premium" />
            <input name="endDate" type="date" className="field-premium" />
            <input name="salaryGross" type="number" min={0} className="field-premium" placeholder="Salaire brut (XOF)" />
            <textarea name="notes" className="field-premium min-h-20" placeholder="Clauses / notes" />
            <AdminSaveButton saving={saving} label="Ajouter le contrat" />
          </form>
          <div className="admin-panel p-5">
            <p className="font-display text-lg font-bold text-febis-ink">Contrats de travail</p>
            <ul className="mt-4 space-y-2">
              {contracts.length === 0 ? (
                <li className="text-sm text-febis-ink/50">Aucun contrat.</li>
              ) : (
                contracts.map((c) => (
                  <li key={c.id} className="rounded-xl border border-febis-ink/6 bg-white/70 px-3.5 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-febis-ink">{c.title}</p>
                        <p className="text-xs text-febis-ink/50">
                          {contractTypeLabel(c.type)} · {contractStatusLabel(c.status)} ·{" "}
                          {c.startDate}
                          {c.endDate ? ` → ${c.endDate}` : ""}
                        </p>
                        {c.salaryGross != null && (
                          <p className="mt-1 text-sm font-semibold text-febis-red">
                            {c.salaryGross.toLocaleString("fr-FR")} XOF
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(
                          [
                            ["actif", "Activer"],
                            ["expire", "Expirer"],
                            ["resilie", "Résilier"],
                          ] as const
                        )
                          .filter(([st]) => st !== c.status)
                          .map(([st, label]) => (
                            <button
                              key={st}
                              type="button"
                              className="rounded-lg border border-febis-ink/12 px-2 py-1 text-[10px] font-bold uppercase tracking-wide"
                              onClick={() =>
                                void patch({
                                  action: "contract_status",
                                  contractId: c.id,
                                  status: st,
                                })
                              }
                            >
                              {label}
                            </button>
                          ))}
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}

      {tab === "presences" && (
        <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
          <form onSubmit={onAttendance} className="admin-panel space-y-3 p-5">
            <p className="font-display text-lg font-bold text-febis-ink">Pointer une journée</p>
            <input name="date" type="date" required className="field-premium" defaultValue={new Date().toISOString().slice(0, 10)} />
            <select name="status" className="field-premium" defaultValue="present">
              {ATTENDANCE_STATUSES.map((s) => (
                <option key={s} value={s}>{attendanceStatusLabel(s)}</option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input name="checkIn" type="time" className="field-premium" />
              <input name="checkOut" type="time" className="field-premium" />
            </div>
            <input name="note" className="field-premium" placeholder="Note (optionnel)" />
            <AdminSaveButton saving={saving} label="Enregistrer la présence" />
          </form>
          <div className="admin-panel p-5">
            <p className="font-display text-lg font-bold text-febis-ink">Historique présences</p>
            <ul className="mt-4 max-h-[480px] space-y-2 overflow-y-auto">
              {attendances.length === 0 ? (
                <li className="text-sm text-febis-ink/50">Aucune présence.</li>
              ) : (
                attendances.map((a) => (
                  <li key={a.id} className="rounded-xl bg-febis-smoke/70 px-3 py-2.5 text-sm">
                    <span className="font-bold text-febis-ink">{a.date}</span>
                    {" · "}
                    {attendanceStatusLabel(a.status)}
                    {a.checkIn ? ` · ${a.checkIn}` : ""}
                    {a.checkOut ? `–${a.checkOut}` : ""}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}

      {tab === "conges" && (
        <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
          <form onSubmit={onLeave} className="admin-panel space-y-3 p-5">
            <p className="font-display text-lg font-bold text-febis-ink">Demande de congé</p>
            <select name="type" className="field-premium" defaultValue="conges_payes">
              {LEAVE_TYPES.map((t) => (
                <option key={t} value={t}>{leaveTypeLabel(t)}</option>
              ))}
            </select>
            <input name="startDate" type="date" required className="field-premium" />
            <input name="endDate" type="date" required className="field-premium" />
            <textarea name="reason" className="field-premium min-h-20" placeholder="Motif" />
            <AdminSaveButton saving={saving} label="Soumettre la demande" />
          </form>
          <div className="admin-panel p-5">
            <p className="font-display text-lg font-bold text-febis-ink">Suivi des congés</p>
            <ul className="mt-4 space-y-2">
              {leaves.length === 0 ? (
                <li className="text-sm text-febis-ink/50">Aucun congé.</li>
              ) : (
                leaves.map((l) => (
                  <li key={l.id} className="rounded-xl border border-febis-ink/6 bg-white/70 px-3.5 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-febis-ink">
                          {leaveTypeLabel(l.type)} · {l.days} j
                        </p>
                        <p className="text-xs text-febis-ink/50">
                          {l.startDate} → {l.endDate} · {leaveStatusLabel(l.status)}
                        </p>
                      </div>
                      {l.status === "demande" && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white"
                            onClick={() =>
                              void patch({
                                action: "leave_status",
                                leaveId: l.id,
                                status: "approuve",
                              })
                            }
                          >
                            Approuver
                          </button>
                          <button
                            type="button"
                            className="rounded-lg bg-febis-red px-2.5 py-1 text-xs font-bold text-white"
                            onClick={() =>
                              void patch({
                                action: "leave_status",
                                leaveId: l.id,
                                status: "refuse",
                              })
                            }
                          >
                            Refuser
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}

      {tab === "documents" && (
        <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
          <form onSubmit={onDocument} className="admin-panel space-y-3 p-5">
            <p className="font-display text-lg font-bold text-febis-ink">
              Document administratif
            </p>
            <select name="category" className="field-premium" defaultValue="contrat">
              {HR_DOC_CATEGORIES.map((c) => (
                <option key={c} value={c}>{hrDocCategoryLabel(c)}</option>
              ))}
            </select>
            <input name="title" required className="field-premium" placeholder="Titre du document *" />
            <input name="file" type="file" className="field-premium" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" />
            <input name="fileUrl" className="field-premium" placeholder="Ou URL du fichier (Drive, S3…)" />
            <textarea name="notes" className="field-premium min-h-16" placeholder="Notes" />
            <p className="text-xs text-febis-ink/45">
              Fichiers locaux limités à 500 Ko. Pour les gros dossiers, utilisez une URL.
            </p>
            <AdminSaveButton saving={saving} label="Enregistrer le document" />
          </form>
          <div className="admin-panel p-5">
            <p className="font-display text-lg font-bold text-febis-ink">
              Documents du personnel
            </p>
            <ul className="mt-4 space-y-2">
              {documents.length === 0 ? (
                <li className="text-sm text-febis-ink/50">Aucun document.</li>
              ) : (
                documents.map((d) => (
                  <li key={d.id} className="rounded-xl bg-febis-smoke/70 px-3.5 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-febis-ink">{d.title}</p>
                        <p className="text-xs text-febis-ink/50">
                          {hrDocCategoryLabel(d.category)} · {d.fileName}
                        </p>
                        <a
                          href={d.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-block text-sm font-semibold text-febis-red hover:underline"
                        >
                          Ouvrir →
                        </a>
                      </div>
                      <button
                        type="button"
                        className="text-xs font-bold text-febis-ink/45 hover:text-febis-red"
                        onClick={() =>
                          void patch({
                            action: "document_delete",
                            documentId: d.id,
                          })
                        }
                      >
                        Supprimer
                      </button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
