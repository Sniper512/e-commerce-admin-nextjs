# Database Schema ERD

This document contains the Entity-Relationship Diagram for the current database schema, unified between the code implementation and requirements.md.

The diagram is in Mermaid format, which can be imported into draw.io (diagrams.net) for editing:
1. Open draw.io
2. Create new diagram
3. Go to File > Import From > Text/Mermaid
4. Paste the Mermaid code below

```mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : "places (1:N)"
    ORDER ||--|{ ORDER_ITEM : "contains (1:N)"
    ORDER_ITEM }o--|| PRODUCT : "references (N:1)"
    ORDER_ITEM }o--|| BATCH : "from batch (N:1)"
    ORDER }o--|| PAYMENT_METHOD : "uses (N:1)"
    ORDER }o--o{ DISCOUNT : "applies (N:M)"
    PRODUCT }o--|| CATEGORY : "belongs to (N:1)"
    PRODUCT }o--|| MANUFACTURER : "made by (N:1)"
    PRODUCT ||--o{ BATCH : "has batches (1:N)"
    DISCOUNT }o--o{ PRODUCT : "applies to (N:M)"
    DISCOUNT }o--o{ CATEGORY : "applies to (N:M)"
    CATEGORY ||--o{ SUBCATEGORY : "has subcategories (1:N)"
    SUBCATEGORY }o--|| CATEGORY : "belongs to (N:1)"

    CUSTOMER {
        string id PK
        string name
        string phone
        string address
        number totalOrders
        number totalSpent
        boolean notificationsEnabled
        boolean isActive
        Date createdAt
        Date updatedAt
    }

    ORDER {
        string id PK
        string customerId FK
        OrderItem[] items
        number subtotal
        number discount
        number deliveryFee
        number total
        PaymentMethod paymentMethod
        PaymentStatus paymentStatus "pending|awaiting_confirmation|confirmed|refunded|cancelled"
        object[] paymentStatusHistory
        string deliveryAddress
        OrderStatus status "pending|confirmed|shipped|delivered|cancelled|refunded"
        object[] statusHistory
        string riderId
        Date createdAt
        Date deliveredAt
    }

    ORDER_ITEM {
        string productId FK
        string productName
        number quantity
        number unitPrice
        number discount
        number subtotal
        string batchId FK
    }

    PRODUCT {
        string id PK
        string slug
        ProductInfo info
        number price
        string[] discountIds
        number minimumStockQuantity
        ProductMultimedia multimedia
        string[] similarProductIds
        string[] boughtTogetherProductIds
        PurchaseOrderHistory[] purchaseHistory
        object batchStock
        Date createdAt
    }

    BATCH {
        string id PK
        string batchId
        string productId FK
        Date manufacturingDate
        Date expiryDate
        number quantity
        number remainingQuantity
        number price
        string supplier
        string location
        string notes
        boolean isActive
        Date createdAt
    }

    PAYMENT_METHOD {
        string id PK
        PaymentMethodType type "cod|easypaisa|jazzcash|bank_transfer"
        boolean isActive
        number displayOrder
        Date createdAt
        object accountDetails
    }

    DISCOUNT {
        string id PK
        string name
        string description
        number value
        DiscountApplicableTo applicableTo "products|categories|order"
        number minPurchaseAmount
        Date startDate
        Date endDate
        Date createdAt
    }

    CATEGORY {
        string id PK
        string name
        string slug
        string description
        CategoryType type "simple|special"
        number displayOrder
        string image
        number subCategoryCount
        boolean isActive
        string[] productIds
        number productCount
        boolean showOnHomepage
        boolean showOnNavbar
        string[] discountIds
        string[] manufacturerIds
        Date createdAt
    }

    SUBCATEGORY {
        string id PK
        string name
        string slug
        string description
        number displayOrder
        string image
        string parentCategoryId FK
        boolean isActive
        string[] productIds
        number productCount
        boolean showOnNavbar
        string[] discountIds
        Date createdAt
    }

    MANUFACTURER {
        string id PK
        string name
        string description
        string logo
        number displayOrder
        boolean isActive
        number productCount
        Date createdAt
    }

    BANNER {
        string id PK
        string title
        string description
        string imageUrl
        BannerType bannerType "popup|homepage"
        LinkType linkType "category|product"
        string link
        boolean isActive
        number displayOrder
        Date createdAt
    }
```

### Key Notes:
- **Unified Status Names**: Order and Payment statuses now match requirements.md exactly
- **Consistent createdAt Fields**: All entities now have createdAt timestamps for tracking
- **Complete Relationships**: All foreign keys and relationships are properly defined
- **Collections**: Firestore collections are uppercase (e.g., ORDERS, CUSTOMERS)
- **Data Types**: All fields have proper TypeScript types specified
- **Complex Objects**: Nested objects like ProductInfo, ProductMultimedia are shown as object types

### Status Alignments (Requirements vs Code):
- **OrderStatus**: `pending|confirmed|shipped|delivered|cancelled|refunded` ✅
- **PaymentStatus**: `pending|awaiting_confirmation|confirmed|refunded|cancelled` ✅
- **All entities**: Include `createdAt` field for consistency ✅