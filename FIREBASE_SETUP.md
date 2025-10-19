# Firebase Setup Guide for E-Commerce Admin Dashboard

## Step 1: Firebase Project Setup

### 1.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name: `e-commerce-admin`
4. Enable/Disable Google Analytics (optional)
5. Click "Create Project"

### 1.2 Enable Required Services

#### Firestore Database

1. In Firebase Console, go to "Firestore Database"
2. Click "Create Database"
3. Choose "Start in test mode" (for development)
4. Select your preferred region
5. Click "Enable"

#### Authentication

1. Go to "Authentication" in Firebase Console
2. Click "Get Started"
3. Enable "Email/Password" sign-in method
4. Optionally enable Google sign-in

#### Storage

1. Go to "Storage" in Firebase Console
2. Click "Get Started"
3. Choose "Start in test mode"
4. Click "Done"

#### Cloud Messaging (for push notifications)

1. Go to "Cloud Messaging" in Firebase Console
2. Note down your Server Key and Sender ID

## Step 2: Firestore Security Rules

Replace the default rules with these production-ready rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      return isSignedIn() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    function isManagerOrAdmin() {
      return isSignedIn() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'manager'];
    }

    // Users collection
    match /users/{userId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }

    // Products collection
    match /products/{productId} {
      allow read: if true; // Public read for storefront
      allow create, update, delete: if isManagerOrAdmin();
    }

    // Categories collection
    match /categories/{categoryId} {
      allow read: if true; // Public read
      allow create, update, delete: if isManagerOrAdmin();
    }

    // Batches collection
    match /batches/{batchId} {
      allow read, write: if isManagerOrAdmin();
    }

    // Cartons collection
    match /cartons/{cartonId} {
      allow read, write: if isManagerOrAdmin();
    }

    // Orders collection
    match /orders/{orderId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update, delete: if isManagerOrAdmin();
    }

    // Customers collection
    match /customers/{customerId} {
      allow read: if isManagerOrAdmin() ||
                    (isSignedIn() && request.auth.uid == customerId);
      allow create: if true; // Allow user registration
      allow update: if isManagerOrAdmin() ||
                      (isSignedIn() && request.auth.uid == customerId);
      allow delete: if isAdmin();
    }

    // Payments collection
    match /payments/{paymentId} {
      allow read, write: if isManagerOrAdmin();
    }

    // Refunds collection
    match /refunds/{refundId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update, delete: if isManagerOrAdmin();
    }

    // Expenses collection
    match /expenses/{expenseId} {
      allow read, write: if isManagerOrAdmin();
    }

    // Discounts collection
    match /discounts/{discountId} {
      allow read: if true; // Public read
      allow write: if isManagerOrAdmin();
    }

    // Promo codes collection
    match /promoCodes/{promoCodeId} {
      allow read: if true;
      allow write: if isManagerOrAdmin();
    }

    // Banners collection
    match /banners/{bannerId} {
      allow read: if true;
      allow write: if isManagerOrAdmin();
    }

    // Reviews collection
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if isSignedIn();
      allow update, delete: if isManagerOrAdmin();
    }

    // Notifications collection
    match /notifications/{notificationId} {
      allow read: if isSignedIn();
      allow write: if isManagerOrAdmin();
    }

    // Payment methods collection
    match /paymentMethods/{methodId} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
```

## Step 3: Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Product images
    match /products/{productId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Category images
    match /categories/{categoryId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Banner images
    match /banners/{bannerId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // User avatars
    match /avatars/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Expense receipts
    match /expenses/{expenseId}/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Step 4: Initial Data Setup

### 4.1 Create Admin User

1. Go to Authentication in Firebase Console
2. Click "Add User"
3. Email: `admin@example.com`
4. Password: `admin123` (change this immediately!)
5. Note the User UID

### 4.2 Create User Document in Firestore

Create a document in the `users` collection:

```json
{
	"id": "USER_UID_FROM_STEP_4.1",
	"email": "admin@example.com",
	"name": "Admin User",
	"role": "admin",
	"createdAt": "2025-10-16T00:00:00Z",
	"updatedAt": "2025-10-16T00:00:00Z"
}
```

### 4.3 Seed Initial Categories

Create documents in the `categories` collection:

```json
// Document 1
{
  "name": "Oil & Ghee",
  "slug": "oil-ghee",
  "type": "simple",
  "displayOrder": 1,
  "showOnHomepage": true,
  "showOnNavbar": true,
  "isActive": true,
  "createdAt": "2025-10-16T00:00:00Z",
  "updatedAt": "2025-10-16T00:00:00Z"
}

// Document 2
{
  "name": "Grains",
  "slug": "grains",
  "type": "simple",
  "displayOrder": 2,
  "showOnHomepage": true,
  "showOnNavbar": true,
  "isActive": true,
  "createdAt": "2025-10-16T00:00:00Z",
  "updatedAt": "2025-10-16T00:00:00Z"
}

// Document 3
{
  "name": "Detergents",
  "slug": "detergents",
  "type": "simple",
  "displayOrder": 3,
  "showOnHomepage": false,
  "showOnNavbar": true,
  "isActive": true,
  "createdAt": "2025-10-16T00:00:00Z",
  "updatedAt": "2025-10-16T00:00:00Z"
}

// Document 4
{
  "name": "Summer Sales",
  "slug": "summer-sales",
  "type": "special",
  "displayOrder": 4,
  "showOnHomepage": true,
  "showOnNavbar": true,
  "isActive": true,
  "createdAt": "2025-10-16T00:00:00Z",
  "updatedAt": "2025-10-16T00:00:00Z"
}
```

### 4.4 Seed Payment Methods

Create documents in the `paymentMethods` collection:

```json
// Cash on Delivery
{
  "name": "Cash on Delivery",
  "type": "cash_on_delivery",
  "isActive": true,
  "displayOrder": 1
}

// Easypaisa
{
  "name": "Easypaisa",
  "type": "easypaisa",
  "isActive": true,
  "displayOrder": 2,
  "accountDetails": {
    "accountNumber": "03001234567",
    "accountTitle": "Your Store Name"
  }
}

// JazzCash
{
  "name": "JazzCash",
  "type": "jazzcash",
  "isActive": true,
  "displayOrder": 3,
  "accountDetails": {
    "accountNumber": "03211234567",
    "accountTitle": "Your Store Name"
  }
}

// Bank Transfer
{
  "name": "Bank Transfer",
  "type": "bank_transfer",
  "isActive": true,
  "displayOrder": 4,
  "accountDetails": {
    "accountNumber": "1234567890",
    "accountTitle": "Your Store Name",
    "bankName": "Your Bank"
  }
}
```

## Step 5: Indexes (for complex queries)

Create these composite indexes in Firestore:

1. **Products**

   - Collection: `products`
   - Fields: `categoryIds` (Arrays), `displayOrder` (Ascending)
   - Query scope: Collection

2. **Orders**

   - Collection: `orders`
   - Fields: `customerId` (Ascending), `createdAt` (Descending)
   - Query scope: Collection

3. **Batches**
   - Collection: `batches`
   - Fields: `productId` (Ascending), `expiryDate` (Ascending)
   - Query scope: Collection

## Step 6: Cloud Functions (Optional - for advanced features)

### 6.1 Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 6.2 Initialize Functions

```bash
firebase init functions
```

### 6.3 Example Function for Low Stock Alerts

Create in `functions/src/index.ts`:

```typescript
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

// Check low stock daily
export const checkLowStock = functions.pubsub
	.schedule("every 24 hours")
	.onRun(async (context) => {
		const productsRef = admin.firestore().collection("products");
		const snapshot = await productsRef.get();

		const lowStockProducts = snapshot.docs.filter((doc) => {
			const data = doc.data();
			return data.stockQuantity <= data.minStockLevel;
		});

		// Send notifications or create alerts
		console.log(`Found ${lowStockProducts.length} low stock products`);

		return null;
	});

// Update customer stats on order creation
export const updateCustomerStats = functions.firestore
	.document("orders/{orderId}")
	.onCreate(async (snap, context) => {
		const order = snap.data();
		const customerRef = admin
			.firestore()
			.collection("customers")
			.doc(order.customerId);

		await customerRef.update({
			totalOrders: admin.firestore.FieldValue.increment(1),
			totalSpent: admin.firestore.FieldValue.increment(order.total),
		});
	});
```

## Step 7: Environment Variables (Optional)

Create `.env.local` file for sensitive data:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## Step 8: Testing

1. Start your development server:

```bash
npm run dev
```

2. Navigate to `http://localhost:3000`
3. You should see the dashboard
4. Test CRUD operations for products, categories, etc.

## Step 9: Production Deployment

### 9.1 Update Security Rules

Switch from "test mode" to production rules

### 9.2 Enable App Check

1. Go to Firebase Console > App Check
2. Register your app
3. Enable reCAPTCHA or App Attest

### 9.3 Deploy to Vercel

```bash
npm run build
# Deploy using Vercel CLI or GitHub integration
```

## Troubleshooting

### Issue: "Permission Denied" errors

- Check your Firestore security rules
- Ensure user is authenticated
- Verify user role in Firestore

### Issue: Images not uploading

- Check Storage security rules
- Verify file size limits
- Check CORS settings

### Issue: Real-time updates not working

- Ensure you're using Firestore listeners
- Check network connectivity
- Verify Firestore is enabled

## Next Steps

1. Implement authentication UI
2. Add image upload functionality
3. Create remaining pages (Analytics, Notifications, etc.)
4. Add real-time listeners for live updates
5. Implement push notifications
6. Set up email notifications
7. Add data export functionality
8. Implement advanced analytics

---

For more information, visit:

- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
