import { ObjectId, type Db } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { formatXof } from "@/lib/crm-shared";

export type SearchHit = {
  id: string;
  type:
    | "client"
    | "contact"
    | "reservation"
    | "invoice"
    | "project"
    | "equipment"
    | "lodging"
    | "payment"
    | "blog";
  title: string;
  subtitle: string;
  href: string;
  activity?: string;
};

async function tryDb(): Promise<Db | null> {
  try {
    return await getDb();
  } catch {
    return null;
  }
}

function rx(q: string) {
  return {
    $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    $options: "i",
  };
}

export async function adminMultiSearch(input: {
  q: string;
  types?: string[];
  activity?: string;
  limit?: number;
}): Promise<SearchHit[]> {
  const q = input.q.trim();
  if (q.length < 2) return [];

  const db = await tryDb();
  if (!db) return [];

  const limit = Math.min(input.limit ?? 40, 80);
  const pattern = rx(q);
  const typeFilter = new Set(input.types ?? []);
  const want = (t: SearchHit["type"]) =>
    typeFilter.size === 0 || typeFilter.has(t);

  const hits: SearchHit[] = [];

  const tasks: Array<Promise<void>> = [];

  if (want("client")) {
    tasks.push(
      (async () => {
        const rows = await db
          .collection("clients")
          .find({
            $or: [
              { name: pattern },
              { email: pattern },
              { phone: pattern },
              { company: pattern },
            ],
          })
          .limit(15)
          .toArray();
        for (const row of rows) {
          hits.push({
            id: String(row._id),
            type: "client",
            title: String(row.name ?? "Client"),
            subtitle: [row.email, row.phone].filter(Boolean).join(" · "),
            href: `/admin/dashboard/crm/${row._id}`,
          });
        }
      })(),
    );
  }

  if (want("contact")) {
    tasks.push(
      (async () => {
        const rows = await db
          .collection("contacts")
          .find({
            $or: [{ name: pattern }, { email: pattern }, { message: pattern }],
          })
          .limit(10)
          .toArray();
        for (const row of rows) {
          hits.push({
            id: String(row._id),
            type: "contact",
            title: String(row.name ?? "Contact"),
            subtitle: String(row.message ?? "").slice(0, 80),
            href: "/admin/dashboard/contacts",
            activity: String(row.activity ?? ""),
          });
        }
      })(),
    );
  }

  if (want("reservation")) {
    tasks.push(
      (async () => {
        const rows = await db
          .collection("reservations")
          .find({
            $or: [
              { guestName: pattern },
              { guestEmail: pattern },
              { lodgingTitle: pattern },
            ],
          })
          .limit(10)
          .toArray();
        for (const row of rows) {
          hits.push({
            id: String(row._id),
            type: "reservation",
            title: `${row.guestName} · ${row.lodgingTitle}`,
            subtitle: `${row.checkIn} → ${row.checkOut}`,
            href: "/admin/dashboard/residences",
            activity: "residences",
          });
        }
      })(),
    );
  }

  if (want("invoice")) {
    tasks.push(
      (async () => {
        const rows = await db
          .collection("invoices")
          .find({
            $or: [
              { number: pattern },
              { clientName: pattern },
              { title: pattern },
            ],
          })
          .limit(10)
          .toArray();
        for (const row of rows) {
          if (input.activity && row.activity !== input.activity) continue;
          hits.push({
            id: String(row._id),
            type: "invoice",
            title: `${row.number} · ${row.clientName}`,
            subtitle: `${row.title} · ${formatXof(Number(row.amount ?? 0))}`,
            href: "/admin/dashboard/finance",
            activity: String(row.activity ?? ""),
          });
        }
      })(),
    );
  }

  if (want("project")) {
    tasks.push(
      (async () => {
        const rows = await db
          .collection("projects")
          .find({
            $or: [{ title: pattern }, { clientName: pattern }],
          })
          .limit(10)
          .toArray();
        for (const row of rows) {
          if (input.activity && row.activity !== input.activity) continue;
          hits.push({
            id: String(row._id),
            type: "project",
            title: String(row.title),
            subtitle: `${row.clientName} · ${row.status}`,
            href: "/admin/dashboard/crm",
            activity: String(row.activity ?? ""),
          });
        }
      })(),
    );
  }

  if (want("equipment")) {
    tasks.push(
      (async () => {
        const rows = await db
          .collection("equipment")
          .find({ $or: [{ name: pattern }, { slug: pattern }] })
          .limit(10)
          .toArray();
        for (const row of rows) {
          hits.push({
            id: String(row._id),
            type: "equipment",
            title: String(row.name),
            subtitle: `Stock ${row.quantityAvailable}/${row.quantityTotal}`,
            href: "/admin/dashboard/evenementiel",
            activity: "evenementiel",
          });
        }
      })(),
    );
  }

  if (want("lodging")) {
    tasks.push(
      (async () => {
        const rows = await db
          .collection("lodgings")
          .find({ $or: [{ title: pattern }, { slug: pattern }, { location: pattern }] })
          .limit(10)
          .toArray();
        for (const row of rows) {
          hits.push({
            id: String(row._id),
            type: "lodging",
            title: String(row.title),
            subtitle: `${row.location} · ${row.status}`,
            href: "/admin/dashboard/residences",
            activity: "residences",
          });
        }
      })(),
    );
  }

  if (want("payment")) {
    tasks.push(
      (async () => {
        const rows = await db
          .collection("payments")
          .find({
            $or: [
              { title: pattern },
              { reference: pattern },
              { clientName: pattern },
            ],
          })
          .limit(10)
          .toArray();
        for (const row of rows) {
          hits.push({
            id: String(row._id),
            type: "payment",
            title: String(row.title),
            subtitle: `${row.channel} · ${formatXof(Number(row.amount ?? 0))}`,
            href: "/admin/dashboard/paiements",
            activity: String(row.activity ?? ""),
          });
        }
      })(),
    );
  }

  if (want("blog")) {
    tasks.push(
      (async () => {
        const rows = await db
          .collection("blogPosts")
          .find({ $or: [{ title: pattern }, { excerpt: pattern }] })
          .limit(8)
          .toArray();
        for (const row of rows) {
          hits.push({
            id: String(row._id),
            type: "blog",
            title: String(row.title),
            subtitle: String(row.excerpt ?? "").slice(0, 80),
            href: "/admin/dashboard/blog",
          });
        }
      })(),
    );
  }

  await Promise.all(tasks);

  if (input.activity) {
    return hits
      .filter((h) => !h.activity || h.activity === input.activity)
      .slice(0, limit);
  }

  return hits.slice(0, limit);
}

export function searchTypeLabel(type: string) {
  switch (type) {
    case "client":
      return "Client";
    case "contact":
      return "Contact";
    case "reservation":
      return "Réservation";
    case "invoice":
      return "Facture";
    case "project":
      return "Projet";
    case "equipment":
      return "Matériel";
    case "lodging":
      return "Logement";
    case "payment":
      return "Paiement";
    case "blog":
      return "Blog";
    default:
      return type;
  }
}

// silence unused ObjectId import warning if tree-shaken oddly
void ObjectId;
