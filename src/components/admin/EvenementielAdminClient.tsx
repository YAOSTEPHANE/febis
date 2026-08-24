"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState, useTransition } from "react";
import { AdminPageHeader } from "@/components/admin/AdminForms";
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
  const [creating, setCreating] = useState(false);
  const [pending, startTransition] = useTransition();

  const load = useCallback(async () => {
    setError("");
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());

      if (tab === "equipment") {
        if (category !== "all") params.set("category", category);
        if (status !== "all") params.set("status", status);
        params.set("tab", "equipment");
      } else if (tab === "quotes") {
        if (quoteStatus !== "all") params.set("status", quoteStatus);
        params.set("tab", "quotes");
      } else {
        if (moveType !== "all") params.set("type", moveType);
        params.set("tab", "movements");
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

      if (tab === "equipment") setEquipment(mainJson.equipment ?? []);
      if (tab === "quotes") setQuotes(mainJson.quotes ?? []);
      if (tab === "movements") setMovements(mainJson.movements ?? []);
      setStats(statsJson.stats ?? null);

      // Keep equipment list for movement form
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

  async function onCreateEquipment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const res = await fetch("/api/admin/evenementiel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "equipment",
          name: data.get("name"),
          category: data.get("category"),
          description: data.get("description"),
          pricePerDay: data.get("pricePerDay"),
          depositAmount: data.get("depositAmount"),
          quantityTotal: data.get("quantityTotal"),
          quantityAvailable: data.get("quantityAvailable"),
          status: data.get("status"),
          penaltyPerDamage: data.get("penaltyPerDamage"),
          photo: data.get("photo"),
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Création impossible");
      event.currentTarget.reset();
      setTab("equipment");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setCreating(false);
    }
  }

  async function onPatchStatus(slug: string, nextStatus: string) {
    setError("");
    try {
      const res = await fetch("/api/admin/evenementiel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, status: nextStatus }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Échec");
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
        <Link
          href="/evenementiel"
          className="ml-auto rounded-full border border-febis-ink/15 px-4 py-2 text-sm font-bold"
          target="_blank"
        >
          Site public →
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
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
              <table className="w-full text-left text-sm">
                <thead className="bg-febis-mist/80 text-xs uppercase tracking-wider text-febis-ink/55">
                  <tr>
                    <th className="px-4 py-3">Article</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">Prix / j</th>
                    <th className="px-4 py-3">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-febis-ink/8">
                  {equipment.map((item) => (
                    <tr key={item.slug}>
                      <td className="px-4 py-3">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-xs text-febis-ink/45">
                          {equipmentCategoryLabel(item.category)} · caution{" "}
                          {formatXof(item.depositAmount)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {item.quantityAvailable}/{item.quantityTotal}
                      </td>
                      <td className="px-4 py-3 font-semibold text-febis-red">
                        {formatXof(item.pricePerDay)}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={item.status}
                          onChange={(e) =>
                            void onPatchStatus(item.slug, e.target.value)
                          }
                          className="field-premium max-w-[140px] py-1.5 text-xs"
                        >
                          {EQUIPMENT_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {equipmentStatusLabel(s)}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                  {equipment.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-10 text-center text-febis-ink/45"
                      >
                        Aucun article — créez-en un à droite.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
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
                        {m.penaltyAmount > 0 ? formatXof(m.penaltyAmount) : "—"}
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

        <div className="space-y-4">
          {tab === "equipment" ? (
            <form
              onSubmit={onCreateEquipment}
              className="admin-panel admin-panel-premium space-y-3 p-5"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-febis-gold-deep">
                Nouvel article
              </p>
              <input name="name" required placeholder="Nom *" className="field-premium" />
              <select name="category" className="field-premium" defaultValue="mobilier">
                {EQUIPMENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {equipmentCategoryLabel(c)}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input
                  name="pricePerDay"
                  type="number"
                  min={0}
                  placeholder="Prix / jour"
                  className="field-premium"
                />
                <input
                  name="depositAmount"
                  type="number"
                  min={0}
                  placeholder="Caution"
                  className="field-premium"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  name="quantityTotal"
                  type="number"
                  min={0}
                  placeholder="Stock total"
                  className="field-premium"
                />
                <input
                  name="quantityAvailable"
                  type="number"
                  min={0}
                  placeholder="Dispo"
                  className="field-premium"
                />
              </div>
              <input
                name="penaltyPerDamage"
                type="number"
                min={0}
                placeholder="Pénalité / dommage"
                className="field-premium"
              />
              <select name="status" defaultValue="disponible" className="field-premium">
                {EQUIPMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {equipmentStatusLabel(s)}
                  </option>
                ))}
              </select>
              <input
                name="photo"
                placeholder="URL photo"
                className="field-premium"
              />
              <textarea
                name="description"
                rows={2}
                placeholder="Description"
                className="field-premium"
              />
              <button
                type="submit"
                disabled={creating}
                className="cta-premium w-full disabled:opacity-60"
              >
                {creating ? "Création…" : "Ajouter au catalogue"}
              </button>
            </form>
          ) : null}

          {tab === "quotes" ? (
            <form
              onSubmit={onCreateQuote}
              className="admin-panel admin-panel-premium space-y-3 p-5"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-febis-gold-deep">
                Devis rapide (1 article)
              </p>
              <input name="clientName" required placeholder="Client *" className="field-premium" />
              <input name="clientEmail" type="email" required placeholder="Email *" className="field-premium" />
              <input name="clientPhone" required placeholder="Téléphone *" className="field-premium" />
              <div className="grid grid-cols-2 gap-2">
                <input name="eventDate" type="date" required className="field-premium" />
                <input name="returnDate" type="date" required className="field-premium" />
              </div>
              <select name="equipmentSlug" required className="field-premium" defaultValue="">
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
              <select name="status" defaultValue="envoye" className="field-premium">
                {QUOTE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {quoteStatusLabel(s)}
                  </option>
                ))}
              </select>
              <textarea name="message" rows={2} placeholder="Message" className="field-premium" />
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
              <select name="equipmentSlug" required className="field-premium" defaultValue="">
                <option value="" disabled>
                  Article *
                </option>
                {equipment.map((e) => (
                  <option key={e.slug} value={e.slug}>
                    {e.name} ({e.quantityAvailable}/{e.quantityTotal})
                  </option>
                ))}
              </select>
              <select name="type" defaultValue="sortie" className="field-premium">
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
              <textarea name="note" rows={2} placeholder="Note" className="field-premium" />
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
      </div>
    </>
  );
}
