export type UserRole = "CUSTOMER" | "ADMIN";

export interface Address {
  id: number;
  title: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  postal_code: string;
  is_default: boolean;
  user: number;
}

export interface AddressPayload {
  title: string;
  address_line_1: string;
  address_line_2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  is_default?: boolean;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active?: boolean;
  mobile_number: string | null;
  nic: string | null;
  profile_picture: string | null;
  addresses: Address[];
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
}

// ==========================================
// Selling Catalog Types
// ==========================================

export interface Category {
  id: number;
  name: string;
  description: string | null;
}

export interface Brand {
  id: number;
  name: string;
}

export interface ProductVariant {
  id: number;
  name: string;
  value: string;
  sku: string | null;
  additional_price: string;
  stock: number;
  available_stock?: number;
  is_active: boolean;
  product: number;
}

export interface ProductImage {
  id: number;
  image: string;
  is_primary: boolean;
  display_order: number;
  product: number;
}

export interface ProductSpecification {
  id: number;
  name: string;
  value: string;
  product: number;
}

export interface Product3DModel {
  id: number;
  file: string | null;
  url: string | null;
  format: string;
  product: number;
}

export interface ProductReview {
  id: number;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  product: number;
  user: number;
}

export interface Product {
  id: number;
  name: string;
  category: number | null;
  category_name: string | null;
  brand: number | null;
  brand_name: string | null;
  sku: string;
  description: string;
  sale_price: string;
  discount: string;
  is_available: boolean;
  stock: number;
  available_stock: number | string;
  warranty_information: string | null;
  has_3d_model?: boolean;
  created_at: string;
  updated_at: string;
  variants: ProductVariant[];
  images: ProductImage[];
  specifications: ProductSpecification[];
  threed_model?: Product3DModel | null;
  reviews: ProductReview[];
}

export interface ProductQueryParams {
  search?: string;
  category?: number | string;
  brand?: number | string;
  is_available?: boolean;
  ordering?: string;
}

// ==========================================
// Separate Rental Catalog & Machine Types
// ==========================================

export interface RentalCategory {
  id: number;
  name: string;
  description: string | null;
}

export type RentalMachineStatus = "AVAILABLE" | "MAINTENANCE" | "RETIRED";

export interface RentalMachine {
  id: number;
  rental_product: number;
  variant: number | null;
  machine_number: string;
  status: RentalMachineStatus;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface RentalProductVariant {
  id: number;
  rental_product: number;
  name: string;
  value: string;
  sku: string | null;
  additional_rental_price: string;
  stock: number;
  available_stock?: number;
  is_active: boolean;
}

export interface RentalProductImage {
  id: number;
  image: string;
  is_primary: boolean;
  display_order: number;
  rental_product: number;
}

export interface RentalProductSpecification {
  id: number;
  name: string;
  value: string;
  rental_product: number;
}

export interface RentalProductReview {
  id: number;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  rental_product: number;
  user: number;
}

export interface RentalProduct {
  id: number;
  name: string;
  category: number | null;
  category_name: string | null;
  brand: number | null;
  brand_name: string | null;
  sku: string;
  description: string;
  rental_price: string;
  discount: string;
  is_available: boolean;
  has_machine_numbers: boolean;
  stock: number;
  available_stock: number | string;
  warranty_information: string | null;
  has_3d_model?: boolean;
  created_at: string;
  updated_at: string;
  variants: RentalProductVariant[];
  images: RentalProductImage[];
  specifications: RentalProductSpecification[];
  threed_model?: Product3DModel | null;
  reviews: RentalProductReview[];
  machines?: RentalMachine[];
}

export interface RentalProductPayload {
  name: string;
  sku: string;
  category: number | null;
  brand: number | null;
  description: string;
  rental_price: string;
  discount?: string;
  is_available: boolean;
  has_machine_numbers: boolean;
  stock: number;
  warranty_information?: string | null;
  machine_numbers?: string[];
}

export interface RentalProductQueryParams {
  search?: string;
  category?: number | string;
  brand?: number | string;
  is_available?: boolean;
  has_machine_numbers?: boolean;
  ordering?: string;
}

// ==========================================
// Cart & Wishlist
// ==========================================

export interface CartItem {
  id: number;
  cart: number;
  product: number;
  variant: number | null;
  quantity: number;
  unit_price: string;
  subtotal: string;
  created_at: string;
}

export interface Cart {
  id: number;
  user: number;
  items: CartItem[];
  total_quantity: number;
  subtotal: string;
  created_at: string;
}

export interface GuestCartItem {
  productId: number;
  variantId: number | null;
  quantity: number;
  snapshot?: {
    name: string;
    sku: string;
    image: string | null;
    unitPrice: number;
    maxStock: number;
    variantLabel?: string | null;
  };
}

export interface WishlistItem {
  id: number;
  wishlist: number;
  product: number;
  created_at: string;
}

export interface Wishlist {
  id: number;
  user: number;
  items: WishlistItem[];
  created_at?: string;
}

// ==========================================
// Coupons, Orders & Payments (Bank Transfer Only)
// ==========================================

export interface Coupon {
  id?: number;
  code: string;
  discount_type: "PERCENTAGE" | "FIXED";
  discount_value: string;
  min_purchase_amount: string | null;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
}

export type OrderType = "SALE" | "RENTAL";
export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "RETURNED"
  | "CANCELLED";

export interface OrderItem {
  id: number;
  order: number;
  product: number | null;
  variant: number | null;
  product_name: string | null;
  sku: string | null;
  variant_name: string | null;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

export interface Order {
  id: number;
  order_number: string;
  user: number;
  order_type: OrderType;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  delivery_address: number | null;
  delivery_location_tag?: string | null;
  house_number?: string | null;
  delivery_street: string | null;
  delivery_city: string | null;
  delivery_state: string | null;
  delivery_zip_code: string | null;
  customer_mobile: string | null;
  subtotal: string;
  discount_amount: string;
  final_amount: string;
  total_amount?: string;
  delivery_charge?: string;
  coupon_code: string | null;
  coupon_discount_type: string | null;
  coupon_discount_value: string | null;
  inventory_released: boolean;
  items: OrderItem[];
}

export type PaymentMethod = "BANK_TRANSFER";
export type PaymentStatus =
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

export interface Payment {
  id: number;
  order: number;
  order_number: string;
  method: PaymentMethod | string;
  status: PaymentStatus;
  amount: string;
  transaction_id: string | null;
  bank_reference?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Refund {
  id: number;
  payment: number;
  amount: string;
  reason: string;
  status: string;
  created_at: string;
}

export interface CheckoutPayload {
  address_id: number;
  coupon_code?: string;
}

// ==========================================
// Tool Rentals, Availability & Machine Assignment
// ==========================================

export type RentalStatus =
  | "PENDING"
  | "CONFIRMED"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED";

export interface AvailableMachine {
  id: number;
  machine_number: string;
}

export interface RentalAvailabilityResponse {
  available_quantity: number;
  has_machine_numbers: boolean;
  available_machines: AvailableMachine[];
}

export interface AssignedRentalMachine {
  id: number;
  machine: number;
  machine_number: string;
  assigned_at: string;
}

export interface RentalItem {
  id: number;
  rental: number;
  rental_product: number | null;
  rental_variant: number | null;
  product_name: string | null;
  variant_name: string | null;
  sku: string | null;
  has_machine_numbers: boolean;
  daily_rental_price: string;
  quantity: number;
  rental_days: number;
  line_total: string;
  assigned_machines: AssignedRentalMachine[];
  machine_numbers: string[];
}

export interface Rental {
  id: number;
  reference: string;
  customer: number;
  status: RentalStatus;
  start_date: string;
  end_date: string;
  subtotal: string;
  security_deposit: string;
  final_amount: string;
  delivery_street: string | null;
  delivery_city: string | null;
  delivery_state: string | null;
  delivery_zip_code: string | null;
  house_number: string | null;
  tagged_location: string | null;
  customer_mobile: string | null;
  created_at: string;
  updated_at: string;
  items: RentalItem[];
}

export interface CreateRentalPayload {
  start_date: string;
  end_date: string;
  items: Array<{
    rental_product_id: number;
    rental_variant_id: number | null;
    quantity: number;
  }>;
  delivery_street: string;
  delivery_city: string;
  delivery_state: string;
  delivery_zip_code: string;
  house_number: string;
  tagged_location?: string;
  customer_mobile: string;
}

export interface AssignMachinesPayload {
  rental_item_id: number;
  machine_numbers?: string[];
  machine_ids?: number[];
}
