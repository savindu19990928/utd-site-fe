import type {
  Address,
  AddressPayload,
  AssignMachinesPayload,
  AuthTokens,
  Brand,
  Cart,
  CartItem,
  Category,
  CheckoutPayload,
  Coupon,
  CreateRentalPayload,
  Order,
  Payment,
  PaymentMethod,
  Product,
  ProductImage,
  ProductQueryParams,
  ProductReview,
  ProductSpecification,
  ProductVariant,
  Refund,
  RegisterPayload,
  Rental,
  RentalAvailabilityResponse,
  RentalCategory,
  RentalMachine,
  RentalMachineStatus,
  RentalProduct,
  RentalProductImage,
  RentalProductPayload,
  RentalProductQueryParams,
  RentalProductReview,
  RentalProductSpecification,
  RentalProductVariant,
  RentalStatus,
  UserProfile,
  Wishlist,
  WishlistItem,
} from "./types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.universaltooldepot.lk";

const REFRESH_STORAGE_KEY = "utd_refresh_token";
const ACCESS_STORAGE_KEY = "utd_access_token";

let inMemoryAccessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;
let onAuthExpiredCallback: (() => void) | null = null;

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export function setAuthExpiredHandler(cb: (() => void) | null) {
  onAuthExpiredCallback = cb;
}

export function getAccessToken(): string | null {
  if (inMemoryAccessToken) return inMemoryAccessToken;
  if (typeof window !== "undefined") {
    const stored =
      window.sessionStorage.getItem(ACCESS_STORAGE_KEY) ||
      window.localStorage.getItem(ACCESS_STORAGE_KEY);
    if (stored) {
      inMemoryAccessToken = stored;
      return stored;
    }
  }
  return null;
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_STORAGE_KEY);
}

export function setAuthTokens(tokens: Partial<AuthTokens> | null) {
  if (!tokens) {
    inMemoryAccessToken = null;
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(ACCESS_STORAGE_KEY);
      window.localStorage.removeItem(ACCESS_STORAGE_KEY);
      window.localStorage.removeItem(REFRESH_STORAGE_KEY);
    }
    return;
  }
  if (tokens.access) {
    inMemoryAccessToken = tokens.access;
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(ACCESS_STORAGE_KEY, tokens.access);
      window.localStorage.setItem(ACCESS_STORAGE_KEY, tokens.access);
    }
  }
  if (tokens.refresh && typeof window !== "undefined") {
    window.localStorage.setItem(REFRESH_STORAGE_KEY, tokens.refresh);
  }
}

export function extractErrorMessage(data: unknown, fallback = "Request failed"): string {
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (typeof obj.detail === "string") return obj.detail;
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.error === "string") return obj.error;
    const entries = Object.entries(obj);
    if (entries.length > 0) {
      const parts = entries.map(([k, v]) => {
        const msg = Array.isArray(v) ? v.join(", ") : String(v);
        return k === "non_field_errors" ? msg : `${k}: ${msg}`;
      });
      return parts.join(" | ");
    }
  }
  return fallback;
}

async function performTokenRefresh(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) {
      setAuthTokens(null);
      onAuthExpiredCallback?.();
      return null;
    }
    const json = (await res.json()) as { access?: string; refresh?: string };
    if (json.access) {
      setAuthTokens({ access: json.access, refresh: json.refresh ?? refresh });
      return json.access;
    }
    return null;
  } catch {
    return null;
  }
}

async function refreshAccessTokenSingleton(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = performTokenRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

interface RequestOptions extends RequestInit {
  auth?: boolean;
  skipRefresh?: boolean;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { auth = false, skipRefresh = false, headers: customHeaders, body, ...rest } =
    options;

  const buildHeaders = (tokenOverride?: string | null): HeadersInit => {
    const h: Record<string, string> = {};
    if (!(body instanceof FormData)) {
      h["Content-Type"] = "application/json";
    }
    const token =
      tokenOverride !== undefined ? tokenOverride : auth ? getAccessToken() : null;
    if (token) {
      h["Authorization"] = `Bearer ${token}`;
    }
    if (customHeaders) {
      Object.assign(h, customHeaders);
    }
    return h;
  };

  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  let res = await fetch(url, {
    ...rest,
    headers: buildHeaders(),
    body,
  });

  if (res.status === 401 && auth && !skipRefresh) {
    const newAccess = await refreshAccessTokenSingleton();
    if (newAccess) {
      res = await fetch(url, {
        ...rest,
        headers: buildHeaders(newAccess),
        body,
      });
    }
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null);

  if (!res.ok) {
    throw new ApiError(
      extractErrorMessage(payload, `HTTP ${res.status} Error`),
      res.status,
      payload
    );
  }

  return payload as T;
}

function toQueryString(params?: Record<string, unknown>): string {
  if (!params) return "";
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      qs.set(k, String(v));
    }
  });
  const query = qs.toString();
  return query ? `?${query}` : "";
}

export const api = {
  // Auth
  register: (data: RegisterPayload) =>
    apiRequest<{
      username: string;
      email: string;
      first_name: string;
      last_name: string;
    }>("/api/auth/register/", { method: "POST", body: JSON.stringify(data) }),

  login: (username: string, password: string) =>
    apiRequest<AuthTokens>("/api/auth/login/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  refresh: (refresh: string) =>
    apiRequest<{ access: string }>("/api/auth/token/refresh/", {
      method: "POST",
      body: JSON.stringify({ refresh }),
      skipRefresh: true,
    }),

  getProfile: () => apiRequest<UserProfile>("/api/auth/profile/", { auth: true }),

  updateProfile: (data: Partial<UserProfile>) =>
    apiRequest<UserProfile>("/api/auth/profile/", {
      method: "PATCH",
      auth: true,
      body: JSON.stringify(data),
    }),

  // Users & Addresses
  listUsers: () => apiRequest<UserProfile[]>("/api/users/", { auth: true }),

  listAddresses: () => apiRequest<Address[]>("/api/addresses/", { auth: true }),

  createAddress: (data: AddressPayload) =>
    apiRequest<Address>("/api/addresses/", {
      method: "POST",
      auth: true,
      body: JSON.stringify(data),
    }),

  updateAddress: (id: number, data: Partial<AddressPayload>) =>
    apiRequest<Address>(`/api/addresses/${id}/`, {
      method: "PATCH",
      auth: true,
      body: JSON.stringify(data),
    }),

  deleteAddress: (id: number) =>
    apiRequest<void>(`/api/addresses/${id}/`, { method: "DELETE", auth: true }),

  // Sale Categories & Brands
  listCategories: () => apiRequest<Category[]>("/api/categories/"),
  createCategory: (data: { name: string; description?: string }) =>
    apiRequest<Category>("/api/categories/", {
      method: "POST",
      auth: true,
      body: JSON.stringify(data),
    }),
  updateCategory: (id: number, data: Partial<{ name: string; description: string }>) =>
    apiRequest<Category>(`/api/categories/${id}/`, {
      method: "PATCH",
      auth: true,
      body: JSON.stringify(data),
    }),
  deleteCategory: (id: number) =>
    apiRequest<void>(`/api/categories/${id}/`, { method: "DELETE", auth: true }),

  listBrands: () => apiRequest<Brand[]>("/api/brands/"),
  createBrand: (data: { name: string }) =>
    apiRequest<Brand>("/api/brands/", {
      method: "POST",
      auth: true,
      body: JSON.stringify(data),
    }),
  deleteBrand: (id: number) =>
    apiRequest<void>(`/api/brands/${id}/`, { method: "DELETE", auth: true }),

  // Sale Products
  listProducts: (params?: ProductQueryParams) =>
    apiRequest<Product[]>(`/api/products/${toQueryString(params as Record<string, unknown>)}`),

  getProduct: (id: number | string) => apiRequest<Product>(`/api/products/${id}/`),

  createProduct: (data: Partial<Product>) =>
    apiRequest<Product>("/api/products/", {
      method: "POST",
      auth: true,
      body: JSON.stringify(data),
    }),

  updateProduct: (id: number, data: Partial<Product>) =>
    apiRequest<Product>(`/api/products/${id}/`, {
      method: "PATCH",
      auth: true,
      body: JSON.stringify(data),
    }),

  deleteProduct: (id: number) =>
    apiRequest<void>(`/api/products/${id}/`, { method: "DELETE", auth: true }),

  // Sale Variants, Specifications, Images
  createVariant: (data: Omit<ProductVariant, "id" | "available_stock">) =>
    apiRequest<ProductVariant>("/api/product-variants/", {
      method: "POST",
      auth: true,
      body: JSON.stringify(data),
    }),

  updateVariant: (id: number, data: Partial<ProductVariant>) =>
    apiRequest<ProductVariant>(`/api/product-variants/${id}/`, {
      method: "PATCH",
      auth: true,
      body: JSON.stringify(data),
    }),

  deleteVariant: (id: number) =>
    apiRequest<void>(`/api/product-variants/${id}/`, { method: "DELETE", auth: true }),

  createSpecification: (data: { product: number; name: string; value: string }) =>
    apiRequest<ProductSpecification>("/api/product-specifications/", {
      method: "POST",
      auth: true,
      body: JSON.stringify(data),
    }),

  deleteSpecification: (id: number) =>
    apiRequest<void>(`/api/product-specifications/${id}/`, {
      method: "DELETE",
      auth: true,
    }),

  uploadProductImage: (formData: FormData) =>
    apiRequest<ProductImage>("/api/product-images/", {
      method: "POST",
      auth: true,
      body: formData,
    }),

  deleteProductImage: (id: number) =>
    apiRequest<void>(`/api/product-images/${id}/`, { method: "DELETE", auth: true }),

  // Sale Product Reviews
  listReviews: () =>
    apiRequest<ProductReview[]>("/api/product-reviews/", {
      auth: Boolean(getAccessToken()),
    }),
  submitReview: (data: { product: number; rating: number; comment: string }) =>
    apiRequest<ProductReview>("/api/product-reviews/", {
      method: "POST",
      auth: true,
      body: JSON.stringify(data),
    }),
  updateReview: (id: number, data: Partial<ProductReview>) =>
    apiRequest<ProductReview>(`/api/product-reviews/${id}/`, {
      method: "PATCH",
      auth: true,
      body: JSON.stringify(data),
    }),
  deleteReview: (id: number) =>
    apiRequest<void>(`/api/product-reviews/${id}/`, { method: "DELETE", auth: true }),

  // Separate Rental Categories & Rental Products
  listRentalCategories: () => apiRequest<RentalCategory[]>("/api/rental-categories/"),
  createRentalCategory: (data: { name: string; description?: string }) =>
    apiRequest<RentalCategory>("/api/rental-categories/", {
      method: "POST",
      auth: true,
      body: JSON.stringify(data),
    }),
  updateRentalCategory: (
    id: number,
    data: Partial<{ name: string; description: string }>
  ) =>
    apiRequest<RentalCategory>(`/api/rental-categories/${id}/`, {
      method: "PATCH",
      auth: true,
      body: JSON.stringify(data),
    }),
  deleteRentalCategory: (id: number) =>
    apiRequest<void>(`/api/rental-categories/${id}/`, {
      method: "DELETE",
      auth: true,
    }),

  listRentalProducts: (
    params?: RentalProductQueryParams,
    options?: { auth?: boolean }
  ) =>
    apiRequest<RentalProduct[]>(
      `/api/rental-products/${toQueryString(params as Record<string, unknown>)}`,
      { auth: options?.auth ?? Boolean(getAccessToken()) }
    ),

  getRentalProduct: (id: number | string, options?: { auth?: boolean }) =>
    apiRequest<RentalProduct>(`/api/rental-products/${id}/`, {
      auth: options?.auth ?? Boolean(getAccessToken()),
    }),

  createRentalProduct: (data: Partial<RentalProductPayload>) =>
    apiRequest<RentalProduct>("/api/rental-products/", {
      method: "POST",
      auth: true,
      body: JSON.stringify(data),
    }),

  updateRentalProduct: (id: number, data: Partial<RentalProductPayload>) =>
    apiRequest<RentalProduct>(`/api/rental-products/${id}/`, {
      method: "PATCH",
      auth: true,
      body: JSON.stringify(data),
    }),

  deleteRentalProduct: (id: number) =>
    apiRequest<void>(`/api/rental-products/${id}/`, { method: "DELETE", auth: true }),

  // Rental Product Sub-resources
  createRentalVariant: (
    data: Omit<RentalProductVariant, "id" | "available_stock">
  ) =>
    apiRequest<RentalProductVariant>("/api/rental-product-variants/", {
      method: "POST",
      auth: true,
      body: JSON.stringify(data),
    }),

  updateRentalVariant: (id: number, data: Partial<RentalProductVariant>) =>
    apiRequest<RentalProductVariant>(`/api/rental-product-variants/${id}/`, {
      method: "PATCH",
      auth: true,
      body: JSON.stringify(data),
    }),

  deleteRentalVariant: (id: number) =>
    apiRequest<void>(`/api/rental-product-variants/${id}/`, {
      method: "DELETE",
      auth: true,
    }),

  createRentalSpecification: (data: {
    rental_product: number;
    name: string;
    value: string;
  }) =>
    apiRequest<RentalProductSpecification>("/api/rental-product-specifications/", {
      method: "POST",
      auth: true,
      body: JSON.stringify(data),
    }),

  deleteRentalSpecification: (id: number) =>
    apiRequest<void>(`/api/rental-product-specifications/${id}/`, {
      method: "DELETE",
      auth: true,
    }),

  uploadRentalProductImage: (formData: FormData) =>
    apiRequest<RentalProductImage>("/api/rental-product-images/", {
      method: "POST",
      auth: true,
      body: formData,
    }),

  deleteRentalProductImage: (id: number) =>
    apiRequest<void>(`/api/rental-product-images/${id}/`, {
      method: "DELETE",
      auth: true,
    }),

  listRentalReviews: () =>
    apiRequest<RentalProductReview[]>("/api/rental-product-reviews/", {
      auth: Boolean(getAccessToken()),
    }),
  submitRentalReview: (data: {
    rental_product: number;
    rating: number;
    comment: string;
  }) =>
    apiRequest<RentalProductReview>("/api/rental-product-reviews/", {
      method: "POST",
      auth: true,
      body: JSON.stringify(data),
    }),
  updateRentalReview: (id: number, data: Partial<RentalProductReview>) =>
    apiRequest<RentalProductReview>(`/api/rental-product-reviews/${id}/`, {
      method: "PATCH",
      auth: true,
      body: JSON.stringify(data),
    }),
  deleteRentalReview: (id: number) =>
    apiRequest<void>(`/api/rental-product-reviews/${id}/`, {
      method: "DELETE",
      auth: true,
    }),

  // Rental Machines (Admin Only)
  listRentalMachines: (params?: {
    rental_product?: number;
    variant?: number;
    status?: RentalMachineStatus;
    search?: string;
    ordering?: string;
  }) =>
    apiRequest<RentalMachine[]>(
      `/api/rental-machines/${toQueryString(params as Record<string, unknown>)}`,
      { auth: true }
    ),

  createRentalMachine: (data: {
    rental_product: number;
    variant?: number | null;
    machine_number: string;
    status?: RentalMachineStatus;
    notes?: string;
  }) =>
    apiRequest<RentalMachine>("/api/rental-machines/", {
      method: "POST",
      auth: true,
      body: JSON.stringify(data),
    }),

  bulkCreateRentalMachines: (data: {
    rental_product: number;
    variant?: number | null;
    machine_numbers: string[];
    status?: RentalMachineStatus;
  }) =>
    apiRequest<RentalMachine[]>("/api/rental-machines/bulk-create/", {
      method: "POST",
      auth: true,
      body: JSON.stringify(data),
    }),

  updateRentalMachine: (
    id: number,
    data: Partial<{
      machine_number: string;
      variant: number | null;
      status: RentalMachineStatus;
      notes: string;
    }>
  ) =>
    apiRequest<RentalMachine>(`/api/rental-machines/${id}/`, {
      method: "PATCH",
      auth: true,
      body: JSON.stringify(data),
    }),

  deleteRentalMachine: (id: number) =>
    apiRequest<void>(`/api/rental-machines/${id}/`, {
      method: "DELETE",
      auth: true,
    }),

  // Coupons
  listCoupons: () =>
    apiRequest<Coupon[]>("/api/coupons/", { auth: Boolean(getAccessToken()) }),
  createCoupon: (data: Coupon) =>
    apiRequest<Coupon>("/api/coupons/", {
      method: "POST",
      auth: true,
      body: JSON.stringify(data),
    }),
  updateCoupon: (id: number, data: Partial<Coupon>) =>
    apiRequest<Coupon>(`/api/coupons/${id}/`, {
      method: "PATCH",
      auth: true,
      body: JSON.stringify(data),
    }),
  deleteCoupon: (id: number) =>
    apiRequest<void>(`/api/coupons/${id}/`, { method: "DELETE", auth: true }),

  // Cart & Wishlist
  getCart: () => apiRequest<Cart>("/api/cart/", { auth: true }),
  addCartItem: (data: { product: number; variant?: number | null; quantity: number }) =>
    apiRequest<CartItem>("/api/cart/items/", {
      method: "POST",
      auth: true,
      body: JSON.stringify({
        product: data.product,
        variant: data.variant ?? null,
        quantity: data.quantity,
      }),
    }),
  updateCartItem: (id: number, quantity: number) =>
    apiRequest<CartItem>(`/api/cart/items/${id}/`, {
      method: "PATCH",
      auth: true,
      body: JSON.stringify({ quantity }),
    }),
  removeCartItem: (id: number) =>
    apiRequest<void>(`/api/cart/items/${id}/`, { method: "DELETE", auth: true }),
  clearCart: () => apiRequest<void>("/api/cart/clear/", { method: "DELETE", auth: true }),

  getWishlist: () => apiRequest<Wishlist>("/api/wishlist/", { auth: true }),
  listWishlistItems: () =>
    apiRequest<WishlistItem[]>("/api/wishlist/items/", { auth: true }),
  addWishlistItem: (product: number) =>
    apiRequest<WishlistItem>("/api/wishlist/items/", {
      method: "POST",
      auth: true,
      body: JSON.stringify({ product }),
    }),
  removeWishlistItem: (id: number) =>
    apiRequest<void>(`/api/wishlist/items/${id}/`, { method: "DELETE", auth: true }),

  // Checkout & Orders
  checkout: (data: CheckoutPayload) =>
    apiRequest<Order>("/api/checkout/", {
      method: "POST",
      auth: true,
      body: JSON.stringify(data),
    }),
  listOrders: () => apiRequest<Order[]>("/api/orders/", { auth: true }),
  getOrder: (id: number) => apiRequest<Order>(`/api/orders/${id}/`, { auth: true }),

  // Payments & Refunds (Direct Bank Transfer Only)
  listPayments: () => apiRequest<Payment[]>("/api/payments/", { auth: true }),
  initiatePayment: (
    order_id: number,
    method: PaymentMethod = "BANK_TRANSFER"
  ) =>
    apiRequest<Payment>("/api/payments/initiate/", {
      method: "POST",
      auth: true,
      body: JSON.stringify({ order_id, method }),
    }),
  processPayment: (id: number, result: "SUCCESS" | "FAILED" | "CANCELLED") =>
    apiRequest<Payment>(`/api/payments/${id}/process/`, {
      method: "POST",
      auth: true,
      body: JSON.stringify({ result }),
    }),
  listRefunds: () => apiRequest<Refund[]>("/api/refunds/", { auth: true }),

  // Rentals & Machine Assignment
  checkRentalAvailability: (params: {
    rental_product_id: number;
    rental_variant_id?: number | null;
    start_date: string;
    end_date: string;
  }) => {
    const qs = new URLSearchParams({
      rental_product_id: String(params.rental_product_id),
      start_date: params.start_date,
      end_date: params.end_date,
    });
    if (params.rental_variant_id) {
      qs.set("rental_variant_id", String(params.rental_variant_id));
    }
    return apiRequest<RentalAvailabilityResponse>(
      `/api/rentals/availability/?${qs.toString()}`,
      { auth: true }
    );
  },

  listRentals: () => apiRequest<Rental[]>("/api/rentals/", { auth: true }),
  getRental: (id: number) => apiRequest<Rental>(`/api/rentals/${id}/`, { auth: true }),
  createRental: (data: CreateRentalPayload) =>
    apiRequest<Rental>("/api/rentals/", {
      method: "POST",
      auth: true,
      body: JSON.stringify(data),
    }),
  assignRentalMachines: (rentalId: number, data: AssignMachinesPayload) =>
    apiRequest<Rental>(`/api/rentals/${rentalId}/assign-machines/`, {
      method: "POST",
      auth: true,
      body: JSON.stringify(data),
    }),
  cancelRental: (id: number) =>
    apiRequest<Rental>(`/api/rentals/${id}/cancel/`, {
      method: "POST",
      auth: true,
      body: JSON.stringify({}),
    }),
  updateRentalStatus: (id: number, status: Exclude<RentalStatus, "PENDING">) =>
    apiRequest<Rental>(`/api/rentals/${id}/status/`, {
      method: "POST",
      auth: true,
      body: JSON.stringify({ status }),
    }),
};
