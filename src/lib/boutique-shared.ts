import type {
  OrderStatus,
  ProductCategory,
  ProductVariant,
  ShopOrderLine,
} from "@/lib/types";
import { ORDER_STATUSES, PRODUCT_CATEGORIES } from "@/lib/types";
import { formatXof } from "@/lib/crm-shared";

export { formatXof, ORDER_STATUSES, PRODUCT_CATEGORIES };
export type { OrderStatus, ProductCategory, ProductVariant, ShopOrderLine };

export type SerializedProduct = {
  id: string;
  name: string;
  slug: string;
  category: ProductCategory;
  description: string;
  photo: string;
  currency: "XOF";
  variants: ProductVariant[];
  featured: boolean;
  stockTotal: number;
  priceFrom: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export type SerializedShopOrder = {
  id: string;
  orderNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  deliveryAddress: string;
  message: string;
  lines: ShopOrderLine[];
  totalAmount: number;
  currency: "XOF";
  status: OrderStatus;
  createdAt: string;
  updatedAt: string | null;
};

export type CartItem = {
  slug: string;
  sku: string;
  productName: string;
  photo: string;
  size?: string;
  color?: string;
  unitPrice: number;
  quantity: number;
  maxStock: number;
};

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

export function variantLabel(
  variant: Pick<ProductVariant, "size" | "color">,
): string {
  const parts = [variant.color, variant.size].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "Standard";
}

export function totalStock(variants: ProductVariant[]): number {
  return variants.reduce((sum, v) => sum + Math.max(0, v.stock), 0);
}

export function minPrice(variants: ProductVariant[]): number {
  if (variants.length === 0) return 0;
  return Math.min(...variants.map((v) => v.price));
}

export function slugifyProductName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function cartLineTotal(item: CartItem): number {
  return item.quantity * item.unitPrice;
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + cartLineTotal(item), 0);
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
