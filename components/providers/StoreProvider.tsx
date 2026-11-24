"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { api, ApiError } from "@/lib/api-client";
import {
  getEffectiveSalePrice,
  getEffectiveStock,
  getProductPrimaryImage,
  toISODateInput,
} from "@/lib/format";
import type {
  Cart,
  GuestCartItem,
  Product,
  ProductVariant,
  RentalProduct,
  WishlistItem,
} from "@/lib/types";
import { useAuth } from "./AuthProvider";
import { useToast } from "./ToastProvider";

const GUEST_CART_KEY = "utd_guest_cart_v1";
const RENTAL_DRAFT_KEY = "utd_rental_draft_v2";

export interface DisplayCartItem {
  id: string | number;
  productId: number;
  variantId: number | null;
  name: string;
  sku: string;
  image: string | null;
  variantLabel: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  maxStock: number;
}

export interface RentalDraftItem {
  rentalProductId: number;
  rentalVariantId: number | null;
  quantity: number;
}

export interface RentalDraft {
  startDate: string;
  endDate: string;
  items: RentalDraftItem[];
}

interface StoreContextValue {
  productsById: Record<number, Product>;
  registerProducts: (products: Product[]) => void;
  rentalProductsById: Record<number, RentalProduct>;
  registerRentalProducts: (products: RentalProduct[]) => void;
  cartItems: DisplayCartItem[];
  cartCount: number;
  cartSubtotal: number;
  isCartLoading: boolean;
  isCartDrawerOpen: boolean;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  addToCart: (
    product: Product,
    quantity?: number,
    variant?: ProductVariant | null,
    openDrawer?: boolean
  ) => Promise<void>;
  updateCartItemQuantity: (item: DisplayCartItem, newQty: number) => Promise<void>;
  removeCartItem: (item: DisplayCartItem) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  wishlistItems: WishlistItem[];
  isWishlisted: (productId: number) => boolean;
  toggleWishlist: (product: Product) => Promise<void>;
  refreshWishlist: () => Promise<void>;
  rentalDraft: RentalDraft | null;
  setRentalDraft: (draft: RentalDraft | null) => void;
  addRentalDraftItem: (
    item: RentalDraftItem,
    dates?: { startDate: string; endDate: string }
  ) => void;
  updateRentalDraftItemQty: (
    rentalProductId: number,
    rentalVariantId: number | null,
    quantity: number
  ) => void;
  removeRentalDraftItem: (
    rentalProductId: number,
    rentalVariantId: number | null
  ) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function readGuestCart(): GuestCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeGuestCart(items: GuestCartItem[]) {
  if (typeof window === "undefined") return;
  try {
    if (items.length === 0) {
      window.localStorage.removeItem(GUEST_CART_KEY);
    } else {
      window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
    }
  } catch {
    // ignore storage quota failures
  }
}

function getDefaultRentalDates() {
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 2);
  return {
    startDate: toISODateInput(start),
    endDate: toISODateInput(end),
  };
}

function writeRentalDraftStorage(draft: RentalDraft | null) {
  if (typeof window === "undefined") return;
  try {
    if (!draft || draft.items.length === 0) {
      window.sessionStorage.removeItem(RENTAL_DRAFT_KEY);
    } else {
      window.sessionStorage.setItem(RENTAL_DRAFT_KEY, JSON.stringify(draft));
    }
  } catch {
    // ignore storage failures
  }
}

export function StoreProvider({
  children,
  initialProducts = [],
  initialRentalProducts = [],
}: {
  children: React.ReactNode;
  initialProducts?: Product[];
  initialRentalProducts?: RentalProduct[];
}) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [productsById, setProductsById] = useState<Record<number, Product>>(() => {
    const map: Record<number, Product> = {};
    for (const p of initialProducts) {
      map[p.id] = p;
    }
    return map;
  });

  const [rentalProductsById, setRentalProductsById] = useState<
    Record<number, RentalProduct>
  >(() => {
    const map: Record<number, RentalProduct> = {};
    for (const rp of initialRentalProducts) {
      map[rp.id] = rp;
    }
    return map;
  });

  const [serverCart, setServerCart] = useState<Cart | null>(null);
  const [guestCart, setGuestCart] = useState<GuestCartItem[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [rentalDraft, setRentalDraftState] = useState<RentalDraft | null>(null);

  const syncedRef = useRef(false);

  const registerProducts = useCallback((list: Product[]) => {
    if (!list || list.length === 0) return;
    setProductsById((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const p of list) {
        if (!next[p.id] || next[p.id].updated_at !== p.updated_at) {
          next[p.id] = p;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, []);

  const registerRentalProducts = useCallback((list: RentalProduct[]) => {
    if (!list || list.length === 0) return;
    setRentalProductsById((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const rp of list) {
        if (!next[rp.id] || next[rp.id].updated_at !== rp.updated_at) {
          next[rp.id] = rp;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, []);

  // Ensure sale & rental catalogs are loaded in background if not seeded
  useEffect(() => {
    if (Object.keys(productsById).length === 0) {
      api
        .listProducts()
        .then(registerProducts)
        .catch(() => {});
    }
  }, [productsById, registerProducts]);

  useEffect(() => {
    if (Object.keys(rentalProductsById).length === 0) {
      api
        .listRentalProducts()
        .then(registerRentalProducts)
        .catch(() => {});
    }
  }, [rentalProductsById, registerRentalProducts]);

  // Hydrate guest cart & rental draft on mount asynchronously
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      setGuestCart(readGuestCart());
      if (typeof window !== "undefined") {
        try {
          const draftRaw = window.sessionStorage.getItem(RENTAL_DRAFT_KEY);
          if (draftRaw) {
            const parsed = JSON.parse(draftRaw) as RentalDraft | null;
            if (parsed && Array.isArray(parsed.items)) {
              setRentalDraftState(parsed);
            }
          }
        } catch {
          // ignore
        }
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const setRentalDraft = useCallback((draft: RentalDraft | null) => {
    const normalized =
      draft && Array.isArray(draft.items) && draft.items.length > 0 ? draft : null;
    setRentalDraftState(normalized);
    writeRentalDraftStorage(normalized);
  }, []);

  const addRentalDraftItem = useCallback(
    (
      item: RentalDraftItem,
      dates?: { startDate: string; endDate: string }
    ) => {
      setRentalDraftState((prev) => {
        const defaults = getDefaultRentalDates();
        const startDate = dates?.startDate || prev?.startDate || defaults.startDate;
        const endDate = dates?.endDate || prev?.endDate || defaults.endDate;
        const existingItems = prev?.items ?? [];
        const idx = existingItems.findIndex(
          (i) =>
            i.rentalProductId === item.rentalProductId &&
            i.rentalVariantId === item.rentalVariantId
        );
        const safeQty = Math.max(1, item.quantity);
        let nextItems: RentalDraftItem[];
        if (idx >= 0) {
          nextItems = existingItems.map((entry, i) =>
            i === idx ? { ...entry, quantity: safeQty } : entry
          );
        } else {
          nextItems = [...existingItems, { ...item, quantity: safeQty }];
        }
        const nextDraft: RentalDraft = { startDate, endDate, items: nextItems };
        writeRentalDraftStorage(nextDraft);
        return nextDraft;
      });
    },
    []
  );

  const updateRentalDraftItemQty = useCallback(
    (
      rentalProductId: number,
      rentalVariantId: number | null,
      quantity: number
    ) => {
      setRentalDraftState((prev) => {
        if (!prev) return null;
        const safeQty = Math.max(1, quantity);
        const nextDraft: RentalDraft = {
          ...prev,
          items: prev.items.map((entry) =>
            entry.rentalProductId === rentalProductId &&
            entry.rentalVariantId === rentalVariantId
              ? { ...entry, quantity: safeQty }
              : entry
          ),
        };
        writeRentalDraftStorage(nextDraft);
        return nextDraft;
      });
    },
    []
  );

  const removeRentalDraftItem = useCallback(
    (rentalProductId: number, rentalVariantId: number | null) => {
      setRentalDraftState((prev) => {
        if (!prev) return null;
        const remaining = prev.items.filter(
          (entry) =>
            !(
              entry.rentalProductId === rentalProductId &&
              entry.rentalVariantId === rentalVariantId
            )
        );
        const nextDraft =
          remaining.length > 0 ? { ...prev, items: remaining } : null;
        writeRentalDraftStorage(nextDraft);
        return nextDraft;
      });
    },
    []
  );

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsCartLoading(true);
    try {
      const cart = await api.getCart();
      setServerCart(cart);
      const missingIds = cart.items
        .map((i) => i.product)
        .filter((pid) => !productsById[pid]);
      if (missingIds.length > 0) {
        const fetched = await Promise.all(
          [...new Set(missingIds)].map((pid) =>
            api.getProduct(pid).catch(() => null)
          )
        );
        registerProducts(fetched.filter((p): p is Product => Boolean(p)));
      }
    } catch {
      // ignore initial 404/empty cart error
    } finally {
      setIsCartLoading(false);
    }
  }, [isAuthenticated, productsById, registerProducts]);

  const refreshWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlistItems([]);
      return;
    }
    try {
      const items = await api.listWishlistItems();
      setWishlistItems(Array.isArray(items) ? items : []);
    } catch {
      setWishlistItems([]);
    }
  }, [isAuthenticated]);

  // Sync guest cart to server cart upon login
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      syncedRef.current = false;
      Promise.resolve().then(() => {
        setServerCart(null);
        setWishlistItems([]);
      });
      return;
    }

    const syncAndLoad = async () => {
      if (!syncedRef.current) {
        syncedRef.current = true;
        const localItems = readGuestCart();
        if (localItems.length > 0) {
          let syncedCount = 0;
          for (const item of localItems) {
            try {
              await api.addCartItem({
                product: item.productId,
                variant: item.variantId,
                quantity: item.quantity,
              });
              syncedCount += 1;
            } catch {
              // ignore individual out-of-stock sync failure
            }
          }
          writeGuestCart([]);
          setGuestCart([]);
          if (syncedCount > 0) {
            showToast("Your shopping cart has been synced to your account.", "success");
          }
        }
      }
      await Promise.all([refreshCart(), refreshWishlist()]);
    };

    void syncAndLoad();
  }, [authLoading, isAuthenticated, refreshCart, refreshWishlist, showToast]);

  const cartItems = useMemo<DisplayCartItem[]>(() => {
    if (isAuthenticated && serverCart) {
      return serverCart.items.map((item) => {
        const product = productsById[item.product];
        const variant =
          product && item.variant
            ? product.variants.find((v) => v.id === item.variant) ?? null
            : null;
        const unitPrice = parseFloat(item.unit_price) || 0;
        const subtotal = parseFloat(item.subtotal) || unitPrice * item.quantity;
        const maxStock = product ? getEffectiveStock(product, variant) : 99;
        return {
          id: item.id,
          productId: item.product,
          variantId: item.variant,
          name: product?.name ?? `Equipment #${item.product}`,
          sku: variant?.sku || product?.sku || `UTD-${item.product}`,
          image: product ? getProductPrimaryImage(product) : null,
          variantLabel: variant ? `${variant.name}: ${variant.value}` : null,
          quantity: item.quantity,
          unitPrice,
          subtotal,
          maxStock,
        };
      });
    }

    return guestCart.map((g) => {
      const product = productsById[g.productId];
      const variant =
        product && g.variantId
          ? product.variants.find((v) => v.id === g.variantId) ?? null
          : null;
      const unitPrice = product
        ? getEffectiveSalePrice(product, variant)
        : g.snapshot?.unitPrice ?? 0;
      const maxStock = product
        ? getEffectiveStock(product, variant)
        : g.snapshot?.maxStock ?? 99;
      return {
        id: `${g.productId}-${g.variantId ?? "base"}`,
        productId: g.productId,
        variantId: g.variantId,
        name: product?.name ?? g.snapshot?.name ?? `Equipment #${g.productId}`,
        sku: variant?.sku || product?.sku || g.snapshot?.sku || `UTD-${g.productId}`,
        image: product ? getProductPrimaryImage(product) : g.snapshot?.image ?? null,
        variantLabel: variant
          ? `${variant.name}: ${variant.value}`
          : g.snapshot?.variantLabel ?? null,
        quantity: g.quantity,
        unitPrice,
        subtotal: unitPrice * g.quantity,
        maxStock,
      };
    });
  }, [isAuthenticated, serverCart, guestCart, productsById]);

  const cartCount = useMemo(() => {
    if (isAuthenticated && serverCart) {
      return serverCart.total_quantity ?? cartItems.reduce((a, b) => a + b.quantity, 0);
    }
    return cartItems.reduce((a, b) => a + b.quantity, 0);
  }, [isAuthenticated, serverCart, cartItems]);

  const cartSubtotal = useMemo(() => {
    if (isAuthenticated && serverCart && serverCart.subtotal) {
      return parseFloat(serverCart.subtotal) || 0;
    }
    return cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  }, [isAuthenticated, serverCart, cartItems]);

  const addToCart = useCallback(
    async (
      product: Product,
      quantity = 1,
      variant: ProductVariant | null = null,
      openDrawer = true
    ) => {
      registerProducts([product]);

      const activeVariants = (product.variants ?? []).filter((v) => v.is_active);
      if (activeVariants.length > 0 && !variant) {
        showToast("Please select a product option first.", "warning");
        return;
      }

      const maxStock = getEffectiveStock(product, variant);
      if (maxStock <= 0 || !product.is_available) {
        showToast("This item is currently out of stock.", "error");
        return;
      }

      const clampedQty = Math.min(Math.max(1, quantity), maxStock);

      if (isAuthenticated) {
        try {
          await api.addCartItem({
            product: product.id,
            variant: variant?.id ?? null,
            quantity: clampedQty,
          });
          await refreshCart();
          showToast(`Added ${product.name} to cart.`, "success");
          if (openDrawer) setIsCartDrawerOpen(true);
        } catch (err) {
          const msg =
            err instanceof ApiError ? err.message : "Could not add item to cart.";
          showToast(msg, "error");
        }
        return;
      }

      setGuestCart((prev) => {
        const variantId = variant?.id ?? null;
        const idx = prev.findIndex(
          (i) => i.productId === product.id && i.variantId === variantId
        );
        let next: GuestCartItem[];
        if (idx >= 0) {
          const newQty = Math.min(prev[idx].quantity + clampedQty, maxStock);
          if (newQty === prev[idx].quantity) {
            showToast("Maximum stock reached for this item.", "warning");
          }
          next = prev.map((item, i) =>
            i === idx ? { ...item, quantity: newQty } : item
          );
        } else {
          next = [
            ...prev,
            {
              productId: product.id,
              variantId,
              quantity: clampedQty,
              snapshot: {
                name: product.name,
                sku: variant?.sku || product.sku,
                image: getProductPrimaryImage(product),
                unitPrice: getEffectiveSalePrice(product, variant),
                maxStock,
                variantLabel: variant ? `${variant.name}: ${variant.value}` : null,
              },
            },
          ];
        }
        writeGuestCart(next);
        return next;
      });
      showToast(`Added ${product.name} to cart.`, "success");
      if (openDrawer) setIsCartDrawerOpen(true);
    },
    [isAuthenticated, refreshCart, registerProducts, showToast]
  );

  const updateCartItemQuantity = useCallback(
    async (item: DisplayCartItem, newQty: number) => {
      if (newQty <= 0) {
        if (isAuthenticated && typeof item.id === "number") {
          await api.removeCartItem(item.id);
          await refreshCart();
        } else {
          setGuestCart((prev) => {
            const next = prev.filter(
              (g) => !(g.productId === item.productId && g.variantId === item.variantId)
            );
            writeGuestCart(next);
            return next;
          });
        }
        return;
      }

      if (newQty > item.maxStock) {
        showToast("Maximum stock reached.", "warning");
        newQty = item.maxStock;
      }

      if (isAuthenticated && typeof item.id === "number") {
        try {
          await api.updateCartItem(item.id, newQty);
          await refreshCart();
        } catch (err) {
          showToast(
            err instanceof ApiError ? err.message : "Failed to update cart quantity.",
            "error"
          );
        }
        return;
      }

      setGuestCart((prev) => {
        const next = prev.map((g) =>
          g.productId === item.productId && g.variantId === item.variantId
            ? { ...g, quantity: newQty }
            : g
        );
        writeGuestCart(next);
        return next;
      });
    },
    [isAuthenticated, refreshCart, showToast]
  );

  const removeCartItem = useCallback(
    async (item: DisplayCartItem) => {
      if (isAuthenticated && typeof item.id === "number") {
        try {
          await api.removeCartItem(item.id);
          await refreshCart();
          showToast("Item removed from cart.", "info");
        } catch (err) {
          showToast(
            err instanceof ApiError ? err.message : "Could not remove item.",
            "error"
          );
        }
        return;
      }

      setGuestCart((prev) => {
        const next = prev.filter(
          (g) => !(g.productId === item.productId && g.variantId === item.variantId)
        );
        writeGuestCart(next);
        return next;
      });
      showToast("Item removed from cart.", "info");
    },
    [isAuthenticated, refreshCart, showToast]
  );

  const clearCart = useCallback(async () => {
    if (isAuthenticated) {
      try {
        await api.clearCart();
        await refreshCart();
        showToast("Cart cleared.", "info");
      } catch (err) {
        showToast(
          err instanceof ApiError ? err.message : "Failed to clear cart.",
          "error"
        );
      }
      return;
    }
    writeGuestCart([]);
    setGuestCart([]);
    showToast("Cart cleared.", "info");
  }, [isAuthenticated, refreshCart, showToast]);

  const isWishlisted = useCallback(
    (productId: number) => wishlistItems.some((w) => w.product === productId),
    [wishlistItems]
  );

  const toggleWishlist = useCallback(
    async (product: Product) => {
      if (!isAuthenticated) {
        showToast("Please sign in to save tools to your wishlist.", "warning");
        return;
      }
      const existing = wishlistItems.find((w) => w.product === product.id);
      try {
        if (existing) {
          await api.removeWishlistItem(existing.id);
          setWishlistItems((prev) => prev.filter((w) => w.id !== existing.id));
          showToast(`Removed ${product.name} from wishlist.`, "info");
        } else {
          const created = await api.addWishlistItem(product.id);
          setWishlistItems((prev) => [...prev, created]);
          showToast(`Saved ${product.name} to wishlist.`, "success");
        }
      } catch (err) {
        showToast(
          err instanceof ApiError ? err.message : "Wishlist update failed.",
          "error"
        );
      }
    },
    [isAuthenticated, wishlistItems, showToast]
  );

  const value: StoreContextValue = {
    productsById,
    registerProducts,
    rentalProductsById,
    registerRentalProducts,
    cartItems,
    cartCount,
    cartSubtotal,
    isCartLoading,
    isCartDrawerOpen,
    openCartDrawer: () => setIsCartDrawerOpen(true),
    closeCartDrawer: () => setIsCartDrawerOpen(false),
    addToCart,
    updateCartItemQuantity,
    removeCartItem,
    clearCart,
    refreshCart,
    wishlistItems,
    isWishlisted,
    toggleWishlist,
    refreshWishlist,
    rentalDraft,
    setRentalDraft,
    addRentalDraftItem,
    updateRentalDraftItemQty,
    removeRentalDraftItem,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return ctx;
}
