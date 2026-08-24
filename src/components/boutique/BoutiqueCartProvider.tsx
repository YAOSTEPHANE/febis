"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  cartCount,
  cartTotal,
  type CartItem,
} from "@/lib/boutique-shared";

const STORAGE_KEY = "febis-boutique-cart-v1";

type CartContextValue = {
  items: CartItem[];
  ready: boolean;
  count: number;
  total: number;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  setQuantity: (slug: string, sku: string, quantity: number) => void;
  removeItem: (slug: string, sku: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (row): row is CartItem =>
        !!row &&
        typeof row === "object" &&
        typeof (row as CartItem).slug === "string" &&
        typeof (row as CartItem).sku === "string" &&
        typeof (row as CartItem).productName === "string" &&
        typeof (row as CartItem).unitPrice === "number" &&
        typeof (row as CartItem).quantity === "number",
    );
  } catch {
    return [];
  }
}

export function BoutiqueCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(loadCart());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
      const qty = Math.max(1, item.quantity ?? 1);
      setItems((prev) => {
        const idx = prev.findIndex(
          (row) => row.slug === item.slug && row.sku === item.sku,
        );
        if (idx === -1) {
          return [
            ...prev,
            {
              ...item,
              quantity: Math.min(qty, Math.max(1, item.maxStock)),
            },
          ];
        }
        const next = [...prev];
        const current = next[idx]!;
        next[idx] = {
          ...current,
          ...item,
          quantity: Math.min(
            current.quantity + qty,
            Math.max(1, item.maxStock),
          ),
        };
        return next;
      });
    },
    [],
  );

  const setQuantity = useCallback(
    (slug: string, sku: string, quantity: number) => {
      setItems((prev) =>
        prev
          .map((row) => {
            if (row.slug !== slug || row.sku !== sku) return row;
            const q = Math.max(0, Math.min(quantity, row.maxStock));
            return { ...row, quantity: q };
          })
          .filter((row) => row.quantity > 0),
      );
    },
    [],
  );

  const removeItem = useCallback((slug: string, sku: string) => {
    setItems((prev) =>
      prev.filter((row) => !(row.slug === slug && row.sku === sku)),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      ready,
      count: cartCount(items),
      total: cartTotal(items),
      addItem,
      setQuantity,
      removeItem,
      clear,
    }),
    [items, ready, addItem, setQuantity, removeItem, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useBoutiqueCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useBoutiqueCart doit être utilisé dans BoutiqueCartProvider");
  }
  return ctx;
}
