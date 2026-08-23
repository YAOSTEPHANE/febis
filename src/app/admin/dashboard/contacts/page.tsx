"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminForms";

type ContactRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  activity: string;
  message: string;
  createdAt: string;
};

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/admin/contacts");
        const json = (await res.json()) as { contacts?: ContactRow[] };
        setContacts(json.contacts ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <>
      <AdminPageHeader
        title="Contacts"
        description="Messages reçus via le formulaire de contact de l’accueil."
      />
      {loading ? (
        <p className="text-sm text-febis-ink/55">Chargement…</p>
      ) : contacts.length === 0 ? (
        <p className="rounded-2xl border border-febis-ink/8 bg-white/70 p-6 text-sm text-febis-ink/55">
          Aucun contact pour le moment.
        </p>
      ) : (
        <div className="space-y-3">
          {contacts.map((c) => (
            <article
              key={c.id}
              className="rounded-2xl border border-febis-ink/8 bg-white/70 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-febis-ink">{c.name}</p>
                  <p className="text-sm text-febis-ink/55">
                    {c.email}
                    {c.phone ? ` · ${c.phone}` : ""}
                  </p>
                </div>
                <span className="rounded-full bg-febis-mist px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-febis-ink/70">
                  {c.activity}
                </span>
              </div>
              {c.message && (
                <p className="mt-3 text-sm leading-relaxed text-febis-ink/70">
                  {c.message}
                </p>
              )}
              <p className="mt-2 text-xs text-febis-ink/40">
                {c.createdAt
                  ? new Date(c.createdAt).toLocaleString("fr-FR")
                  : ""}
              </p>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
