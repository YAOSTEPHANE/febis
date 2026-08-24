import type { ProductDoc, ProductVariant, ShopOrderLine } from "@/lib/types";
import {
  formatXof,
  isOrderStatus,
  isProductCategory,
  minPrice,
  orderStatusLabel,
  productCategoryLabel,
  totalStock,
  variantLabel,
  type SerializedProduct,
} from "@/lib/boutique-shared";

export {
  formatXof,
  isOrderStatus,
  isProductCategory,
  minPrice,
  orderStatusLabel,
  productCategoryLabel,
  totalStock,
  variantLabel,
};
export type { SerializedProduct };
export type { CartItem, SerializedShopOrder } from "@/lib/boutique-shared";

export function serializeProduct(
  doc: Omit<ProductDoc, "_id"> & { _id?: { toString(): string } },
): SerializedProduct {
  return {
    id: doc._id?.toString?.() ?? "",
    name: doc.name,
    slug: doc.slug,
    category: doc.category,
    description: doc.description,
    photo: doc.photo,
    currency: doc.currency,
    variants: doc.variants,
    featured: doc.featured ?? false,
    stockTotal: totalStock(doc.variants),
    priceFrom: minPrice(doc.variants),
    createdAt:
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : doc.createdAt
          ? String(doc.createdAt)
          : null,
    updatedAt:
      doc.updatedAt instanceof Date
        ? doc.updatedAt.toISOString()
        : doc.updatedAt
          ? String(doc.updatedAt)
          : null,
  };
}

export type PublicProduct = SerializedProduct;

export function buildOrderLine(input: {
  product: PublicProduct;
  sku: string;
  quantity: number;
}): ShopOrderLine {
  const variant = input.product.variants.find((v) => v.sku === input.sku);
  if (!variant) {
    throw new Error(`Variante introuvable : ${input.sku}`);
  }
  const quantity = Math.max(1, input.quantity);
  return {
    productSlug: input.product.slug,
    productName: input.product.name,
    sku: variant.sku,
    size: variant.size,
    color: variant.color,
    quantity,
    unitPrice: variant.price,
    lineTotal: quantity * variant.price,
  };
}

function withTotals(variants: ProductVariant[]): {
  variants: ProductVariant[];
  stockTotal: number;
  priceFrom: number;
} {
  return {
    variants,
    stockTotal: totalStock(variants),
    priceFrom: minPrice(variants),
  };
}

export const FALLBACK_PRODUCTS: PublicProduct[] = [
  {
    id: "p-1",
    name: "Chemise premium Abidjan",
    slug: "chemise-premium-abidjan",
    category: "mode",
    description: "Chemise coton légère, coupe moderne — idéale bureau & soirée.",
    photo: "/images/boutique-produits.jpg",
    currency: "XOF",
    featured: true,
    ...withTotals([
      { sku: "CHEM-R-S", size: "S", color: "Rouge FEBiS", stock: 8, price: 28000 },
      { sku: "CHEM-R-M", size: "M", color: "Rouge FEBiS", stock: 14, price: 28000 },
      { sku: "CHEM-R-L", size: "L", color: "Rouge FEBiS", stock: 6, price: 28000 },
      { sku: "CHEM-I-M", size: "M", color: "Ivoire", stock: 10, price: 28000 },
      { sku: "CHEM-I-L", size: "L", color: "Ivoire", stock: 4, price: 28000 },
    ]),
    createdAt: null,
    updatedAt: null,
  },
  {
    id: "p-2",
    name: "Coussin décor or",
    slug: "coussin-decor-or",
    category: "maison",
    description: "Coussin décoratif texture métallique pour salons premium.",
    photo: "/images/pole-boutique.jpg",
    currency: "XOF",
    featured: true,
    ...withTotals([
      { sku: "COUS-OR-40", size: "40×40", color: "Or", stock: 20, price: 15000 },
      { sku: "COUS-OR-50", size: "50×50", color: "Or", stock: 12, price: 18000 },
      { sku: "COUS-RG-40", size: "40×40", color: "Rouge", stock: 15, price: 15000 },
    ]),
    createdAt: null,
    updatedAt: null,
  },
  {
    id: "p-3",
    name: "Sac cabas FEBiS",
    slug: "sac-cabas-febis",
    category: "accessoires",
    description: "Cabas toile renforcée avec finitions cuir — usage quotidien.",
    photo: "/images/boutique-produits.jpg",
    currency: "XOF",
    featured: true,
    ...withTotals([
      { sku: "SAC-NOIR", color: "Noir", stock: 18, price: 22000 },
      { sku: "SAC-ROUGE", color: "Rouge", stock: 9, price: 22000 },
      { sku: "SAC-BEIGE", color: "Beige", stock: 0, price: 22000 },
    ]),
    createdAt: null,
    updatedAt: null,
  },
  {
    id: "p-4",
    name: "Parfum Ambiance Lagune",
    slug: "parfum-ambiance-lagune",
    category: "beaute",
    description: "Fragrance d’intérieur notes boisées et agrumes ivoire.",
    photo: "/images/pole-boutique.jpg",
    currency: "XOF",
    featured: false,
    ...withTotals([
      { sku: "PARF-100", size: "100 ml", stock: 25, price: 12000 },
      { sku: "PARF-200", size: "200 ml", stock: 11, price: 19000 },
    ]),
    createdAt: null,
    updatedAt: null,
  },
  {
    id: "p-5",
    name: "Pantalon tailleur",
    slug: "pantalon-tailleur",
    category: "mode",
    description: "Pantalon coupe droite stretch, finition soignée.",
    photo: "/images/boutique-produits.jpg",
    currency: "XOF",
    featured: false,
    ...withTotals([
      { sku: "PANT-N-36", size: "36", color: "Noir", stock: 5, price: 35000 },
      { sku: "PANT-N-38", size: "38", color: "Noir", stock: 7, price: 35000 },
      { sku: "PANT-N-40", size: "40", color: "Noir", stock: 3, price: 35000 },
      { sku: "PANT-G-38", size: "38", color: "Gris", stock: 4, price: 35000 },
    ]),
    createdAt: null,
    updatedAt: null,
  },
  {
    id: "p-6",
    name: "Set table ivoire",
    slug: "set-table-ivoire",
    category: "maison",
    description: "Set de table textile pour 6 couverts — ambiance élégante.",
    photo: "/images/pole-boutique.jpg",
    currency: "XOF",
    featured: false,
    ...withTotals([
      { sku: "SET-IV-6", size: "6 pièces", color: "Ivoire", stock: 8, price: 27000 },
      { sku: "SET-OR-6", size: "6 pièces", color: "Or", stock: 2, price: 29000 },
    ]),
    createdAt: null,
    updatedAt: null,
  },
];

export const BOUTIQUE_PROCESS = [
  {
    title: "Fiches produits",
    text: "Photos, description, prix et stock centralisés par article.",
  },
  {
    title: "Variantes",
    text: "Taille, couleur et SKU gérés avec stock indépendant.",
  },
  {
    title: "Panier → commande",
    text: "Tunnel client : sélection, panier, validation et confirmation.",
  },
  {
    title: "Historique ventes",
    text: "Suivi des commandes passées et totaux par client.",
  },
] as const;
