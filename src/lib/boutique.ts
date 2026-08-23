import type {
  OrderStatus,
  ProductCategory,
  ProductDoc,
  ProductVariant,
  ShopOrderLine,
} from "@/lib/types";
import {
  ORDER_STATUSES,
  PRODUCT_CATEGORIES,
} from "@/lib/types";
import { formatXof } from "@/lib/residences";

export { formatXof };

export function productCategoryLabel(category: ProductCategory): string {
  switch (category) {
    case "mode":
      return "Mode";
    case "maison":
      return "Maison";
    case "accessoires":
      return "Accessoires";
    case "beaute":
      return "Beauté";
    default: {
      const _exhaustive: never = category;
      return _exhaustive;
    }
  }
}

export function orderStatusLabel(status: OrderStatus): string {
  switch (status) {
    case "en_attente":
      return "En attente";
    case "confirmee":
      return "Confirmée";
    case "expediee":
      return "Expédiée";
    case "livree":
      return "Livrée";
    case "annulee":
      return "Annulée";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function isProductCategory(value: string): value is ProductCategory {
  return (PRODUCT_CATEGORIES as readonly string[]).includes(value);
}

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

export function variantLabel(variant: Pick<ProductVariant, "size" | "color">): string {
  const parts = [variant.color, variant.size].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "Standard";
}

export function totalStock(variants: ProductVariant[]): number {
  return variants.reduce((sum, v) => sum + v.stock, 0);
}

export function minPrice(variants: ProductVariant[]): number {
  if (variants.length === 0) return 0;
  return Math.min(...variants.map((v) => v.price));
}

export function serializeProduct(
  doc: ProductDoc & { _id?: { toString(): string } },
) {
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
  };
}

export type PublicProduct = ReturnType<typeof serializeProduct>;

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
    variants: [
      { sku: "CHEM-R-S", size: "S", color: "Rouge FEBiS", stock: 8, price: 28000 },
      { sku: "CHEM-R-M", size: "M", color: "Rouge FEBiS", stock: 14, price: 28000 },
      { sku: "CHEM-R-L", size: "L", color: "Rouge FEBiS", stock: 6, price: 28000 },
      { sku: "CHEM-I-M", size: "M", color: "Ivoire", stock: 10, price: 28000 },
      { sku: "CHEM-I-L", size: "L", color: "Ivoire", stock: 4, price: 28000 },
    ],
    stockTotal: 42,
    priceFrom: 28000,
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
    variants: [
      { sku: "COUS-OR-40", size: "40×40", color: "Or", stock: 20, price: 15000 },
      { sku: "COUS-OR-50", size: "50×50", color: "Or", stock: 12, price: 18000 },
      { sku: "COUS-RG-40", size: "40×40", color: "Rouge", stock: 15, price: 15000 },
    ],
    stockTotal: 47,
    priceFrom: 15000,
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
    variants: [
      { sku: "SAC-NOIR", color: "Noir", stock: 18, price: 22000 },
      { sku: "SAC-ROUGE", color: "Rouge", stock: 9, price: 22000 },
      { sku: "SAC-BEIGE", color: "Beige", stock: 0, price: 22000 },
    ],
    stockTotal: 27,
    priceFrom: 22000,
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
    variants: [
      { sku: "PARF-100", size: "100 ml", stock: 25, price: 12000 },
      { sku: "PARF-200", size: "200 ml", stock: 11, price: 19000 },
    ],
    stockTotal: 36,
    priceFrom: 12000,
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
    variants: [
      { sku: "PANT-N-36", size: "36", color: "Noir", stock: 5, price: 35000 },
      { sku: "PANT-N-38", size: "38", color: "Noir", stock: 7, price: 35000 },
      { sku: "PANT-N-40", size: "40", color: "Noir", stock: 3, price: 35000 },
      { sku: "PANT-G-38", size: "38", color: "Gris", stock: 4, price: 35000 },
    ],
    stockTotal: 19,
    priceFrom: 35000,
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
    variants: [
      { sku: "SET-IV-6", size: "6 pièces", color: "Ivoire", stock: 8, price: 27000 },
      { sku: "SET-OR-6", size: "6 pièces", color: "Or", stock: 2, price: 29000 },
    ],
    stockTotal: 10,
    priceFrom: 27000,
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
