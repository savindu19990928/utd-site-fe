# Universal Tool Depot (UDT) E-Commerce REST API Documentation

This document provides complete API reference documentation for the **Universal Tool Depot (UDT) E-Commerce & Rental Platform**, including endpoint URLs, HTTP methods, summaries, authentication requirements, and example request/response payloads.

---

## Table of Contents
1. [Overview & Authentication](#1-overview--authentication)
2. [Authentication Endpoints](#2-authentication-endpoints)
3. [User & Address Management](#3-user--address-management)
4. [Catalog & Products](#4-catalog--products)
   - [Categories & Brands](#41-categories--brands)
   - [Products](#42-products)
   - [Product Variants, Images, Specifications & 3D Models](#43-product-variants-images-specifications--3d-models)
   - [Product Reviews](#44-product-reviews)
5. [Coupons & Promotions](#5-coupons--promotions)
6. [Shopping Cart & Wishlist](#6-shopping-cart--wishlist)
7. [Checkout & Orders](#7-checkout--orders)
8. [Payments & Refunds](#8-payments--refunds)
9. [Tool Rentals](#9-tool-rentals)
10. [Interactive API Explorer Links](#10-interactive-api-explorer-links)

---

## 1. Overview & Authentication

- **Base URL**: `https://api.universaltooldepot.lk`
- **Content-Type**: `application/json` (except image/3D file uploads which use `multipart/form-data`)
- **Authentication**: JWT (JSON Web Token) via the `Authorization` header:
  ```http
  Authorization: Bearer <your_access_token>
  ```
- **User Roles**:
  - `CUSTOMER`: Standard registered shopper/renter.
  - `ADMIN`: Administrator with full catalog, order, status transition, and user control.

---

## 2. Authentication Endpoints

### 2.1 User Registration
- **Method**: `POST`
- **Endpoint**: `/api/auth/register/`
- **Summary**: Register a new customer account. Role is automatically set to `CUSTOMER`.
- **Headers**: `Content-Type: application/json`

#### Example Request
```http
POST /api/auth/register/ HTTP/1.1
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john.doe@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "password": "SecurePassword123!",
  "password_confirm": "SecurePassword123!"
}
```

#### Example Response (`201 Created`)
```json
{
  "username": "john_doe",
  "email": "john.doe@example.com",
  "first_name": "John",
  "last_name": "Doe"
}
```

---

### 2.2 Login (Obtain JWT Token Pair)
- **Method**: `POST`
- **Endpoint**: `/api/auth/login/`
- **Summary**: Authenticate with username and password to obtain JWT access and refresh tokens.
- **Headers**: `Content-Type: application/json`

#### Example Request
```http
POST /api/auth/login/ HTTP/1.1
Content-Type: application/json

{
  "username": "john_doe",
  "password": "SecurePassword123!"
}
```

#### Example Response (`200 OK`)
```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCI...",
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIi..."
}
```

---

### 2.3 Refresh JWT Token
- **Method**: `POST`
- **Endpoint**: `/api/auth/token/refresh/`
- **Summary**: Submit a valid refresh token to get a new access token.
- **Headers**: `Content-Type: application/json`

#### Example Request
```http
POST /api/auth/token/refresh/ HTTP/1.1
Content-Type: application/json

{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCI..."
}
```

#### Example Response (`200 OK`)
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIi..."
}
```

---

### 2.4 Get Current User Profile
- **Method**: `GET`
- **Endpoint**: `/api/auth/profile/`
- **Summary**: Retrieve the profile and saved addresses of the currently authenticated user.
- **Headers**: 
  - `Authorization: Bearer <access_token>`

#### Example Request
```http
GET /api/auth/profile/ HTTP/1.1
Authorization: Bearer <access_token>
```

#### Example Response (`200 OK`)
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john.doe@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "CUSTOMER",
  "mobile_number": "0771234567",
  "nic": "199012345678",
  "profile_picture": null,
  "addresses": [
    {
      "id": 1,
      "title": "Home",
      "address_line_1": "123 Main Street",
      "address_line_2": "Apt 4B",
      "city": "Colombo",
      "state": "Western",
      "postal_code": "00500",
      "is_default": true,
      "user": 1
    }
  ]
}
```

---

### 2.5 Update Current User Profile
- **Method**: `PATCH` / `PUT`
- **Endpoint**: `/api/auth/profile/`
- **Summary**: Update profile details (first name, last name, phone, NIC, email).
- **Headers**: 
  - `Authorization: Bearer <access_token>`
  - `Content-Type: application/json`

#### Example Request
```http
PATCH /api/auth/profile/ HTTP/1.1
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "first_name": "Jonathan",
  "mobile_number": "0779998888"
}
```

#### Example Response (`200 OK`)
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john.doe@example.com",
  "first_name": "Jonathan",
  "last_name": "Doe",
  "role": "CUSTOMER",
  "mobile_number": "0779998888",
  "nic": "199012345678",
  "profile_picture": null,
  "addresses": []
}
```

---

## 3. User & Address Management

### 3.1 List Users
- **Method**: `GET`
- **Endpoint**: `/api/users/`
- **Summary**: List users. Customers only see their own record; Admins see all users.
- **Headers**: `Authorization: Bearer <access_token>`

#### Example Response (`200 OK`)
```json
[
  {
    "id": 1,
    "username": "john_doe",
    "email": "john.doe@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "CUSTOMER",
    "is_active": true,
    "mobile_number": "0771234567",
    "nic": "199012345678",
    "profile_picture": null,
    "addresses": []
  }
]
```

---

### 3.2 List Addresses
- **Method**: `GET`
- **Endpoint**: `/api/addresses/`
- **Summary**: List saved delivery addresses for the authenticated user (or all addresses for admins).
- **Headers**: `Authorization: Bearer <access_token>`

#### Example Response (`200 OK`)
```json
[
  {
    "id": 1,
    "title": "Home",
    "address_line_1": "123 Galle Road",
    "address_line_2": null,
    "city": "Colombo",
    "state": "Western",
    "postal_code": "00300",
    "is_default": true,
    "user": 1
  }
]
```

---

### 3.3 Create Address
- **Method**: `POST`
- **Endpoint**: `/api/addresses/`
- **Summary**: Add a new shipping address.
- **Headers**: 
  - `Authorization: Bearer <access_token>`
  - `Content-Type: application/json`

#### Example Request
```http
POST /api/addresses/ HTTP/1.1
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Workplace",
  "address_line_1": "Level 4, World Trade Center",
  "address_line_2": "Echelon Square",
  "city": "Colombo",
  "state": "Western",
  "postal_code": "00100",
  "is_default": false
}
```

#### Example Response (`201 Created`)
```json
{
  "id": 2,
  "title": "Workplace",
  "address_line_1": "Level 4, World Trade Center",
  "address_line_2": "Echelon Square",
  "city": "Colombo",
  "state": "Western",
  "postal_code": "00100",
  "is_default": false,
  "user": 1
}
```

---

### 3.4 Update / Delete Address
- **Methods**: `PUT` / `PATCH` / `DELETE`
- **Endpoint**: `/api/addresses/{id}/`
- **Summary**: Update details or remove a saved address.

#### Example Delete Response (`204 No Content`)

---

## 4. Catalog & Products

### 4.1 Categories & Brands

#### List Categories
- **Method**: `GET`
- **Endpoint**: `/api/categories/`
- **Summary**: Retrieve all tool categories. (Public read, Admin write).

#### Example Response (`200 OK`)
```json
[
  {
    "id": 1,
    "name": "Power Tools",
    "description": "Heavy-duty electric and cordless tools"
  },
  {
    "id": 2,
    "name": "Safety Equipment",
    "description": "Helmets, gloves, and protective gear"
  }
]
```

#### Create Category (Admin Only)
- **Method**: `POST`
- **Endpoint**: `/api/categories/`

```json
{
  "name": "Drilling & Demolition",
  "description": "Rotary hammers, jackhammers, and bits"
}
```

#### List Brands
- **Method**: `GET`
- **Endpoint**: `/api/brands/`
- **Summary**: Retrieve all equipment manufacturers / brands.

#### Example Response (`200 OK`)
```json
[
  {
    "id": 1,
    "name": "DeWalt"
  },
  {
    "id": 2,
    "name": "Makita"
  },
  {
    "id": 3,
    "name": "Bosch"
  }
]
```

---

### 4.2 Products

#### 4.2.1 List Products
- **Method**: `GET`
- **Endpoint**: `/api/products/`
- **Summary**: List products with optional search, sorting, and category/brand filters.
- **Query Parameters**:
  - `search`: Filter by name, description, SKU.
  - `category`: Category ID.
  - `brand`: Brand ID.
  - `is_available`: `true` or `false`.
  - `is_for_sale`: `true` or `false`.
  - `is_for_rent`: `true` or `false`.
  - `ordering`: `sale_price`, `-sale_price`, `rental_price`, `created_at`, `name`.

#### Example Request
```http
GET /api/products/?category=1&is_for_rent=true&ordering=-created_at HTTP/1.1
```

#### Example Response (`200 OK`)
```json
[
  {
    "id": 10,
    "name": "Bosch Rotary Hammer Drill 800W",
    "category": 1,
    "category_name": "Power Tools",
    "brand": 3,
    "brand_name": "Bosch",
    "sku": "BOSCH-GBH-226",
    "description": "High performance 800W corded SDS-plus hammer drill.",
    "sale_price": "45000.00",
    "rental_price": "2500.00",
    "discount": "5.00",
    "is_available": true,
    "is_for_sale": true,
    "is_for_rent": true,
    "stock": 15,
    "available_stock": 15,
    "warranty_information": "1 Year Manufacturer Warranty",
    "has_3d_model": true,
    "created_at": "2026-10-15T10:00:00Z",
    "updated_at": "2026-10-15T10:00:00Z",
    "variants": [],
    "images": [
      {
        "id": 1,
        "image": "https://storage.googleapis.com/utdweb/media/products/drill.jpg",
        "is_primary": true,
        "display_order": 0
      }
    ],
    "specifications": [
      {
        "id": 1,
        "name": "Power Input",
        "value": "800W"
      },
      {
        "id": 2,
        "name": "Impact Energy",
        "value": "2.7 J"
      }
    ],
    "threed_model": {
      "id": 1,
      "url": "https://storage.googleapis.com/utdweb/media/products/3d/drill.glb",
      "format": "GLB"
    },
    "reviews": []
  }
]
```

---

#### 4.2.2 Create Product (Admin Only)
- **Method**: `POST`
- **Endpoint**: `/api/products/`
- **Headers**:
  - `Authorization: Bearer <admin_token>`
  - `Content-Type: application/json`

#### Example Request
```http
POST /api/products/ HTTP/1.1
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "DeWalt Cordless Angle Grinder 20V",
  "category": 1,
  "brand": 1,
  "sku": "DEW-DCG412",
  "description": "Ergonomic 20V brushless angle grinder.",
  "sale_price": "38500.00",
  "rental_price": "1800.00",
  "discount": "0.00",
  "is_available": true,
  "is_for_sale": true,
  "is_for_rent": true,
  "stock": 8,
  "warranty_information": "2 Years Limited Warranty",
  "has_3d_model": false
}
```

#### Example Response (`201 Created`)
```json
{
  "id": 11,
  "name": "DeWalt Cordless Angle Grinder 20V",
  "category": 1,
  "category_name": "Power Tools",
  "brand": 1,
  "brand_name": "DeWalt",
  "sku": "DEW-DCG412",
  "description": "Ergonomic 20V brushless angle grinder.",
  "sale_price": "38500.00",
  "rental_price": "1800.00",
  "discount": "0.00",
  "is_available": true,
  "is_for_sale": true,
  "is_for_rent": true,
  "stock": 8,
  "available_stock": 8,
  "warranty_information": "2 Years Limited Warranty",
  "has_3d_model": false,
  "created_at": "2026-11-06T00:50:00Z",
  "updated_at": "2026-11-06T00:50:00Z",
  "variants": [],
  "images": [],
  "specifications": [],
  "threed_model": null,
  "reviews": []
}
```

---

### 4.3 Product Variants, Images, Specifications & 3D Models

#### 4.3.1 Create Product Variant (Admin Only)
- **Method**: `POST`
- **Endpoint**: `/api/product-variants/`

```json
{
  "product": 11,
  "name": "Battery Bundle",
  "value": "With 2x 5Ah Batteries",
  "sku": "DEW-DCG412-2BAT",
  "additional_price": "12000.00",
  "additional_rental_price": "500.00",
  "stock": 5,
  "is_active": true
}
```

#### 4.3.2 Add Product Specification
- **Method**: `POST`
- **Endpoint**: `/api/product-specifications/`

```json
{
  "product": 11,
  "name": "No Load Speed",
  "value": "8000 RPM"
}
```

#### 4.3.3 Attach 3D Model
- **Method**: `POST`
- **Endpoint**: `/api/product-3d-models/`

```json
{
  "product": 11,
  "url": "https://storage.googleapis.com/utdweb/media/products/3d/grinder.glb",
  "format": "GLB"
}
```

---

### 4.4 Product Reviews

#### 4.4.1 List Product Reviews
- **Method**: `GET`
- **Endpoint**: `/api/product-reviews/`
- **Summary**: Publicly lists approved reviews. Authenticated users also see their own pending reviews. Admins see all reviews.

#### Example Response (`200 OK`)
```json
[
  {
    "id": 1,
    "product": 10,
    "user": 1,
    "rating": 5,
    "comment": "Super powerful drill. Made quick work of concrete drilling.",
    "is_approved": true,
    "created_at": "2026-10-20T14:32:00Z",
    "updated_at": "2026-10-20T14:32:00Z"
  }
]
```

#### 4.4.2 Submit Review
- **Method**: `POST`
- **Endpoint**: `/api/product-reviews/`
- **Summary**: Authenticated customer leaves rating and feedback. `is_approved` defaults to `false` pending admin moderation.
- **Headers**:
  - `Authorization: Bearer <access_token>`
  - `Content-Type: application/json`

#### Example Request
```http
POST /api/product-reviews/ HTTP/1.1
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "product": 10,
  "rating": 5,
  "comment": "Excellent quality tool. Highly recommend."
}
```

#### Example Response (`201 Created`)
```json
{
  "id": 2,
  "product": 10,
  "user": 1,
  "rating": 5,
  "comment": "Excellent quality tool. Highly recommend.",
  "is_approved": false,
  "created_at": "2026-11-06T00:52:00Z",
  "updated_at": "2026-11-06T00:52:00Z"
}
```

---

## 5. Coupons & Promotions

### 5.1 List Active Coupons (Public)
- **Method**: `GET`
- **Endpoint**: `/api/coupons/`
- **Summary**: Customers view active promotional vouchers; Admins view all coupon codes with expiration and metadata.

#### Example Response (`200 OK`)
```json
[
  {
    "code": "WELCOME10",
    "discount_type": "PERCENTAGE",
    "discount_value": "10.00",
    "min_purchase_amount": "5000.00"
  },
  {
    "code": "PROTOOL1000",
    "discount_type": "FIXED",
    "discount_value": "1000.00",
    "min_purchase_amount": "15000.00"
  }
]
```

### 5.2 Create Coupon (Admin Only)
- **Method**: `POST`
- **Endpoint**: `/api/coupons/`
- **Headers**:
  - `Authorization: Bearer <admin_token>`
  - `Content-Type: application/json`

#### Example Request
```http
POST /api/coupons/ HTTP/1.1
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "code": "BLACKFRIDAY",
  "discount_type": "PERCENTAGE",
  "discount_value": "20.00",
  "start_date": "2026-11-20T00:00:00Z",
  "end_date": "2026-11-30T23:59:59Z",
  "is_active": true,
  "min_purchase_amount": "10000.00"
}
```

#### Example Response (`201 Created`)
```json
{
  "id": 3,
  "code": "BLACKFRIDAY",
  "discount_type": "PERCENTAGE",
  "discount_value": "20.00",
  "start_date": "2026-11-20T00:00:00Z",
  "end_date": "2026-11-30T23:59:59Z",
  "is_active": true,
  "min_purchase_amount": "10000.00"
}
```

---

## 6. Shopping Cart & Wishlist

### 6.1 View Cart
- **Method**: `GET`
- **Endpoint**: `/api/cart/`
- **Summary**: Retrieve the authenticated user's cart including line items, stock availability, unit prices, and subtotal.
- **Headers**: `Authorization: Bearer <access_token>`

#### Example Response (`200 OK`)
```json
{
  "id": 1,
  "user": 1,
  "items": [
    {
      "id": 5,
      "cart": 1,
      "product": 10,
      "variant": null,
      "quantity": 2,
      "unit_price": "42750.00",
      "subtotal": "85500.00",
      "created_at": "2026-11-06T00:40:00Z"
    }
  ],
  "total_quantity": 2,
  "subtotal": "85500.00",
  "created_at": "2026-11-06T00:30:00Z"
}
```

---

### 6.2 Add Item to Cart
- **Method**: `POST`
- **Endpoint**: `/api/cart/items/`
- **Summary**: Add a product (or product variant) and quantity to the cart. If the item is already present, its quantity is merged.
- **Headers**:
  - `Authorization: Bearer <access_token>`
  - `Content-Type: application/json`

#### Example Request
```http
POST /api/cart/items/ HTTP/1.1
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "product": 10,
  "variant": null,
  "quantity": 1
}
```

#### Example Response (`201 Created`)
```json
{
  "id": 6,
  "cart": 1,
  "product": 10,
  "variant": null,
  "quantity": 1,
  "unit_price": "42750.00",
  "subtotal": "42750.00",
  "created_at": "2026-11-06T00:53:00Z"
}
```

---

### 6.3 Update Cart Item Quantity
- **Method**: `PATCH`
- **Endpoint**: `/api/cart/items/{id}/`
- **Summary**: Modify the quantity of a specific cart item.

#### Example Request
```http
PATCH /api/cart/items/6/ HTTP/1.1
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "quantity": 3
}
```

#### Example Response (`200 OK`)
```json
{
  "id": 6,
  "cart": 1,
  "product": 10,
  "variant": null,
  "quantity": 3,
  "unit_price": "42750.00",
  "subtotal": "128250.00",
  "created_at": "2026-11-06T00:53:00Z"
}
```

---

### 6.4 Remove Cart Item / Clear Cart
- **Remove Single Item**: `DELETE /api/cart/items/{id}/` (`204 No Content`)
- **Clear Entire Cart**: `DELETE /api/cart/clear/` (`204 No Content`)

---

### 6.5 Wishlist Endpoints
- **View Wishlist**: `GET /api/wishlist/`
- **List Wishlist Items**: `GET /api/wishlist/items/`
- **Add to Wishlist**: `POST /api/wishlist/items/`
  ```json
  {
    "product": 10
  }
  ```
- **Remove from Wishlist**: `DELETE /api/wishlist/items/{id}/`

---

## 7. Checkout & Orders

### 7.1 Checkout Cart
- **Method**: `POST`
- **Endpoint**: `/api/checkout/`
- **Summary**: Convert items in the active cart into a confirmed order. Deducts stock inventory, validates and applies coupon discount, takes delivery address snapshot, and clears the cart.
- **Headers**:
  - `Authorization: Bearer <access_token>`
  - `Content-Type: application/json`

#### Example Request
```http
POST /api/checkout/ HTTP/1.1
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "address_id": 1,
  "coupon_code": "WELCOME10"
}
```

#### Example Response (`201 Created`)
```json
{
  "id": 101,
  "order_number": "ORD-20261106-0001",
  "user": 1,
  "order_type": "SALE",
  "status": "PENDING",
  "created_at": "2026-11-06T00:55:00Z",
  "updated_at": "2026-11-06T00:55:00Z",
  "delivery_address": 1,
  "delivery_street": "123 Main Street",
  "delivery_city": "Colombo",
  "delivery_state": "Western",
  "delivery_zip_code": "00500",
  "customer_mobile": "0771234567",
  "subtotal": "85500.00",
  "discount_amount": "8550.00",
  "final_amount": "76950.00",
  "coupon_code": "WELCOME10",
  "coupon_discount_type": "PERCENTAGE",
  "coupon_discount_value": "10.00",
  "inventory_released": false,
  "items": [
    {
      "id": 201,
      "order": 101,
      "product": 10,
      "variant": null,
      "product_name": "Bosch Rotary Hammer Drill 800W",
      "sku": "BOSCH-GBH-226",
      "variant_name": null,
      "quantity": 2,
      "unit_price": "42750.00",
      "subtotal": "85500.00"
    }
  ]
}
```

---

### 7.2 List Orders
- **Method**: `GET`
- **Endpoint**: `/api/orders/`
- **Summary**: Retrieve past orders. Customers see their own; Admins see all.
- **Headers**: `Authorization: Bearer <access_token>`

#### Example Response (`200 OK`)
```json
[
  {
    "id": 101,
    "order_number": "ORD-20261106-0001",
    "user": 1,
    "order_type": "SALE",
    "status": "PENDING",
    "subtotal": "85500.00",
    "discount_amount": "8550.00",
    "final_amount": "76950.00",
    "created_at": "2026-11-06T00:55:00Z",
    "items": [
      {
        "id": 201,
        "product_name": "Bosch Rotary Hammer Drill 800W",
        "quantity": 2,
        "unit_price": "42750.00",
        "subtotal": "85500.00"
      }
    ]
  }
]
```

---

### 7.3 Retrieve Single Order
- **Method**: `GET`
- **Endpoint**: `/api/orders/{id}/`
- **Summary**: Get detailed order snapshot by ID.

---

## 8. Payments & Refunds

### 8.1 Initiate Payment
- **Method**: `POST`
- **Endpoint**: `/api/payments/initiate/`
- **Summary**: Initiate payment for an unpaid order. Amount is automatically derived from the order (cannot be manipulated by customer).
- **Available Methods**: `KOKO`, `MINTPAY`, `BANK_TRANSFER`
- **Headers**:
  - `Authorization: Bearer <access_token>`
  - `Content-Type: application/json`

#### Example Request
```http
POST /api/payments/initiate/ HTTP/1.1
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "order_id": 101,
  "method": "KOKO"
}
```

#### Example Response (`201 Created`)
```json
{
  "id": 50,
  "order": 101,
  "order_number": "ORD-20261106-0001",
  "method": "KOKO",
  "status": "PENDING",
  "amount": "76950.00",
  "transaction_id": "TXN-20261106-50",
  "created_at": "2026-11-06T00:56:00Z",
  "updated_at": "2026-11-06T00:56:00Z"
}
```

---

### 8.2 Process Payment Result (Admin / Gateway Webhook Simulation)
- **Method**: `POST`
- **Endpoint**: `/api/payments/{id}/process/`
- **Summary**: Simulates payment gateway response. Transitions payment status and updates the corresponding order status (e.g. to `CONFIRMED` on `SUCCESS`).
- **Allowed Results**: `SUCCESS`, `FAILED`, `CANCELLED`
- **Headers**:
  - `Authorization: Bearer <admin_token>`
  - `Content-Type: application/json`

#### Example Request
```http
POST /api/payments/50/process/ HTTP/1.1
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "result": "SUCCESS"
}
```

#### Example Response (`200 OK`)
```json
{
  "id": 50,
  "order": 101,
  "method": "KOKO",
  "status": "SUCCESS",
  "amount": "76950.00",
  "transaction_id": "TXN-20261106-50",
  "bank_reference": null,
  "created_at": "2026-11-06T00:56:00Z",
  "updated_at": "2026-11-06T00:57:00Z"
}
```

---

### 8.3 List Refunds
- **Method**: `GET`
- **Endpoint**: `/api/refunds/`
- **Summary**: Read-only listing of refunds associated with payments.

#### Example Response (`200 OK`)
```json
[
  {
    "id": 1,
    "payment": 50,
    "amount": "76950.00",
    "reason": "Customer cancellation within permitted window",
    "status": "PROCESSED",
    "created_at": "2026-11-06T01:00:00Z"
  }
]
```

---

## 9. Tool Rentals

### 9.1 Check Rental Availability
- **Method**: `GET`
- **Endpoint**: `/api/rentals/availability/`
- **Summary**: Check available units of a product (or variant) for a specific date range prior to booking.
- **Query Parameters**:
  - `product_id`: (Required) ID of the product.
  - `variant_id`: (Optional) ID of the variant.
  - `start_date`: (Required) Format `YYYY-MM-DD`.
  - `end_date`: (Required) Format `YYYY-MM-DD`.

#### Example Request
```http
GET /api/rentals/availability/?product_id=10&start_date=2026-11-10&end_date=2026-11-15 HTTP/1.1
Authorization: Bearer <access_token>
```

#### Example Response (`200 OK`)
```json
{
  "available_quantity": 4
}
```

---

### 9.2 Create Rental Booking
- **Method**: `POST`
- **Endpoint**: `/api/rentals/`
- **Summary**: Create a multi-day equipment rental reservation with deposit calculations and delivery snapshot.
- **Headers**:
  - `Authorization: Bearer <access_token>`
  - `Content-Type: application/json`

#### Example Request
```http
POST /api/rentals/ HTTP/1.1
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "start_date": "2026-11-10",
  "end_date": "2026-11-14",
  "items": [
    {
      "product_id": 10,
      "variant_id": null,
      "quantity": 1
    }
  ],
  "delivery_street": "45 Park Lane",
  "delivery_city": "Kandy",
  "delivery_state": "Central",
  "delivery_zip_code": "20000",
  "customer_mobile": "0771234567"
}
```

#### Example Response (`201 Created`)
```json
{
  "id": 12,
  "reference": "RNT-20261106-0001",
  "customer": 1,
  "status": "PENDING",
  "start_date": "2026-11-10",
  "end_date": "2026-11-14",
  "subtotal": "12500.00",
  "security_deposit": "25000.00",
  "final_amount": "37500.00",
  "delivery_street": "45 Park Lane",
  "delivery_city": "Kandy",
  "delivery_state": "Central",
  "delivery_zip_code": "20000",
  "house_number": null,
  "tagged_location": null,
  "customer_mobile": "0771234567",
  "created_at": "2026-11-06T00:58:00Z",
  "updated_at": "2026-11-06T00:58:00Z",
  "items": [
    {
      "id": 18,
      "rental": 12,
      "product": 10,
      "variant": null,
      "product_name": "Bosch Rotary Hammer Drill 800W",
      "variant_name": null,
      "sku": "BOSCH-GBH-226",
      "daily_rental_price": "2500.00",
      "quantity": 1,
      "rental_days": 5,
      "line_total": "12500.00"
    }
  ]
}
```

---

### 9.3 Cancel Rental
- **Method**: `POST`
- **Endpoint**: `/api/rentals/{id}/cancel/`
- **Summary**: Cancel a pending or confirmed rental reservation.
- **Headers**:
  - `Authorization: Bearer <access_token>`

#### Example Response (`200 OK`)
```json
{
  "id": 12,
  "reference": "RNT-20261106-0001",
  "status": "CANCELLED",
  "final_amount": "37500.00"
}
```

---

### 9.4 Change Rental Status (Admin Only)
- **Method**: `POST`
- **Endpoint**: `/api/rentals/{id}/status/`
- **Summary**: Transition rental through valid lifecycle states (`CONFIRMED`, `ACTIVE`, `COMPLETED`, `CANCELLED`).
- **Headers**:
  - `Authorization: Bearer <admin_token>`
  - `Content-Type: application/json`

#### Example Request
```http
POST /api/rentals/12/status/ HTTP/1.1
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "ACTIVE"
}
```

#### Example Response (`200 OK`)
```json
{
  "id": 12,
  "reference": "RNT-20261106-0001",
  "status": "ACTIVE"
}
```
