import "server-only";
import { ObjectId, type Db, type Filter } from "mongodb";
import { getDb } from "@/lib/mongodb";
import {
  FALLBACK_PRODUCTS,
  buildOrderLine,
  serializeProduct,
  type PublicProduct,
} from "@/lib/boutique";
import {
  isOrderStatus,
  isProductCategory,
  slugifyProductName,
  variantLabel,
  type SerializedShopOrder,
} from "@/lib/boutique-shared";
import type {
  OrderStatus,
  ProductCategory,
  ProductDoc,
  ProductVariant,
  ShopOrderDoc,
  ShopOrderLine,
} from "@/lib/types";
import { linkProjectAndInvoice, touchClient } from "@/lib/crm";

type ProductRecord = Omit<ProductDoc, "_id"> & { _id: ObjectId };
type OrderRecord = Omit<ShopOrderDoc, "_id"> & { _id: ObjectId };

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

function toIso(value: Date | string | undefined | null) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function serializeOrder(
  doc: Omit<ShopOrderDoc, "_id"> & { _id?: string | { toString(): string } },
  idOverride?: string,
): SerializedShopOrder {
  const rawId = idOverride ?? doc._id;
  const id =
    typeof rawId === "string"
      ? rawId
      : rawId && typeof rawId.toString === "function"
        ? rawId.toString()
        : "";
  return {
    id,
    orderNumber: doc.orderNumber,
    clientName: doc.clientName,
    clientEmail: doc.clientEmail,
    clientPhone: doc.clientPhone,
    deliveryAddress: doc.deliveryAddress,
    message: doc.message ?? "",
    lines: doc.lines,
    totalAmount: doc.totalAmount,
    currency: doc.currency,
    status: doc.status,
    createdAt: toIso(doc.createdAt) ?? new Date().toISOString(),
    updatedAt: toIso(doc.updatedAt),
  };
}

export type PublicOrder = SerializedShopOrder;

function normalizeVariants(raw: unknown): ProductVariant[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error("Au moins une variante est requise.");
  }
  const variants: ProductVariant[] = [];
  const skus = new Set<string>();

  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const v = row as Record<string, unknown>;
    const sku = typeof v.sku === "string" ? v.sku.trim().toUpperCase() : "";
    if (!sku) throw new Error("SKU requis pour chaque variante.");
    if (skus.has(sku)) throw new Error(`SKU en double : ${sku}`);
    skus.add(sku);

    const stock =
      typeof v.stock === "number"
        ? v.stock
        : Number.parseInt(String(v.stock ?? "0"), 10);
    const price =
      typeof v.price === "number"
        ? v.price
        : Number.parseInt(String(v.price ?? "0"), 10);

    if (!Number.isFinite(stock) || stock < 0) {
      throw new Error(`Stock invalide pour ${sku}.`);
    }
    if (!Number.isFinite(price) || price < 0) {
      throw new Error(`Prix invalide pour ${sku}.`);
    }

    const size =
      typeof v.size === "string" && v.size.trim() ? v.size.trim() : undefined;
    const color =
      typeof v.color === "string" && v.color.trim()
        ? v.color.trim()
        : undefined;

    variants.push({ sku, size, color, stock, price });
  }

  if (variants.length === 0) {
    throw new Error("Au moins une variante valide est requise.");
  }
  return variants;
}

export async function listPublicProducts(filters?: {
  category?: string;
  q?: string;
}): Promise<PublicProduct[]> {
  const db = await tryDb();
  const category = filters?.category;
  const q = filters?.q?.trim().toLowerCase();

  const applyFilters = (list: PublicProduct[]) =>
    list.filter((p) => {
      if (category && category !== "all" && p.category !== category) return false;
      if (q) {
        const hay = `${p.name} ${p.description} ${p.slug}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

  if (!db) return applyFilters(FALLBACK_PRODUCTS);

  try {
    const filter: Filter<ProductRecord> = {};
    if (category && category !== "all" && isProductCategory(category)) {
      filter.category = category;
    }
    const docs = await db
      .collection<ProductRecord>("products")
      .find(filter)
      .sort({ name: 1 })
      .limit(200)
      .toArray();

    if (docs.length === 0) return applyFilters(FALLBACK_PRODUCTS);
    return applyFilters(docs.map((doc) => serializeProduct(doc)));
  } catch {
    return applyFilters(FALLBACK_PRODUCTS);
  }
}

export async function getPublicProductBySlug(
  slug: string,
): Promise<PublicProduct | null> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;

  const db = await tryDb();
  if (!db) {
    return FALLBACK_PRODUCTS.find((p) => p.slug === normalized) ?? null;
  }

  try {
    const doc = await db
      .collection<ProductRecord>("products")
      .findOne({ slug: normalized });
    if (doc) return serializeProduct(doc);
    return FALLBACK_PRODUCTS.find((p) => p.slug === normalized) ?? null;
  } catch {
    return FALLBACK_PRODUCTS.find((p) => p.slug === normalized) ?? null;
  }
}

export async function listAdminProducts(filters?: {
  q?: string;
  category?: string;
}): Promise<PublicProduct[]> {
  const db = await tryDb();
  if (!db) return [];

  const filter: Filter<ProductRecord> = {};
  if (filters?.category && filters.category !== "all") {
    if (isProductCategory(filters.category)) {
      filter.category = filters.category;
    }
  }

  const docs = await db
    .collection<ProductRecord>("products")
    .find(filter)
    .sort({ updatedAt: -1 })
    .limit(200)
    .toArray();

  let products = docs.map((doc) => serializeProduct(doc));
  const q = filters?.q?.trim().toLowerCase();
  if (q) {
    products = products.filter((p) => {
      const hay = `${p.name} ${p.slug} ${p.description} ${p.variants.map((v) => v.sku).join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }
  return products;
}

export async function getAdminProduct(
  id: string,
): Promise<PublicProduct | null> {
  const db = await tryDb();
  if (!db || !ObjectId.isValid(id)) return null;
  const doc = await db
    .collection<ProductRecord>("products")
    .findOne({ _id: new ObjectId(id) });
  return doc ? serializeProduct(doc) : null;
}

export async function createProduct(input: {
  name: string;
  slug?: string;
  category: ProductCategory;
  description: string;
  photo?: string;
  featured?: boolean;
  variants: unknown;
}): Promise<PublicProduct | null> {
  const db = await tryDb();
  if (!db) return null;

  const name = input.name.trim();
  if (name.length < 2) throw new Error("Nom du produit requis.");
  if (!isProductCategory(input.category)) {
    throw new Error("Catégorie invalide.");
  }

  const variants = normalizeVariants(input.variants);
  let slug = (input.slug?.trim() || slugifyProductName(name)).toLowerCase();
  if (!slug) slug = `produit-${Date.now().toString(36)}`;

  const existing = await db.collection("products").findOne({ slug });
  if (existing) throw new Error("Ce slug existe déjà.");

  const now = new Date();
  const doc: Omit<ProductDoc, "_id"> = {
    name,
    slug,
    category: input.category,
    description: input.description.trim() || "—",
    photo: input.photo?.trim() || "/images/boutique-produits.jpg",
    currency: "XOF",
    variants,
    featured: Boolean(input.featured),
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection("products").insertOne(doc as never);
  return serializeProduct({ ...doc, _id: result.insertedId } as ProductRecord);
}

export async function updateProduct(
  id: string,
  input: {
    name?: string;
    slug?: string;
    category?: ProductCategory;
    description?: string;
    photo?: string;
    featured?: boolean;
    variants?: unknown;
  },
): Promise<PublicProduct | null> {
  const db = await tryDb();
  if (!db || !ObjectId.isValid(id)) return null;

  const existing = await db
    .collection<ProductRecord>("products")
    .findOne({ _id: new ObjectId(id) });
  if (!existing) return null;

  const patch: Partial<ProductDoc> = { updatedAt: new Date() };

  if (input.name !== undefined) {
    const name = input.name.trim();
    if (name.length < 2) throw new Error("Nom invalide.");
    patch.name = name;
  }
  if (input.slug !== undefined) {
    const slug = input.slug.trim().toLowerCase() || slugifyProductName(existing.name);
    const clash = await db.collection("products").findOne({
      slug,
      _id: { $ne: existing._id },
    });
    if (clash) throw new Error("Ce slug existe déjà.");
    patch.slug = slug;
  }
  if (input.category !== undefined) {
    if (!isProductCategory(input.category)) throw new Error("Catégorie invalide.");
    patch.category = input.category;
  }
  if (input.description !== undefined) {
    patch.description = input.description.trim() || "—";
  }
  if (input.photo !== undefined) {
    patch.photo = input.photo.trim() || "/images/boutique-produits.jpg";
  }
  if (input.featured !== undefined) {
    patch.featured = Boolean(input.featured);
  }
  if (input.variants !== undefined) {
    patch.variants = normalizeVariants(input.variants);
  }

  await db.collection("products").updateOne(
    { _id: existing._id },
    { $set: patch },
  );

  const updated = await db
    .collection<ProductRecord>("products")
    .findOne({ _id: existing._id });
  return updated ? serializeProduct(updated) : null;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const db = await tryDb();
  if (!db || !ObjectId.isValid(id)) return false;
  const result = await db
    .collection("products")
    .deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
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
        `Stock insuffisant pour ${product.name} (${variantLabel(variant)}) — dispo : ${variant.stock}.`,
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

  const { clientId } = await touchClient({
    name: doc.clientName,
    email: doc.clientEmail,
    phone: doc.clientPhone,
    activity: "boutique",
    interaction: {
      type: "shop_order",
      title: "Commande boutique",
      message: `Commande ${doc.orderNumber} · ${lines.length} article(s)`,
      refType: "shop_order",
      refId: result.insertedId.toString(),
    },
  });

  if (clientId) {
    await linkProjectAndInvoice({
      clientId,
      clientName: doc.clientName,
      clientEmail: doc.clientEmail,
      activity: "boutique",
      title: `Boutique · ${doc.orderNumber}`,
      amount: doc.totalAmount,
      sourceType: "shop_order",
      sourceId: result.insertedId.toString(),
      invoiceStatus: "brouillon",
      projectStatus: "ouvert",
    });
  }

  return {
    ...serializeOrder(doc, result.insertedId.toString()),
    persisted: true as const,
  };
}

export async function listOrdersByEmail(email: string): Promise<PublicOrder[]> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return [];

  const db = await tryDb();
  if (!db) return [];

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

export async function listAdminOrders(filters?: {
  q?: string;
  status?: string;
}): Promise<PublicOrder[]> {
  const db = await tryDb();
  if (!db) return [];

  const filter: Filter<OrderRecord> = {};
  if (filters?.status && filters.status !== "all" && isOrderStatus(filters.status)) {
    filter.status = filters.status;
  }

  const docs = await db
    .collection<OrderRecord>("shopOrders")
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();

  let orders = docs.map((doc) => serializeOrder(doc, doc._id.toString()));
  const q = filters?.q?.trim().toLowerCase();
  if (q) {
    orders = orders.filter((o) => {
      const hay = `${o.orderNumber} ${o.clientName} ${o.clientEmail} ${o.clientPhone}`.toLowerCase();
      return hay.includes(q);
    });
  }
  return orders;
}

export async function getAdminOrder(id: string): Promise<PublicOrder | null> {
  const db = await tryDb();
  if (!db || !ObjectId.isValid(id)) return null;
  const doc = await db
    .collection<OrderRecord>("shopOrders")
    .findOne({ _id: new ObjectId(id) });
  return doc ? serializeOrder(doc, doc._id.toString()) : null;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<PublicOrder | null> {
  const db = await tryDb();
  if (!db || !ObjectId.isValid(id)) return null;
  if (!isOrderStatus(status)) throw new Error("Statut invalide.");

  const existing = await db
    .collection<OrderRecord>("shopOrders")
    .findOne({ _id: new ObjectId(id) });
  if (!existing) return null;

  const now = new Date();
  const prev = existing.status;

  if (prev !== "annulee" && status === "annulee") {
    for (const line of existing.lines) {
      await db.collection("products").updateOne(
        { slug: line.productSlug, "variants.sku": line.sku },
        {
          $inc: { "variants.$.stock": line.quantity },
          $set: { updatedAt: now },
        },
      );
    }
  }

  if (prev === "annulee" && status !== "annulee") {
    for (const line of existing.lines) {
      await db.collection("products").updateOne(
        { slug: line.productSlug, "variants.sku": line.sku },
        {
          $inc: { "variants.$.stock": -line.quantity },
          $set: { updatedAt: now },
        },
      );
    }
  }

  await db.collection("shopOrders").updateOne(
    { _id: existing._id },
    { $set: { status, updatedAt: now } },
  );

  return getAdminOrder(id);
}

export async function getBoutiqueSalesStats() {
  const orders = await listAdminOrders();
  const active = orders.filter((o) => o.status !== "annulee");
  const revenue = active.reduce((sum, o) => sum + o.totalAmount, 0);
  const products = await listAdminProducts();
  const lowStock = products.filter((p) => p.stockTotal > 0 && p.stockTotal <= 5);
  const outOfStock = products.filter((p) => p.stockTotal === 0);

  return {
    ordersCount: orders.length,
    activeOrders: active.length,
    revenue,
    productsCount: products.length,
    lowStockCount: lowStock.length,
    outOfStockCount: outOfStock.length,
  };
}
