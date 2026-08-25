"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState, useTransition } from "react";
import { AdminPageHeader } from "@/components/admin/AdminForms";
import { AdminFormOverlay } from "@/components/admin/AdminFormOverlay";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import {
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_STATUSES,
  MOVEMENT_TYPES,
  QUOTE_STATUSES,
  equipmentCategoryLabel,
  equipmentStatusLabel,
  formatXof,
  movementTypeLabel,
  quoteStatusLabel,
  type SerializedEquipment,
  type SerializedEventQuote,
  type SerializedMovement,
} from "@/lib/evenementiel-shared";
import { cn } from "@/lib/cn";

type Tab = "equipment" | "quotes" | "movements";

type Stats = {
  articles: number;
  available: number;
  rented: number;
  maintenance: number;
  quotes: number;
  pendingQuotes: number;
  acceptedQuotes: number;
  rentalValue: number;
  movements: number;
  penalties: number;
};

type EquipmentFormState = {
  name: string;
  slug: string;
  category: string;
  description: string;
  photo: string;
  pricePerDay: string;
  depositAmount: string;
  quantityTotal: string;
  quantityAvailable: string;
  penaltyPerDamage: string;
  status: string;
};

const DEFAULT_PHOTO = "/images/event-materiel.jpg";

const emptyForm = (): EquipmentFormState => ({
  name: "",
  slug: "",
  category: "mobilier",
  description: "",
  photo: DEFAULT_PHOTO,
  pricePerDay: "0",
  depositAmount: "0",
  quantityTotal: "1",
  quantityAvailable: "1",
  penaltyPerDamage: "0",
  status: "disponible",
});

function equipmentToForm(item: SerializedEquipment): EquipmentFormState {
  return {
    name: item.name,
    slug: item.slug,
    category: item.category,
    description: item.description,
    photo: item.photo || DEFAULT_PHOTO,
    pricePerDay: String(item.pricePerDay),
    depositAmount: String(item.depositAmount),
    quantityTotal: String(item.quantityTotal),
    quantityAvailable: String(item.quantityAvailable),
    penaltyPerDamage: String(item.penaltyPerDamage),
    status: item.status,
  };
}

export function EvenementielAdminClient() {
  const [tab, setTab] = useState<Tab>("equipment");
  const [equipment, setEquipment] = useState<SerializedEquipment[]>([]);
  const [quotes, setQuotes] = useState<SerializedEventQuote[]>([]);
  const [movements, setMovements] = useState<SerializedMovement[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [quoteStatus, setQuoteStatus] = useState("all");
  const [moveType, setMoveType] = useState("all");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [form, setForm] = useState<EquipmentFormState>(emptyForm);
  const [pending, startTransition] = useTransition();

  const load = useCallback(async () => {
    setError("");
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());

      switch (tab) {
        case "equipment":
          if (category !== "all") params.set("category", category);
          if (status !== "all") params.set("status", status);
          params.set("tab", "equipment");
          break;
        case "quotes":
          if (quoteStatus !== "all") params.set("status", quoteStatus);
          params.set("tab", "quotes");
          break;
        case "movements":
          if (moveType !== "all") params.set("type", moveType);
          params.set("tab", "movements");
          break;
        default: {
          const _exhaustive: never = tab;
          throw new Error(`Onglet inconnu: ${_exhaustive}`);
        }
      }

      const [mainRes, statsRes] = await Promise.all([
        fetch(`/api/admin/evenementiel?${params}`),
        fetch("/api/admin/evenementiel?tab=stats"),
      ]);
      const mainJson = (await mainRes.json()) as {
        equipment?: SerializedEquipment[];
        quotes?: SerializedEventQuote[];
        movements?: SerializedMovement[];
        error?: string;
      };
      const statsJson = (await statsRes.json()) as {
        stats?: Stats;
        error?: string;
      };
      if (!mainRes.ok) throw new Error(mainJson.error ?? "Erreur");
      if (!statsRes.ok) throw new Error(statsJson.error ?? "Erreur");

      switch (tab) {
        case "equipment":
          setEquipment(mainJson.equipment ?? []);
          break;
        case "quotes":
          setQuotes(mainJson.quotes ?? []);
          break;
        case "movements":
          setMovements(mainJson.movements ?? []);
          break;
        default: {
          const _exhaustive: never = tab;
          throw new Error(`Onglet inconnu: ${_exhaustive}`);
        }
      }
      setStats(statsJson.stats ?? null);

      // Keep equipment list for quote / movement forms
      if (tab !== "equipment") {
        const eqRes = await fetch("/api/admin/evenementiel?tab=equipment");
        const eqJson = (await eqRes.json()) as {
          equipment?: SerializedEquipment[];
        };
        if (eqRes.ok) setEquipment(eqJson.equipment ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }, [tab, q, category, status, quoteStatus, moveType]);

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        void load();
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [load]);

  function openCreate() {
    setEditingSlug(null);
    setForm(emptyForm());
    setFormOpen(true);
    setError("");
    setInfo("");
  }

  function openEdit(item: SerializedEquipment) {
    setEditingSlug(item.slug);
    setForm(equipmentToForm(item));
    setFormOpen(true);
    setError("");
    setInfo("");
  }

  function closeForm() {
    setFormOpen(false);
    setEditingSlug(null);
    setForm(emptyForm());
  }

  async function onSubmitEquipment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setInfo("");

    const payload = {
      name: form.name,
      slug: form.slug || undefined,
      category: form.category,
      description: form.description,
      photo: form.photo,
      pricePerDay: Number(form.pricePerDay || "0"),
      depositAmount: Number(form.depositAmount || "0"),
      quantityTotal: Number(form.quantityTotal || "0"),
      quantityAvailable: Number(form.quantityAvailable || "0"),
      penaltyPerDamage: Number(form.penaltyPerDamage || "0"),
      status: form.status,
    };

    try {
      const res = await fetch("/api/admin/evenementiel", {
        method: editingSlug ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingSlug
            ? { ...payload, slug: editingSlug }
            : { ...payload, kind: "equipment" },
        ),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Enregistrement impossible");
      setInfo(editingSlug ? "Article mis à jour." : "Article créé.");
      closeForm();
      setTab("equipment");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function onDeleteEquipment(item: SerializedEquipment) {
    if (!window.confirm(`Supprimer définitivement « ${item.name} » ?`)) {
      return;
    }
    setError("");
    setInfo("");
    try {
      const res = await fetch(
        `/api/admin/evenementiel?slug=${encodeURIComponent(item.slug)}`,
        { method: "DELETE" },
      );
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Suppression impossible");
      if (editingSlug === item.slug) closeForm();
      setInfo(`« ${item.name} » a été supprimé.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }

  async function onCreateMovement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const res = await fetch("/api/admin/evenementiel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "movement",
          equipmentSlug: data.get("equipmentSlug"),
          type: data.get("type"),
          quantity: data.get("quantity"),
          quoteId: data.get("quoteId") || undefined,
          note: data.get("note"),
          damageReported: data.get("damageReported") === "on",
          penaltyAmount: data.get("penaltyAmount") || undefined,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Échec");
      event.currentTarget.reset();
      setTab("movements");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setCreating(false);
    }
  }

  async function onCreateQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const slug = String(data.get("equipmentSlug") ?? "");
    const quantity = Number(data.get("quantity") ?? 1);
    try {
      const res = await fetch("/api/admin/evenementiel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "quote",
          clientName: data.get("clientName"),
          clientEmail: data.get("clientEmail"),
          clientPhone: data.get("clientPhone"),
          eventDate: data.get("eventDate"),
          returnDate: data.get("returnDate"),
          message: data.get("message"),
          status: data.get("status") || "envoye",
          items: [{ slug, quantity }],
        }),
      });
      const json = (await res.json()) as {
        quote?: SerializedEventQuote;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Échec");
      event.currentTarget.reset();
      if (json.quote?.id) {
        window.location.href = `/admin/dashboard/evenementiel/${json.quote.id}`;
        return;
      }
      setTab("quotes");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setCreating(false);
    }
  }

  const showSideForm = tab === "quotes" || tab === "movements";

  return (
    <>
      <AdminPageHeader
        title="Événementiel"
        description="CDC §4.4 : catalogue, devis, sorties/retours, dommages & pénalités."
      />

      {error ? (
        <p className="mb-4 rounded-xl border border-febis-red/20 bg-febis-red/5 px-4 py-3 text-sm font-semibold text-febis-red">
          {error}
        </p>
      ) : null}
      {info ? (
        <p className="mb-4 rounded-xl border border-febis-ink/10 bg-febis-cream/50 px-4 py-3 text-sm text-febis-ink/70">
          {info}
        </p>
      ) : null}

      {stats ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Articles", String(stats.articles)],
            ["Devis en attente", String(stats.pendingQuotes)],
            ["CA devis", formatXof(stats.rentalValue)],
            ["Pénalités", formatXof(stats.penalties)],
          ].map(([label, value]) => (
            <div key={label} className="admin-panel admin-panel-premium p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-febis-gold-deep">
                {label}
              </p>
              <p className="mt-2 font-display text-2xl font-extrabold text-febis-ink">
                {value}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mb-5 flex flex-wrap gap-2">
        {(
          [
            ["equipment", "Catalogue"],
            ["quotes", "Devis"],
            ["movements", "Mouvements"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-bold transition",
              tab === id
                ? "bg-febis-gold-deep text-white"
                : "bg-febis-mist text-febis-ink/60",
            )}
          >
            {label}
          </button>
        ))}
        {tab === "equipment" ? (
          <button type="button" onClick={openCreate} className="cta-premium">
            + Ajouter un article
          </button>
        ) : null}
        <Link
          href="/evenementiel"
          className="ml-auto rounded-full border border-febis-ink/15 px-4 py-2 text-sm font-bold"
          target="_blank"
        >
          Site public →
        </Link>
      </div>

      <div
        className={cn(
          "grid gap-6",
          showSideForm ? "lg:grid-cols-[1.4fr_1fr]" : "grid-cols-1",
        )}
      >
        <div className="space-y-4">
          <div className="admin-panel admin-panel-premium p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-febis-gold-deep">
              Filtres
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Recherche…"
                className="field-premium sm:col-span-2"
              />
              {tab === "equipment" ? (
                <>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="field-premium"
                  >
                    <option value="all">Toutes catégories</option>
                    {EQUIPMENT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {equipmentCategoryLabel(c)}
                      </option>
                    ))}
                  </select>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="field-premium"
                  >
                    <option value="all">Tous statuts</option>
                    {EQUIPMENT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {equipmentStatusLabel(s)}
                      </option>
                    ))}
                  </select>
                </>
              ) : null}
              {tab === "quotes" ? (
                <select
                  value={quoteStatus}
                  onChange={(e) => setQuoteStatus(e.target.value)}
                  className="field-premium sm:col-span-2"
                >
                  <option value="all">Tous les devis</option>
                  {QUOTE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {quoteStatusLabel(s)}
                    </option>
                  ))}
                </select>
              ) : null}
              {tab === "movements" ? (
                <select
                  value={moveType}
                  onChange={(e) => setMoveType(e.target.value)}
                  className="field-premium sm:col-span-2"
                >
                  <option value="all">Tous mouvements</option>
                  {MOVEMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {movementTypeLabel(t)}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>
            <p className="mt-2 text-xs text-febis-ink/45">
              {pending ? "Actualisation…" : null}
            </p>
          </div>

          {tab === "equipment" ? (
            <div className="admin-panel overflow-hidden">
              <div className="border-b border-febis-ink/8 px-5 py-3 text-sm font-semibold text-febis-ink/70">
                {pending
                  ? "Chargement…"
                  : `${equipment.length} article(s)`}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead className="border-b border-febis-ink/8 bg-febis-smoke/40 text-[10px] font-bold uppercase tracking-[0.14em] text-febis-ink/45">
                    <tr>
                      <th className="px-5 py-3">Photo / Article</th>
                      <th className="px-3 py-3">Catégorie</th>
                      <th className="px-3 py-3">Stock</th>
                      <th className="px-3 py-3">Prix / jour</th>
                      <th className="px-3 py-3">Statut</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-febis-ink/8">
                    {equipment.map((item) => (
                      <tr
                        key={item.slug}
                        className="align-top hover:bg-febis-cream/35"
                      >
                        <td className="px-5 py-4">
                          <div className="flex gap-3">
                            <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-febis-ink/10">
                              <Image
                                src={item.photo || DEFAULT_PHOTO}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="48px"
                                unoptimized={(item.photo ?? "").startsWith(
                                  "/uploads/",
                                )}
                              />
                            </span>
                            <div>
                              <p className="font-display text-base font-bold text-febis-ink">
                                {item.name}
                              </p>
                              <p className="text-xs text-febis-ink/45">
                                Caution {formatXof(item.depositAmount)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          {equipmentCategoryLabel(item.category)}
                        </td>
                        <td className="px-3 py-4">
                          {item.quantityAvailable}/{item.quantityTotal}
                        </td>
                        <td className="px-3 py-4 font-bold text-febis-red">
                          {formatXof(item.pricePerDay)}
                        </td>
                        <td className="px-3 py-4">
                          <span className="rounded-full bg-febis-mist px-2.5 py-1 text-[11px] font-bold">
                            {equipmentStatusLabel(item.status)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(item)}
                              className="rounded-full border border-febis-ink/15 px-3 py-1.5 text-xs font-bold"
                            >
                              Modifier
                            </button>
                            <button
                              type="button"
                              onClick={() => void onDeleteEquipment(item)}
                              className="rounded-full border border-febis-red/25 px-3 py-1.5 text-xs font-bold text-febis-red"
                            >
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-febis-ink/8 md:hidden">
                {equipment.map((item) => (
                  <div key={item.slug} className="px-4 py-4">
                    <div className="flex gap-3">
                      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-febis-ink/10">
                        <Image
                          src={item.photo || DEFAULT_PHOTO}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="56px"
                          unoptimized={(item.photo ?? "").startsWith(
                            "/uploads/",
                          )}
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-lg font-bold">
                          {item.name}
                        </p>
                        <p className="text-sm text-febis-ink/55">
                          {equipmentCategoryLabel(item.category)} ·{" "}
                          {formatXof(item.pricePerDay)}/j ·{" "}
                          {item.quantityAvailable}/{item.quantityTotal}
                        </p>
                        <p className="mt-1 text-xs font-bold text-febis-ink/45">
                          {equipmentStatusLabel(item.status)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="rounded-full border border-febis-ink/15 px-3 py-1.5 text-xs font-bold"
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => void onDeleteEquipment(item)}
                        className="rounded-full border border-febis-red/25 px-3 py-1.5 text-xs font-bold text-febis-red"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {!pending && equipment.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-sm text-febis-ink/50">
                    Aucun article — ajoutez une fiche au catalogue.
                  </p>
                  <button
                    type="button"
                    onClick={openCreate}
                    className="cta-premium mt-4"
                  >
                    + Ajouter un article
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          {tab === "quotes" ? (
            <div className="admin-panel overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-febis-mist/80 text-xs uppercase tracking-wider text-febis-ink/55">
                  <tr>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Dates</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-febis-ink/8">
                  {quotes.map((quote) => (
                    <tr key={quote.id}>
                      <td className="px-4 py-3">
                        <p className="font-semibold">{quote.clientName}</p>
                        <p className="text-xs text-febis-ink/45">
                          {quote.clientEmail}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {quote.eventDate} → {quote.returnDate}
                      </td>
                      <td className="px-4 py-3 font-semibold text-febis-red">
                        {formatXof(quote.rentalTotal)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-febis-mist px-2.5 py-1 text-xs font-bold">
                          {quoteStatusLabel(quote.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/dashboard/evenementiel/${quote.id}`}
                          className="text-sm font-bold text-febis-gold-deep hover:underline"
                        >
                          Ouvrir →
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {quotes.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-febis-ink/45"
                      >
                        Aucun devis.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          ) : null}

          {tab === "movements" ? (
            <div className="admin-panel overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-febis-mist/80 text-xs uppercase tracking-wider text-febis-ink/55">
                  <tr>
                    <th className="px-4 py-3">Mouvement</th>
                    <th className="px-4 py-3">Qté</th>
                    <th className="px-4 py-3">Pénalité</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-febis-ink/8">
                  {movements.map((m) => (
                    <tr key={m.id}>
                      <td className="px-4 py-3">
                        <p className="font-semibold">
                          {movementTypeLabel(m.type)} · {m.equipmentName}
                        </p>
                        <p className="text-xs text-febis-ink/45">
                          {m.damageReported ? "Dommage signalé · " : ""}
                          {m.note || m.quoteId || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3">{m.quantity}</td>
                      <td className="px-4 py-3 font-semibold text-febis-red">
                        {m.penaltyAmount > 0
                          ? formatXof(m.penaltyAmount)
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-febis-ink/55">
                        {new Date(m.createdAt).toLocaleString("fr-FR")}
                      </td>
                    </tr>
                  ))}
                  {movements.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-10 text-center text-febis-ink/45"
                      >
                        Aucun mouvement.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>

        {showSideForm ? (
          <div className="space-y-4">
            {tab === "quotes" ? (
              <form
                onSubmit={onCreateQuote}
                className="admin-panel admin-panel-premium space-y-3 p-5"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-febis-gold-deep">
                  Devis rapide (1 article)
                </p>
                <input
                  name="clientName"
                  required
                  placeholder="Client *"
                  className="field-premium"
                />
                <input
                  name="clientEmail"
                  type="email"
                  required
                  placeholder="Email *"
                  className="field-premium"
                />
                <input
                  name="clientPhone"
                  required
                  placeholder="Téléphone *"
                  className="field-premium"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    name="eventDate"
                    type="date"
                    required
                    className="field-premium"
                  />
                  <input
                    name="returnDate"
                    type="date"
                    required
                    className="field-premium"
                  />
                </div>
                <select
                  name="equipmentSlug"
                  required
                  className="field-premium"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Article *
                  </option>
                  {equipment.map((e) => (
                    <option key={e.slug} value={e.slug}>
                      {e.name} ({e.quantityAvailable} dispo)
                    </option>
                  ))}
                </select>
                <input
                  name="quantity"
                  type="number"
                  min={1}
                  defaultValue={1}
                  className="field-premium"
                />
                <select
                  name="status"
                  defaultValue="envoye"
                  className="field-premium"
                >
                  {QUOTE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {quoteStatusLabel(s)}
                    </option>
                  ))}
                </select>
                <textarea
                  name="message"
                  rows={2}
                  placeholder="Message"
                  className="field-premium"
                />
                <button
                  type="submit"
                  disabled={creating}
                  className="cta-premium w-full disabled:opacity-60"
                >
                  {creating ? "Création…" : "Créer le devis"}
                </button>
              </form>
            ) : null}

            {tab === "movements" ? (
              <form
                onSubmit={onCreateMovement}
                className="admin-panel admin-panel-premium space-y-3 p-5"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-febis-gold-deep">
                  Sortie / retour
                </p>
                <select
                  name="equipmentSlug"
                  required
                  className="field-premium"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Article *
                  </option>
                  {equipment.map((e) => (
                    <option key={e.slug} value={e.slug}>
                      {e.name} ({e.quantityAvailable}/{e.quantityTotal})
                    </option>
                  ))}
                </select>
                <select
                  name="type"
                  defaultValue="sortie"
                  className="field-premium"
                >
                  {MOVEMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {movementTypeLabel(t)}
                    </option>
                  ))}
                </select>
                <input
                  name="quantity"
                  type="number"
                  min={1}
                  defaultValue={1}
                  required
                  className="field-premium"
                />
                <input
                  name="quoteId"
                  placeholder="ID devis (optionnel)"
                  className="field-premium"
                />
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input type="checkbox" name="damageReported" />
                  Dommage au retour
                </label>
                <input
                  name="penaltyAmount"
                  type="number"
                  min={0}
                  placeholder="Pénalité (auto si vide)"
                  className="field-premium"
                />
                <textarea
                  name="note"
                  rows={2}
                  placeholder="Note"
                  className="field-premium"
                />
                <button
                  type="submit"
                  disabled={creating}
                  className="cta-premium w-full disabled:opacity-60"
                >
                  {creating ? "Enregistrement…" : "Enregistrer le mouvement"}
                </button>
              </form>
            ) : null}
          </div>
        ) : null}
      </div>

      <AdminFormOverlay
        open={formOpen}
        onClose={closeForm}
        title={editingSlug ? "Modifier l’article" : "Nouvel article"}
        subtitle="Catalogue matériel événementiel"
        wide
        footer={
          <>
            <button
              type="submit"
              form="equipment-form"
              disabled={saving}
              className="cta-premium disabled:opacity-60"
            >
              {saving
                ? "Enregistrement…"
                : editingSlug
                  ? "Enregistrer"
                  : "Créer l’article"}
            </button>
            {editingSlug ? (
              <button
                type="button"
                onClick={() => {
                  const current = equipment.find((e) => e.slug === editingSlug);
                  if (current) void onDeleteEquipment(current);
                }}
                className="rounded-full border border-febis-red/30 px-4 py-2 text-sm font-bold text-febis-red"
              >
                Supprimer
              </button>
            ) : null}
            <button
              type="button"
              onClick={closeForm}
              className="rounded-full border border-febis-ink/15 px-4 py-2 text-sm font-bold text-febis-ink/60"
            >
              Annuler
            </button>
          </>
        }
      >
        <form
          id="equipment-form"
          onSubmit={onSubmitEquipment}
          className="space-y-4"
        >
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-sm font-semibold">
              Nom *
              <input
                required
                autoFocus
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="field-premium mt-1.5"
              />
            </label>
            <label className="block text-sm font-semibold">
              Slug
              <input
                value={form.slug}
                onChange={(e) =>
                  setForm((f) => ({ ...f, slug: e.target.value }))
                }
                className="field-premium mt-1.5"
                placeholder="Auto si vide"
                disabled={Boolean(editingSlug)}
              />
            </label>
            <label className="block text-sm font-semibold">
              Catégorie
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
                className="field-premium mt-1.5"
              >
                {EQUIPMENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {equipmentCategoryLabel(c)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold">
              Statut
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value }))
                }
                className="field-premium mt-1.5"
              >
                {EQUIPMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {equipmentStatusLabel(s)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold">
              Prix / jour (XOF)
              <input
                required
                inputMode="numeric"
                value={form.pricePerDay}
                onChange={(e) =>
                  setForm((f) => ({ ...f, pricePerDay: e.target.value }))
                }
                className="field-premium mt-1.5"
              />
            </label>
            <label className="block text-sm font-semibold">
              Caution (XOF)
              <input
                inputMode="numeric"
                value={form.depositAmount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, depositAmount: e.target.value }))
                }
                className="field-premium mt-1.5"
              />
            </label>
            <label className="block text-sm font-semibold">
              Stock total
              <input
                inputMode="numeric"
                value={form.quantityTotal}
                onChange={(e) =>
                  setForm((f) => ({ ...f, quantityTotal: e.target.value }))
                }
                className="field-premium mt-1.5"
              />
            </label>
            <label className="block text-sm font-semibold">
              Quantité disponible
              <input
                inputMode="numeric"
                value={form.quantityAvailable}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    quantityAvailable: e.target.value,
                  }))
                }
                className="field-premium mt-1.5"
              />
            </label>
            <label className="block text-sm font-semibold md:col-span-2">
              Pénalité / dommage (XOF)
              <input
                inputMode="numeric"
                value={form.penaltyPerDamage}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    penaltyPerDamage: e.target.value,
                  }))
                }
                className="field-premium mt-1.5"
              />
            </label>
          </div>

          <label className="block text-sm font-semibold">
            Description
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className="field-premium mt-1.5"
            />
          </label>

          <ImageUploadField
            label="Photo matériel"
            folder="evenementiel"
            value={form.photo}
            onChange={(url) =>
              setForm((f) => ({
                ...f,
                photo: url || DEFAULT_PHOTO,
              }))
            }
            fallbackPreview={DEFAULT_PHOTO}
          />
        </form>
      </AdminFormOverlay>
    </>
  );
}
