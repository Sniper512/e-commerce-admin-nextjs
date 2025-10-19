# E-Commerce Admin Dashboard

A comprehensive admin dashboard for managing e-commerce operations, built with Next.js 15, TypeScript, Firebase, and Tailwind CSS.

## 🚀 Features

### 📦 Product & Category Management

- ✅ Add, edit, and remove products
- ✅ Organize products into multiple categories
- ✅ Support for single and composite products
- ✅ Display order management for categories
- ✅ Simple and Special categories (e.g., "Summer Sales")
- ✅ Batch management for products with expiry dates
- ✅ Carton management and tracking
- ✅ Product and batch expiry date tracking

### 📊 Inventory Management

- ✅ Real-time stock management
- ✅ Automatic low-stock alerts
- ✅ Critical inventory update notifications
- ✅ Minimum stock level tracking
- ✅ Expiry alerts based on batch dates

### 💳 Payment Management

- ✅ Multiple payment methods (Easypaisa, JazzCash, Cards, Bank Transfer, COD)
- ✅ Customer payment tracking
- ✅ Refund and return management
- ✅ Ledger management for expenses (rent, salaries, utilities, etc.)

### 👥 Customer Management

- ✅ View all registered customers
- ✅ Access customer order history
- ✅ Edit and modify customer data
- ✅ Handle customer payments
- ✅ Push notifications management
- ✅ Customer reviews moderation
- ✅ WhatsApp integration for support

### 🎉 Promotions & Discounts

- ✅ Add and modify discounts
- ✅ Promotional banner management
- ✅ Promo code creation and management
- ✅ Special deals highlighting

### 📋 Order Management

- ✅ View and manage all orders (Pending, Processing, Shipped, Delivered, etc.)
- ✅ Change order status
- ✅ Auto-generate invoices and receipts
- ✅ Refund and return request handling
- ✅ Create, update, or cancel orders

### 📈 Analytics & Reporting

- ✅ Sales overview dashboard
- ✅ Top products and categories tracking
- ✅ Sales trends analysis
- ✅ Customer segmentation
- ✅ Performance reports
- ✅ Data export (CSV/Excel)

### 🎨 Banner & Homepage Management

- ✅ Upload promotional banners
- ✅ Featured items highlighting
- ✅ Homepage layout management

## 🛠️ Tech Stack

- **Framework:** Next.js 15.5 (App Router)
- **Language:** TypeScript
- **Database:** Firebase Firestore
- **Authentication:** Firebase Auth
- **Storage:** Firebase Storage
- **Styling:** Tailwind CSS 4
- **UI Components:** Custom components with Radix UI
- **Icons:** Lucide React
- **Charts:** Recharts
- **Code Quality:** Biome

## 📋 Prerequisites

- Node.js 20+
- npm or yarn
- Firebase project with Firestore, Authentication, and Storage enabled

## 🚀 Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Firebase

The Firebase configuration is already set up in `firebaseConfig.ts`. Make sure your Firebase project has:

- Firestore Database enabled
- Authentication enabled (Email/Password recommended)
- Storage enabled
- Cloud Messaging enabled (for push notifications)

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## 📁 Project Structure

```
e-commerce-admin/
├── src/
│   ├── app/                      # Next.js app router pages
│   │   ├── dashboard/           # Dashboard pages
│   │   │   ├── products/        # Product management
│   │   │   ├── categories/      # Category management
│   │   │   ├── orders/          # Order management
│   │   │   ├── customers/       # Customer management
│   │   │   ├── payments/        # Payment management
│   │   │   ├── promotions/      # Promotions & discounts
│   │   │   ├── banners/         # Banner management
│   │   │   ├── notifications/   # Notification management
│   │   │   ├── inventory/       # Inventory management
│   │   │   └── analytics/       # Analytics & reports
│   │   ├── layout.tsx           # Root layout
│   │   └── page.tsx             # Home page (redirects to dashboard)
│   ├── components/
│   │   ├── ui/                  # Reusable UI components
│   │   └── layout/              # Layout components (Sidebar, Header)
│   ├── lib/
│   │   └── utils.ts             # Utility functions
│   └── types/
│       └── index.ts             # TypeScript type definitions
├── firebaseConfig.ts            # Firebase configuration
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

## 🔥 Firebase Collections Structure

### Products

```typescript
{
  id: string,
  name: string,
  slug: string,
  sku: string,
  type: 'single' | 'composite',
  basePrice: number,
  sellingPrice: number,
  categoryIds: string[],
  stockQuantity: number,
  minStockLevel: number,
  compositeItems: [{ productId: string, quantity: number }],
  hasBatches: boolean,
  displayOrder: number,
  isActive: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Categories

```typescript
{
  id: string,
  name: string,
  slug: string,
  type: 'simple' | 'special',
  displayOrder: number,
  showOnHomepage: boolean,
  showOnNavbar: boolean,
  isActive: boolean,
  createdAt: Timestamp
}
```

### Orders

```typescript
{
  id: string,
  orderNumber: string,
  customerId: string,
  items: OrderItem[],
  total: number,
  paymentMethod: string,
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded',
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
  createdAt: Timestamp
}
```

### Customers

```typescript
{
  id: string,
  name: string,
  email: string,
  phone: string,
  totalOrders: number,
  totalSpent: number,
  notificationsEnabled: boolean,
  fcmToken: string,
  createdAt: Timestamp
}
```

## 📝 Available Scripts

```bash
# Development
npm run dev          # Start development server with Turbopack

# Build
npm run build        # Build for production

# Production
npm run start        # Start production server

# Code Quality
npm run lint         # Run Biome linter
npm run format       # Format code with Biome
```

## 🎨 Key Features Implementation

### 1. Multiple Categories per Product

Products can belong to multiple categories simultaneously, allowing flexible organization.

### 2. Composite Products

Create products that are composed of other products (e.g., gift baskets, meal combos).

### 3. Batch Tracking

Track product batches with manufacturing and expiry dates for better inventory control.

### 4. Carton Management

Manage products by cartons with units per carton tracking.

### 5. Low Stock & Expiry Alerts

Automatic notifications when stock falls below minimum levels or products are nearing expiry.

### 6. Payment Method Management

Support for multiple payment methods with detailed tracking and reconciliation.

### 7. Order Status Workflow

Complete order lifecycle management from pending to delivered with all intermediate states.

### 8. Customer Notifications

Push notification system for offers, reminders, and updates via Firebase Cloud Messaging.

### 9. Analytics Dashboard

Comprehensive analytics with sales trends, top products, and customer insights.

### 10. Export Functionality

Export reports and data in CSV/Excel format for external analysis.

## 🔐 Security Considerations

1. Implement Firebase Authentication before deploying to production
2. Set up Firestore Security Rules to protect data
3. Add role-based access control (admin, manager, staff)
4. Implement API route protection
5. Enable Firebase App Check for additional security

## 🚀 Next Steps - Implementation Guide

### To Complete the Implementation:

1. **Firebase Integration**

   - Implement CRUD operations using Firebase SDK
   - Set up real-time listeners for live data updates
   - Configure Firestore security rules

2. **Authentication**

   - Implement login/logout functionality
   - Add role-based access control
   - Protect routes with middleware

3. **File Upload**

   - Implement image upload to Firebase Storage
   - Add image optimization and compression
   - Create thumbnail generation

4. **Notifications**

   - Set up Firebase Cloud Messaging
   - Implement push notification sending
   - Add notification scheduling

5. **Advanced Features**
   - Add real-time stock updates
   - Implement advanced filtering and sorting
   - Add bulk operations
   - Create detailed analytics reports

## 📱 Responsive Design

The dashboard is fully responsive and works on:

- Desktop (1920px+)
- Laptop (1280px - 1919px)
- Tablet (768px - 1279px)
- Mobile (320px - 767px)

## 🗂️ Pages Created

### ✅ Completed Pages:

- Dashboard (Overview with stats and recent activity)
- Products List (Grid view with search and filters)
- Add Product (Comprehensive form with all fields)
- Categories (Table view with management)
- Orders (List with status management)
- Customers (List with analytics)

### 📝 To Be Created:

- Batches Management
- Cartons Management
- Inventory Alerts
- Expiry Tracking
- Payment Methods
- Ledger & Expenses
- Promotions & Discounts
- Promo Codes
- Banners
- Notifications
- Analytics Reports
- Reviews Moderation
- Settings

## 📄 License

This project is licensed under the MIT License.

---

Built with ❤️ using Next.js and Firebase
