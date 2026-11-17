# Frontend Specification & Requirements: Universal Tool Depot (UDT)

> **Document Purpose**: This document serves as the master prompt and technical specification for generating the complete **React.js** frontend application for **Universal Tool Depot (UDT)**. It translates the project's Software Requirements Specification (SRS) and domain logic into complete UI/UX structures, user journeys, component architectures, and state flows.
>
> **Production Base URL**: `https://www.universaltooldepot.lk/`  
> *(Note: Explicit backend API endpoint URLs are omitted from this document; developers should connect components via standard service/hook layers using the platform's API client).*

---

## Table of Contents
1. [Project Overview & Business Domain](#1-project-overview--business-domain)
2. [Brand Identity, UI/UX & Design System](#2-brand-identity-uiux--design-system)
3. [User Roles & Access Control Matrix](#3-user-roles--access-control-matrix)
4. [Application Routing Architecture](#4-application-routing-architecture)
5. [State Management & Authentication Flows](#5-state-management--authentication-flows)
6. [Core Business Logic & Specialized Workflows](#6-core-business-logic--specialized-workflows)
   - 6.1 Dual Purchase vs. Equipment Rental Paradigm
   - 6.2 Equipment Rental Date Picker & Real-Time Availability Engine
   - 6.3 Refundable Security Deposit Engine (10x Multiplier)
   - 6.4 Interactive 3D Model Web Viewer (GLB/GLTF)
   - 6.5 Delivery Location Tagging & Physical Address Capture
   - 6.6 Multi-Payment Processing (Koko, Mintpay, Bank Transfer)
   - 6.7 Dynamic Product Variants & Stock Synchronizer
   - 6.8 Coupon & Discount Engine
7. [Detailed Page-by-Page Specifications](#7-detailed-page-by-page-specifications)
   - 7.1 Global Header & Navigation
   - 7.2 Global Footer
   - 7.3 Home Page
   - 7.4 Product Catalog & Search / Filter Listing
   - 7.5 Product Detail Page (PDP)
   - 7.6 Shopping Cart (Drawer & Page)
   - 7.7 Equipment Rental Booking Flow
   - 7.8 Checkout Page
   - 7.9 Order / Rental Confirmation & Printable Invoice
   - 7.10 Customer Portal (Profile, Orders, Rentals, Addresses)
   - 7.11 Admin Portal (Catalog, Operations, Approvals, Reports)
8. [Form Validation Rules & Edge Cases](#8-form-validation-rules--edge-cases)
9. [Recommended React Technology Stack & Libraries](#9-recommended-react-technology-stack--libraries)

---

## 1. Project Overview & Business Domain

Universal Tool Depot (UDT) is Sri Lanka's specialized digital marketplace for heavy construction equipment, industrial machinery, and contractor-grade power tools.

The platform provides a dual-model experience:
1. **Outright Purchase**: Buying tools, accessories, and machinery with standard e-commerce delivery and warranty.
2. **Short-Term Equipment Rental**: Renting heavy machinery and specialized tools on a multi-day basis with real-time equipment availability tracking, delivery dispatch, and a refundable security deposit mechanism.

### Key Value Propositions to Showcase in UI
- **Instant Rental Availability**: Real-time calendar availability checks for industrial equipment.
- **Interactive 3D Product Previews**: 360-degree interactive rotation and zoom of power tools prior to buying or renting.
- **Transparent Deposit Calculations**: Explicit display of daily rates and automated refundable security deposit amounts.
- **Sri Lankan Payment Integrations**: Direct support for Sri Lankan payment modalities (Koko Buy Now Pay Later, Mintpay 3-month installments, and Direct Bank Transfer with slip/reference verification).
- **Currencies & Formats**: Currency is formatted in Sri Lankan Rupees (`Rs.` or `LKR`, e.g., `Rs. 45,000.00`). Date formats follow `DD/MM/YYYY` or `YYYY-MM-DD`. Phone numbers adhere to Sri Lankan conventions (`07X XXX XXXX`).

---

## 2. Brand Identity, UI/UX & Design System

The visual design language must reflect **rugged durability, industrial precision, and contractor reliability**.

### 2.1 Color Palette
- **Primary / Brand Yellow**: `#F59E0B` (Amber 500) / `#D97706` (Amber 600) — Represents construction safety, caution tape, and Caterpillar/DeWalt heritage. Used for primary CTAs, active highlights, and ratings.
- **Industrial Dark Slate (Primary Neutral)**: `#0F172A` (Slate 900) — Deep heavy-duty slate for headers, primary typography, and dark hero banners.
- **Secondary Slate**: `#1E293B` (Slate 800) / `#334155` (Slate 700) — For cards, borders, modal headers, and table accents.
- **Safety Orange (Action Accent)**: `#EA580C` (Orange 600) — High-impact badges, "Rent Now" buttons, and urgent stock notifications.
- **Success Green**: `#10B981` (Emerald 500) — Payment confirmations, active rental badges, verified statuses.
- **Warning Amber**: `#F59E0B` — Pending statuses, deposit held notices, stock warnings.
- **Danger Red**: `#EF4444` (Red 500) — Out-of-stock badges, order cancellations, failed payments.
- **Background Tones**:
  - Main App Background: `#F8FAFC` (Slate 50)
  - Card & Container Surfaces: `#FFFFFF` (Pure White)
  - Subtle Dividing Borders: `#E2E8F0` (Slate 200)

### 2.2 Typography
- **Headings Font**: Modern, bold, condensed geometric sans-serif (e.g., `Chakra Petch`, `Barlow Condensed`, or `Inter Display` with heavy weights: 700/800).
- **Body & Data Font**: Highly legible neutral sans-serif (e.g., `Inter`, `Roboto`, or system-ui: 400/500/600).
- **Monospace Font (SKUs, Order Numbers, Technical Specs)**: `JetBrains Mono` or `Fira Code`.

### 2.3 UI Components & Tactile Styling
- **Card Corners**: Slightly rounded (`rounded-lg` or `rounded-xl`, 8px–12px) with crisp industrial borders (`border border-slate-200`).
- **Elevation**: Subtle clean shadows (`shadow-sm` transitioning to `shadow-md` on hover) avoiding excessive blur.
- **Interactive States**: Smooth micro-interactions (subtle hover scale, active button depression, skeleton loading screens).
- **Badges**:
  - `FOR SALE`: Blue-gray badge (`bg-slate-100 text-slate-800 border-slate-300`).
  - `FOR RENT`: Vibrant Safety Orange (`bg-amber-100 text-amber-900 border-amber-300`).
  - `3D VIEW`: Tech Purple / Indigo badge (`bg-indigo-100 text-indigo-700`).

---

## 3. User Roles & Access Control Matrix

The frontend must dynamically alter navigation, actions, and page access according to user authentication state and assigned role:

| Feature / Action | Guest (Unauthenticated) | Customer (Authenticated) | Admin (Staff / Operations) |
| :--- | :---: | :---: | :---: |
| Browse Catalog, Categories & Brands | Yes | Yes | Yes |
| Search, Filter & Sort Equipment | Yes | Yes | Yes |
| View 3D Models & Tech Specs | Yes | Yes | Yes |
| Add Items to Purchase Cart | Yes (Local state) | Yes (Synced to account) | Yes |
| Manage Wishlist | Prompt Login | Yes | Yes |
| **Equipment Rental Booking** | **Blocked** (Prompt Login/Register) | **Yes (Full access)** | **Yes (Full access)** |
| Checkout & Order Placement | Prompt Login | Yes | Yes |
| Select / Save Delivery Addresses | No | Yes | Yes |
| Location Tagging (GPS/Maps Link) | No | Yes | Yes |
| Initiate Payments (Koko/Mintpay/Bank) | No | Yes | Yes |
| View Personal Order & Rental History | No | Yes | Yes |
| Cancel Pending Orders/Rentals | No | Yes (Within window) | Yes |
| Submit Product Reviews & Ratings | No | Yes | Yes |
| Manage Catalog, SKUs & Inventory | No | No | **Full CRUD** |
| Approve / Reject Product Reviews | No | No | **Full Access** |
| Verify Bank Transfer Payments | No | No | **Full Access** |
| Transition Rental Statuses | No | No | **Full Access** |
| Export Analytics & Financial Reports | No | No | **Full Access** |

---

## 4. Application Routing Architecture

The React frontend should utilize standard client-side routing (e.g., React Router v6+) structured into three distinct zones: **Public Customer App**, **Protected Customer Account**, and **Protected Admin Management Portal**.

```
/ (Root)
│
├── PUBLIC ROUTES (Guest & Customer)
│   ├── /                                      -> Home Page (Hero, 3D Showcase, Categories, Featured Tools)
│   ├── /catalog                               -> Full Catalog (Browse, Filter, Search, Grid/List)
│   ├── /catalog/category/:slug                -> Filtered by Category
│   ├── /catalog/brand/:slug                   -> Filtered by Brand
│   ├── /product/:skuOrId                      -> Product Detail Page (PDP, 3D View, Variants, Buy/Rent)
│   ├── /rentals                               -> Dedicated Equipment Rental Catalog
│   ├── /cart                                  -> Shopping Cart Overview & Line Item Adjustments
│   ├── /login                                 -> Customer Login (JWT Auth)
│   ├── /register                              -> Customer Registration
│   ├── /terms-and-conditions                  -> Terms, Rental Policies & Damage Coverage
│   └── /contact                               -> Contact, Branch Locator & Phone Inquiries
│
├── PROTECTED CUSTOMER ROUTES (Requires Auth)
│   ├── /checkout                              -> Checkout (Address Selector, Map Tagger, Coupon, Payment)
│   ├── /order-confirmation/:orderNumber       -> Post-Checkout Success & Summary
│   ├── /account                               -> Customer Dashboard Overview
│   │   ├── /account/profile                   -> Profile Details (Name, Email, Mobile, NIC)
│   │   ├── /account/addresses                 -> Saved Delivery Addresses (Add/Edit/Default)
│   │   ├── /account/orders                    -> Purchase Order History & Live Tracking
│   │   ├── /account/orders/:orderNumber       -> Order Snapshot & Printable Invoice
│   │   ├── /account/rentals                   -> Rental Reservations & Active Equipment Tracking
│   │   ├── /account/rentals/:reference        -> Rental Snapshot, Deposit Status & Return Inspection
│   │   └── /account/wishlist                  -> Saved Favorite Tools & Machinery
│
└── PROTECTED ADMIN ROUTES (Requires Role: ADMIN)
    └── /admin                                 -> Operations Portal
        ├── /admin/dashboard                   -> KPI Metrics, Quick Actions & Live Activity
        ├── /admin/products                    -> Product Catalog List, Stock Indicators & CRUD
        ├── /admin/products/new                -> Create Product (Variants, Specs, 3D Asset URL)
        ├── /admin/products/:id/edit           -> Edit Product & Inventory
        ├── /admin/orders                      -> Customer Sales Orders & Delivery Management
        ├── /admin/rentals                     -> Equipment Rental Registry & Status Transitions
        ├── /admin/payments                    -> Payment Audit Log & Bank Slip Approvals
        ├── /admin/coupons                     -> Promotional Campaign & Coupon Configurator
        ├── /admin/reviews                     -> Customer Review Moderation Queue
        └── /admin/reports                     -> Financial, Inventory, Rental & Deposit Analytics
```

---

## 5. State Management & Authentication Flows

### 5.1 Authentication Architecture
- **JWT Storage**: Store the JWT Access Token in secure memory / state, and the Refresh Token in secure storage (`localStorage` or `HttpOnly` cookie).
- **Silent Token Refresh**: Axios or Fetch interceptor that automatically intercepts `401 Unauthorized` responses, calls the token refresh handler, and replays failed requests.
- **User Session State**:
  - `isAuthenticated`: Boolean.
  - `user`: Object containing `id`, `username`, `email`, `first_name`, `last_name`, `role` (`CUSTOMER` | `ADMIN`), `mobile_number`, `nic`, `profile_picture`.
  - `role`: Convenient helper getter (`isAdmin`, `isCustomer`).

### 5.2 Guest-to-Customer Cart Synchronization
1. When unauthenticated, guests can browse and add items to a local cart persisted in `localStorage`.
2. Upon user login or registration:
   - The application checks the local cart.
   - If items exist, it automatically reconciles and syncs them with the customer's server cart.
   - Clears the temporary local storage cart once synchronized.

### 5.3 Global Toast & Error Dispatcher
- Maintain a global notification/toast system (`success`, `error`, `warning`, `info`) with auto-dismiss (4000ms).
- Graceful API error boundary formatting: Display clear messages for out-of-stock items, invalid date ranges, and payment gateway rejections.

---

## 6. Core Business Logic & Specialized Workflows

### 6.1 Dual Purchase vs. Equipment Rental Paradigm
Every product card and product detail page must clearly distinguish between buying and renting:
- **Product Flags**:
  - `is_for_sale`: Indicates the item can be purchased. Displays `sale_price`.
  - `is_for_rent`: Indicates the item is in the rental fleet. Displays `rental_price` (quoted as *per day*).
  - Both `true`: The item has both buying and renting options. The UI provides a tabbed or side-by-side action panel ("Buy New" vs. "Rent Tool").
- **Cart vs. Rental Isolation**:
  - Standard e-commerce purchases go into the **Shopping Cart**.
  - Equipment rentals represent dedicated dated bookings and are processed via the **Equipment Rental Booking Flow**.

### 6.2 Equipment Rental Date Picker & Real-Time Availability Engine
Equipment rentals depend strictly on calendar dates and fleet availability:
1. **Date Selection**: The user chooses a `Start Date` and an `End Date` using an interactive calendar range picker.
   - Minimum rental duration: 1 Day.
   - Start Date cannot be in the past.
   - End Date cannot precede Start Date.
2. **Availability Check**:
   - As soon as the user selects valid dates, the frontend triggers a real-time availability check for that specific product or variant.
   - If `available_quantity > 0`: The UI displays a green badge: `Available for Selected Dates (X units in fleet)`. The "Confirm Rental Booking" button is enabled.
   - If `available_quantity === 0`: The UI displays a red badge: `Unavailable for these dates. Please adjust your rental period.` The action button is disabled.

### 6.3 Refundable Security Deposit Engine (10x Multiplier)
Universal Tool Depot protects high-value industrial machinery by holding a refundable security deposit during the rental period:
- **Formula**:
  $$\text{Rental Subtotal} = \text{Daily Rental Price} \times \text{Rental Days} \times \text{Quantity}$$
  $$\text{Refundable Security Deposit} = (\text{Daily Rental Price} \times \text{Deposit Multiplier}) \times \text{Quantity}$$
  $$\text{Total Amount Payable Today} = \text{Rental Subtotal} + \text{Refundable Security Deposit}$$
- **Default Multiplier**: **10x** (configurable in admin).
- **UI Transparency Requirement**:
  - The UI **MUST NEVER** surprise the user with the deposit at the final checkout step.
  - The booking modal and rental cards must present a clear breakdown:
    ```
    Daily Rate:               Rs. 2,500.00 / day
    Duration:                 5 Days (10/11/2026 - 15/11/2026)
    Rental Fee:               Rs. 12,500.00
    Refundable Deposit:      Rs. 25,000.00 (10x Daily Rate - 100% Refundable)
    ------------------------------------------------------------------------
    Total Due Now:            Rs. 37,500.00
    ```
  - Highlight with an info callout: *"The security deposit of Rs. 25,000.00 is fully refunded immediately upon safe return and inspection of the equipment."*

### 6.4 Interactive 3D Model Web Viewer (GLB/GLTF)
For products with `has_3d_model: true` and an attached 3D file/URL:
- **Viewer Component**: Embed an interactive 3D canvas (using `@google/model-viewer` web component or `@react-three/fiber`).
- **Features**:
  - Auto-rotate on initial load with a smooth dampening effect.
  - User touch/mouse controls: 360-degree orbit, pan, and scroll-to-zoom.
  - AR (Augmented Reality) button on compatible mobile browsers (WebXR / QuickLook).
  - Fullscreen expansion toggle.
  - Reset camera view button.
  - Fallback: Graceful loading spinner while the `.glb` file streams, with instant fallback to standard high-resolution 2D photos if WebGL is disabled.

### 6.5 Delivery Location Tagging & Physical Address Capture
Construction job sites often lack conventional street names or house numbers. The system mandates enhanced delivery location capture:
1. **Standard Address Fields**: Address Line 1, Address Line 2, City, State/Province, Postal Code.
2. **House / Plot / Site Number**: Distinct input field for the gate, building, or plot identifier.
3. **Tagged Location (GPS Coordinates or Google Maps Link)**:
   - A dedicated input field for a Google Maps URL or `Latitude, Longitude` string.
   - A "📍 Use My Current Location" button using the browser Geolocation API (`navigator.geolocation.getCurrentPosition`) that formats the coordinates into the field automatically.
   - An embedded interactive map pin selector (e.g., Leaflet or Google Maps embed) allowing the contractor to drop a pin on their exact site entrance.
4. **Customer Mobile Number**: Direct mobile phone field for driver dispatch and delivery SMS alerts.

### 6.6 Multi-Payment Processing (Koko, Mintpay, Bank Transfer)
During checkout (for both purchases and rentals), customers select from three payment methods:
1. **Koko (Buy Now Pay Later)**:
   - Displays Koko branding and an automated calculation dividing the total into 3 monthly interest-free payments:
     `Pay 3 installments of Rs. 12,500.00 with Koko`.
   - On submission, initiates payment and redirects to the Koko secure portal.
2. **Mintpay**:
   - Displays Mintpay badge: `Split into 3 easy debit/credit card payments`.
   - On submission, launches the Mintpay transaction window.
3. **Direct Bank Payment (Bank Transfer / Wire)**:
   - Displays UDT's verified company bank details in an attractive copy-to-clipboard card:
     - **Bank**: Commercial Bank of Ceylon
     - **Account Name**: Universal Tool Depot (Pvt) Ltd
     - **Account Number**: 1000 8923 4510
     - **Branch**: Colombo 03 / Corporate Branch
   - **Instruction Notice**: *"Please transfer the exact amount and quote your Order Reference Number as the transfer remark. Your order will be confirmed once verified by our accounts team."*
   - Includes a bank slip / proof of payment upload input (or displays instructions on the confirmation screen).

### 6.7 Dynamic Product Variants & Stock Synchronizer
Products can carry multiple variant dimensions (e.g., Motor Power: 800W vs 1200W, Battery Pack: Bare Tool vs With 2x Batteries):
- Selecting a variant immediately updates:
  - SKU code.
  - Additional sale price / rental price.
  - Stock availability counter.
  - Active image if the variant has a dedicated image.
- **Stock Enforcements**:
  - Quantity selector in cart or PDP cannot exceed the variant's `stock`.
  - If stock is `0`, disable the "Add to Cart" button and show `Out of Stock`.

### 6.8 Coupon & Discount Engine
- Users can enter a coupon code during checkout.
- Instant validation checks:
  - Expiration dates (`start_date` and `end_date`).
  - Active status.
  - Minimum purchase amount requirement (`min_purchase_amount`).
  - Type: `PERCENTAGE` (discount calculated up to 100%) vs `FIXED` (flat LKR deduction).
- Real-time deduction visual: Striking green discount line item in the order summary with a "Remove Coupon" button.

---

## 7. Detailed Page-by-Page Specifications

### 7.1 Global Header & Navigation
- **Top Announcement Bar**:
  - Display hotline phone: `+94 706 611 936`
  - Store hours: `Mon - Sat: 8:00 AM - 6:00 PM`
  - Promo banner: `Equipment Rental Available Islandwide | Fast Job Site Delivery`
- **Main Navigation Bar**:
  - **Brand Logo**: High-contrast Universal Tool Depot logo linking to `/`.
  - **Universal Search Bar**:
    - Instant autocomplete dropdown showing product image, name, SKU, price, and category.
    - Keyboard navigation (Up/Down/Enter).
  - **Primary Navigation Links**:
    - `All Tools` (Mega-menu with categories: Power Tools, Hand Tools, Demolition, Safety Equipment, Generators).
    - `Equipment Rental` (Direct link to `/rentals` with a highlighted "Rent Fleet" badge).
    - `Brands` (Dropdown of verified brands: Bosch, DeWalt, Makita, Stihl, etc.).
    - `About & Contact`.
  - **User Action Icons**:
    - **Wishlist Icon**: Displays active badge with count.
    - **Shopping Cart Icon**: Displays active badge with item count and subtotal preview on hover. Clicking opens the **Cart Slide-Over Drawer**.
    - **User Account Menu**:
      - If guest: `Sign In` / `Register` button.
      - If logged in: User avatar/name dropdown with links to `My Profile`, `Orders`, `Rentals`, `Saved Addresses`, and `Sign Out`.
      - If admin: Displays an additional highlighted `Admin Portal` link.

### 7.2 Global Footer
- **Company Info**: UDT overview, physical headquarters address in Sri Lanka, registered business number.
- **Quick Links**: Buy Equipment, Rent Equipment, Rental Terms & Security Deposits, Warranty Policy, Privacy Policy.
- **Customer Care**: Direct telephone line, WhatsApp direct chat link, email address.
- **Accepted Payments Row**: Official badges for Koko, Mintpay, Visa, Mastercard, and Direct Bank Transfer.
- **Copyright**: `© 2026 Universal Tool Depot. Developed by Devrious.`

### 7.3 Home Page (`/`)
1. **Hero Section**:
   - High-impact industrial carousel showcasing flagship tools and heavy rental fleets.
   - Dual Call-to-Actions: `Explore Catalog (Buy)` (Primary Yellow) and `Rent Construction Equipment` (Safety Orange).
   - Embedded interactive 3D model teaser (e.g., rotatable Bosch demolition hammer right inside the hero).
2. **Category Visual Grid**:
   - Cards with high-resolution imagery: *Heavy Machinery, Cordless Power Tools, Concrete & Masonry, Earthmoving & Compaction, Generators & Power*.
3. **Featured For-Sale Equipment**:
   - Product carousel with sale price, discount badges, and "Add to Cart" button.
4. **Featured Equipment Rental Fleet**:
   - Highlighted section displaying daily rates, deposit breakdown, and "Check Availability" buttons.
5. **Why Rent & Buy from UDT**:
   - 4-card value proposition: *Certified Heavy Machinery, Transparent 100% Refundable Deposits, Fast Job-Site Delivery, 24/7 Breakdown Replacement Support*.
6. **Customer Reviews & Testimonials Carousel**:
   - Star ratings and verified contractor comments.

### 7.4 Product Catalog & Search / Filter Listing (`/catalog` & `/rentals`)
- **Layout**: 2-column layout (Desktop: left filter sidebar + right product grid; Mobile: filter bottom sheet modal).
- **Filter Sidebar**:
  - **Listing Mode Toggle**: `All Items` | `For Sale Only` | `For Rent Only`.
  - **Category Hierarchy**: Multi-select checkboxes with category item counts.
  - **Brand Selector**: Filter by brand logos or checkboxes.
  - **Price Range Slider**: Dual-handle slider for minimum and maximum LKR.
  - **Availability Toggle**: Switch for `In Stock / Available Fleet Only`.
  - **Has 3D Model Toggle**: Filter tools featuring interactive 3D inspection.
- **Top Toolbar**:
  - Results count indicator (`Showing 24 of 118 equipment`).
  - Active filter pills with "Clear All" button.
  - **Sort Dropdown**: *Featured, Price: Low to High, Price: High to Low, Rental Rate: Low to High, Newest Arrivals, Name A-Z*.
  - **Grid / List View Switcher**.
- **Product Card Elements**:
  - Image with hover alternate angle.
  - Badges: `For Sale`, `For Rent`, `3D Model`, `Discount %`.
  - Brand name (subtle) and Product Title (truncated to 2 lines).
  - SKU code.
  - Pricing Block:
    - If sale: Formatted `Rs. XX,XXX.00` (plus crossed-out original price if discounted).
    - If rent: `Rs. X,XXX.00 / day` + subtle `Deposit: Rs. XX,XXX.00`.
  - Quick action buttons: "View Details", "Add to Cart", or "Book Rental".

### 7.5 Product Detail Page (PDP) (`/product/:id`)
- **Top Breadcrumbs**: `Home > Power Tools > Rotary Hammers > Bosch GBH-226`.
- **Left Column — Visual Gallery & 3D Stage**:
  - Tabs: `Photos` | `3D Interactive Model (GLB)`.
  - Large main image with click-to-zoom / lightbox.
  - Thumbnail reel below main viewer.
  - 3D Viewer tab loads interactive 3D canvas with rotate, zoom, and AR button.
- **Right Column — Purchase & Rental Control Center**:
  - Brand logo and verified badge.
  - Product title and distinct SKU tag.
  - Star ratings summary with link to jump to reviews section.
  - Stock status indicator (`In Stock (12 units available)` or `Low Stock` or `Out of Stock`).
  - **Variant Selector**: Size, Power, Battery Options (switches active selection and updates price in real time).
  - **Action Module (Dual Option Tabs)**:
    - **Tab 1: Outright Purchase**:
      - Displays sale price with tax/discount notice.
      - Quantity stepper (`- 1 +`).
      - Primary CTA: `Add to Shopping Cart` (Brand Yellow).
      - Secondary CTA: `Add to Wishlist`.
    - **Tab 2: Equipment Rental**:
      - Displays daily rental rate.
      - Inline date range picker.
      - Real-time fleet availability badge for selected dates.
      - Calculated deposit and total due breakdown.
      - Primary CTA: `Reserve for Rental` (Safety Orange).
- **Lower Section — Comprehensive Tabs**:
  - **Technical Specifications**: Structured key-value table (Motor Type, Chuck Size, Weight, Voltage, Cord Length, Decibel Rating).
  - **Description & Application Areas**: Rich text description of suitable job site applications.
  - **Warranty & Rental Terms**: Warranty duration, return inspection checklist, deposit refund policies.
  - **Customer Reviews & Rating Breakdown**:
    - Rating bar distribution (5-star down to 1-star percentage bars).
    - List of verified customer reviews.
    - "Write a Review" form for authenticated users (rating stars + text review).

### 7.6 Shopping Cart (Drawer & Page) (`/cart`)
- Slide-over drawer on quick add, with full `/cart` page option.
- Table / list of line items:
  - Product thumbnail and title.
  - Variant specifications tag.
  - Unit price.
  - Quantity controls with live stock validation limit.
  - Calculated subtotal per line.
  - Remove item button (`Trash` icon).
- **Cart Summary Card**:
  - Subtotal.
  - Shipping note (*Calculated at checkout*).
  - Estimated total.
  - Action buttons: `Proceed to Checkout` and `Clear Cart`.
  - Security badges: *Secure SSL Checkout, Fast Job-Site Dispatch*.

### 7.7 Equipment Rental Booking Flow (`/rentals`)
- Accessible directly from PDP or dedicated rental section.
- **Step 1: Rental Schedule & Fleet Selection**:
  - Select Start and End dates.
  - Automated rental days count.
  - Immediate availability confirmation.
- **Step 2: Cost & Security Deposit Summary**:
  - Clear line item for rental charges.
  - Clear line item for the 10x refundable deposit.
  - Explicit refund terms checkbox agreement (*"I understand that the deposit of Rs. XX,XXX is held and fully refunded upon safe return of the undamaged equipment"*).
- **Step 3: Delivery Site Details**:
  - Street, City, State, Postal Code.
  - House / Plot / Site Number.
  - GPS Coordinate / Google Maps Link tagger with "Use My Location" button.
  - Site contact mobile number.
- **Step 4: Confirm & Pay**:
  - Directs to payment gateway selection (Koko, Mintpay, Bank Transfer).

### 7.8 Checkout Page (`/checkout`)
- Clean, distraction-free 2-column layout.
- **Left Column — Details**:
  1. **Delivery Address Selection**:
     - Radio group of saved customer addresses with "Add New Address" toggle.
     - New address fields: Title (Home/Office/Site), Address Line 1, Line 2, City, State, Postal Code.
     - House / Plot Number.
     - Job-site Location Tag (Google Maps Link or GPS coordinate).
     - Contact mobile phone number.
  2. **Payment Method Selection**:
     - Radio card options:
       - `Koko (Pay in 3 Installments)`
       - `Mintpay (Pay in 3 Installments)`
       - `Direct Bank Transfer (Wire / Online Banking)`
     - When Direct Bank Transfer is active: Expand the verified bank details box with copy buttons and an upload field for the bank transaction receipt/slip.
- **Right Column — Order Summary**:
  - Mini list of cart items.
  - Subtotal.
  - **Coupon Code Input**:
    - Input box + "Apply" button.
    - If valid: Green pill with discount amount deducted.
    - If invalid: Red error text explaining reason (expired, minimum spend not met).
  - Final Total in LKR.
  - High-visibility `Place Order & Pay` button.

### 7.9 Order / Rental Confirmation & Printable Invoice
- **Visual Status Banner**: Large animated green checkmark with "Thank you! Your order has been placed."
- **Key Details Card**:
  - Generated Order Number (e.g., `ORD-20261106-0001`) or Rental Reference (`RNT-20261106-0001`).
  - Order status badge: `PENDING` (or `CONFIRMED` upon instant gateway return).
  - Selected payment method and instructions (especially for Bank Transfer).
- **Delivery Job Site Snapshot**:
  - Address, House Number, and Maps Location Pin link.
- **Itemized Invoice Table**:
  - Product, quantity, unit price, discounts, deposit (for rentals), and final amount paid.
- **Actions**:
  - `Print Invoice / Download Receipt` (clean print-optimized stylesheet).
  - `Track Order Status` button.
  - `Continue Shopping` button.

### 7.10 Customer Portal (`/account`)
- **Dashboard Sidebar Navigation**:
  - `My Profile`
  - `My Addresses`
  - `Order History`
  - `Rental Bookings`
  - `Wishlist`
  - `Logout`
- **My Profile**:
  - Edit first name, last name, mobile number, National Identity Card (NIC) number, profile avatar.
  - Username and Email (read-only for security).
- **My Addresses**:
  - Grid of saved delivery address cards with `Default` badge.
  - Add, edit, or delete address modal.
- **Order History**:
  - List of past orders with filter tabs: *All, Pending, Processing, Shipped, Delivered, Cancelled*.
  - Order card displays date, order number, total, status stepper bar, and button to view full invoice snapshot.
- **Rental Bookings Management**:
  - Dedicated equipment rental tracker.
  - Status stepper: `PENDING` ➔ `CONFIRMED` ➔ `ACTIVE (Equipment on Site)` ➔ `COMPLETED (Equipment Returned & Inspected)` | `CANCELLED`.
  - Deposit Status Badge: `Deposit Held (Rs. XX,XXX)` vs `Deposit Refunded`.
  - Self-Service Cancellation button (enabled only when status is `PENDING`).

### 7.11 Admin Portal (`/admin`)
- Accessible only to authenticated users with `role: "ADMIN"`.
- Modern industrial operations dashboard layout with dark collapsible sidebar:
  1. **Analytics Dashboard (`/admin/dashboard`)**:
     - Metric cards: *Total Revenue, Active Equipment on Rent, Pending Orders, Low Stock Alerts*.
     - Recent orders and rental activity feeds.
  2. **Product Catalog Manager (`/admin/products`)**:
     - Data table with search, category filter, stock status, and price columns.
     - Add Product form: Upload product images, define SKU, technical specifications, variants, and attach `.glb` 3D model URL/file.
  3. **Sales Order Manager (`/admin/orders`)**:
     - List all customer purchases. View full delivery snapshot (including job site map coordinates).
     - Update order fulfillment statuses (`PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`).
  4. **Equipment Rental Operations (`/admin/rentals`)**:
     - Registry of all active and upcoming rentals.
     - Action buttons to transition rental states:
       - `Confirm Booking` (Pending ➔ Confirmed)
       - `Dispatch Equipment` (Confirmed ➔ Active)
       - `Mark Returned & Release Deposit` (Active ➔ Completed)
       - `Cancel Rental`
  5. **Payment Audit & Bank Verification (`/admin/payments`)**:
     - Queue of pending Direct Bank Transfer submissions.
     - Admin can inspect order amount, customer reference, and click `Approve Payment (Success)` or `Mark Failed / Reject`.
  6. **Coupons & Campaigns (`/admin/coupons`)**:
     - Create new promotional coupon codes with start/end date pickers, percentage or fixed discounts, and minimum cart amounts.
  7. **Customer Review Moderation (`/admin/reviews`)**:
     - Table of newly submitted reviews. One-click `Approve` or `Delete/Reject`.
  8. **Reports & Exports (`/admin/reports`)**:
     - Custom date-range picker (`From Date` - `To Date`).
     - Generate and export reports in CSV/PDF format:
       - *Product Sales Report*
       - *Rental Fleet Utilization Report*
       - *Income & Payment Method Breakdown*
       - *Rental Deposit & Refunds Audit*
       - *Inventory Stock Depletion Report*

---

## 8. Form Validation Rules & Edge Cases

| Form / Field | Validation Rule | Error Message / Behavior |
| :--- | :--- | :--- |
| **Registration Password** | Minimum 8 characters, confirmation must match | *"Passwords do not match."* |
| **Customer Mobile Number** | Valid Sri Lankan 10-digit number (`07XXXXXXXX`) | *"Please enter a valid 10-digit mobile number."* |
| **Customer NIC** | Valid Sri Lankan NIC (9 digits + V/X or 12 numeric digits) | *"Please enter a valid National Identity Card (NIC) number."* |
| **Rental Dates** | Start date $\ge$ today; End date $\ge$ Start date | *"End date cannot precede start date."* |
| **Rental Availability** | Fleet quantity check for chosen dates | *"Equipment is fully booked for these dates."* |
| **Cart Quantity** | Cannot exceed variant/product available stock | Stepper capped at `stock`; displays *"Maximum stock reached"*. |
| **Variant Selection** | If product has active variants, one must be picked | Disables "Add to Cart"; prompts *"Please select an option"*. |
| **Job Site House/Plot** | Required for rental checkout | *"House/plot number is required for dispatch."* |
| **Job Site Location Tag** | Valid Google Maps URL or Lat/Long coordinates | *"Please provide a valid map link or coordinates."* |
| **Coupon Code** | Check expiry date, active status & minimum cart total | Inline error: *"Minimum spend of Rs. X,XXX required."* |

---

## 9. Recommended React Technology Stack & Libraries

To build this frontend cleanly, the following modern React libraries and patterns are recommended:

- **Framework**: React 18+ (Vite or Next.js App Router).
- **Styling**: Tailwind CSS v3+ with `@tailwindcss/forms` and `@tailwindcss/typography`.
- **Component Primitives**: Radix UI or Headless UI (for accessible dialogs, popovers, tabs, and dropdowns).
- **Icons**: `lucide-react` (clean, modern industrial icon set).
- **3D Model Rendering**:
  - Option A: `@google/model-viewer` (simplest, robust AR support, automatic camera controls).
  - Option B: Three.js with `@react-three/fiber` and `@react-three/drei` (for custom lighting and shaders).
- **State Management**:
  - Client State: Zustand or Redux Toolkit (for Cart, User session, and UI filters).
  - Server State & Caching: TanStack Query (React Query) for fast cached requests, background revalidation, and optimistic updates.
- **Form Handling & Validation**: `react-hook-form` paired with `zod` for declarative schema validation.
- **Date Range Picker**: `date-fns` paired with `react-day-picker`.
- **Maps & Geolocation**: `leaflet` / `react-leaflet` with OpenStreetMap or `@react-google-maps/api`.
- **Charts & Reporting (Admin)**: `recharts` for sales, rental volume, and revenue analytics.
- **Invoice Printing**: `react-to-print` for clean, professional PDF and thermal receipt printouts.

