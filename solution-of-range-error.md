# Solution for "Maximum call stack size exceeded" Error

## Problem
Next.js pages with Firestore data were causing "Maximum call stack size exceeded" errors when passing complex objects to client components, particularly when clicking tabs or rendering certain components.

## Root Cause
The data fetched from Firestore contains circular references (likely due to Firestore internal properties or nested object references). When Next.js automatically serializes props for client-side rendering using `JSON.stringify`, it encounters these circular references and throws a "Maximum call stack size exceeded" error due to infinite recursion.

## General Solution
Use `safeSerializeForClient` from `@/lib/firestore-utils` to properly serialize all data passed from server components to client components. This function strips circular references and handles Firestore Timestamps/Dates correctly.

### 1. Import the Utility
```typescript
import { safeSerializeForClient } from "@/lib/firestore-utils";
```

### 2. Serialize All Data Objects
Replace direct data passing with serialized versions:
```typescript
// Instead of passing raw data:
<ProductEditForm product={product} categories={categories} ... />

// Use serialized data:
const serializedProduct = safeSerializeForClient(product);
const serializedCategories = safeSerializeForClient(categories);
// ... serialize all data objects

<ProductEditForm
  product={serializedProduct}
  categories={serializedCategories}
  ...
/>
```

### 3. For Arrays and Complex Objects
`safeSerializeForClient` handles arrays, nested objects, and dates automatically:
```typescript
// Works for arrays:
const serializedItems = safeSerializeForClient(itemsArray);

// Works for complex nested objects:
const serializedComplexData = safeSerializeForClient(complexFirestoreObject);
```

### 4. Key Benefits
- ✅ Strips circular references safely
- ✅ Converts Firestore Timestamps to ISO strings
- ✅ Handles Date objects properly
- ✅ Prevents JSON serialization stack overflow
- ✅ Maintains data integrity for client components
- ✅ No manual date conversion needed

### 5. Applied To
- `src/app/dashboard/products/[id]/page.tsx` - Fixed multimedia tab rendering issue
- All server components passing Firestore data to client components should use this pattern

### 6. Alternative Manual Approach (if needed)
If `safeSerializeForClient` doesn't cover specific cases, manually serialize:
```typescript
const serializedData = {
  ...data,
  dateField: data.dateField?.toISOString?.() || data.dateField,
  nestedArray: data.nestedArray?.map(item => ({
    ...item,
    timestamp: item.timestamp?.toISOString?.() || item.timestamp,
  })) || [],
};
```

This ensures safe data transfer between server and client components without serialization errors, preventing the "Maximum call stack size exceeded" error across all pages and components.