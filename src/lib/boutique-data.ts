import type { Db } from "mongodb";
import { getDb } from "@/lib/mongodb";
import {
  FALLBACK_PRODUCTS,
  buildOrderLine,
  serializeProduct,
  type PublicProduct,
} from "@/lib/boutique";
import type { ProductDoc, ShopOrderDoc, ShopOrderLine } from "@/lib/types";

type ProductRecord = ProductDoc & { _id: { toString(): string } };
type OrderRecord = ShopOrderDoc & { _id: { toString(): string } };

async function tryDb(): Promise<Db | null> {
  try {
    return await Promise.race([
      getDb(),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), 3000);
      }),
    ]);
  } catch {
    return null;
  }
}

function orderNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  return `FB-${stamp.slice(-8)}`;
}

export function serializeOrder(doc: ShopOrderDoc, idOverride?: string) {
  const id = idOverride ?? doc._id ?? "";
  return {
    id,
    orderNumber: doc.orderNumber,
    clientName: doc.clientName,
    clientEmail: doc.clientEmail,
    clientPhone: doc.clientPhone,
    deliveryAddress: doc.deliveryAddress,
    message: doc.message,
    lines: doc.lines,
    totalAmount: doc.totalAmount,
    currency: doc.currency,
    status: doc.status,
    createdAt:
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : String(doc.createdAt),
  };
}

export type PublicOrder = ReturnType<typeof serializeOrder>;

export async function listPublicProducts(): Promise<PublicProduct[]> {
  const db = await tryDb();
  if (!db) return FALLBACK_PRODUCTS;

  try {
    const docs = await db
      .collection<ProductRecord>("products")
      .find({})
      .sort({ name: 1 })
      .limit(100)
      .toArray();

    if (docs.length === 0) return FALLBACK_PRODUCTS;
    return docs.map((doc) => serializeProduct(doc));
  } catch {
    return FALLBACK_PRODUCTS;
  }
}

export async function createShopOrder(input: {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  deliveryAddress: string;
  message?: string;
  items: Array<{ slug: string; sku: string; quantity: number }>;
}) {
  const catalog = await listPublicProducts();
  const lines: ShopOrderLine[] = [];
  const db = await tryDb();

  for (const item of input.items) {
    const product = catalog.find((p) => p.slug === item.slug);
    if (!product) {
      throw new Error(`Produit introuvable : ${item.slug}`);
    }
    const variant = product.variants.find((v) => v.sku === item.sku);
    if (!variant) {
      throw new Error(`Variante introuvable pour ${product.name}`);
    }
    if (item.quantity > variant.stock) {
      throw new Error(
        `Stock insuffisant pour ${product.name} (${variantLabelSafe(variant)}) — dispo : ${variant.stock}.`,
      );
    }
    lines.push(
      buildOrderLine({
        product,
        sku: item.sku,
        quantity: item.quantity,
      }),
    );
  }

  if (lines.length === 0) {
    throw new Error("Le panier est vide.");
  }

  const totalAmount = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const now = new Date();
  const doc: Omit<ShopOrderDoc, "_id"> = {
    orderNumber: orderNumber(),
    clientName: input.clientName,
    clientEmail: input.clientEmail.toLowerCase(),
    clientPhone: input.clientPhone,
    deliveryAddress: input.deliveryAddress,
    message: input.message,
    lines,
    totalAmount,
    currency: "XOF",
    status: "en_attente",
    createdAt: now,
    updatedAt: now,
  };

  if (!db) {
    return {
      ...serializeOrder(doc, `local-order-${Date.now()}`),
      persisted: false as const,
    };
  }

  // Décrémente le stock des variantes
  for (const line of lines) {
    await db.collection("products").updateOne(
      { slug: line.productSlug, "variants.sku": line.sku },
      {
        $inc: { "variants.$.stock": -line.quantity },
        $set: { updatedAt: now },
      },
    );
  }

  const result = await db.collection("shopOrders").insertOne(doc);

  const clients = db.collection<{
    email: string;
    name: string;
    phone: string;
    createdAt: Date;
    updatedAt: Date;
    interactions: Array<{
      type: string;
      activity: string;
      message: string;
      at: Date;
    }>;
  }>("clients");

  await clients.updateOne(
    { email: doc.clientEmail },
    {
      $set: {
        name: doc.clientName,
        email: doc.clientEmail,
        phone: doc.clientPhone,
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
      $push: {
        interactions: {
          type: "shop_order",
          activity: "boutique",
          message: `Commande ${doc.orderNumber} · ${lines.length} article(s)`,
          at: now,
        },
      },
    },
    { upsert: true },
  );

  return {
    ...serializeOrder(doc, result.insertedId.toString()),
    persisted: true as const,
  };
}

function variantLabelSafe(variant: { size?: string; color?: string }): string {
  const parts = [variant.color, variant.size].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "Standard";
}

export async function listOrdersByEmail(email: string): Promise<PublicOrder[]> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return [];

  const db = await tryDb();
  if (!db) {
    return [];
  }

  try {
    const docs = await db
      .collection<OrderRecord>("shopOrders")
      .find({ clientEmail: normalized })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return docs.map((doc) => serializeOrder(doc, doc._id.toString()));
  } catch {
    return [];
  }
}

export async function listRecentSales(limit = 12): Promise<PublicOrder[]> {
  const db = await tryDb();
  if (!db) return [];

  try {
    const docs = await db
      .collection<OrderRecord>("shopOrders")
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return docs.map((doc) => serializeOrder(doc, doc._id.toString()));
  } catch {
    return [];
  }
}
