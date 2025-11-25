'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import customerService from "@/services/customerService";
import paymentMethodService from "@/services/paymentMethodService";
import { productService } from "@/services/productService";
import orderService from "@/services/orderService";
import { OrderEditForm } from "@/components/features/orders/order-edit-form";
import { Loader2 } from "lucide-react";

interface ProductWithStock {
  id: string;
  name: string;
  image: string;
  price: number;
  stock: number;
  isAvailableForOrder: boolean;
  // Additional fields for fetched products
  batchId?: string;
  discountAmount?: number;
  finalPrice?: number;
}

export default function EditOrderPage() {
  const params = useParams();
  const id = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch existing order
        const orderData = await orderService.getOrderById(id);
        if (!orderData) {
          setError("Order not found");
          return;
        }

        // Business rule validation - only pending orders can be edited
        if (orderData.status !== 'pending') {
          setError("Only pending orders can be edited");
          return;
        }

        setOrder(orderData);

        // Fetch basic data
        const customersData = await customerService.getAllCustomersForSearch({ isActive: true });

        // Ensure the order's customer is included (even if inactive)
        let customers = customersData;
        if (orderData.customerId && !customers.find(c => c.id === orderData.customerId)) {
          try {
            const orderCustomer = await customerService.getCustomerById(orderData.customerId);
            if (orderCustomer) {
              customers = [...customers, {
                id: orderCustomer.id,
                name: orderCustomer.name,
                phone: orderCustomer.phone
              }];
            }
          } catch (error) {
            console.error("Error fetching order customer:", error);
          }
        }
        setCustomers(customers);

        // Use hardcoded payment methods (same as create form)
        const paymentMethods = [
          {
            id: "cod",
            type: "cash_on_delivery" as const,
            isActive: true,
            displayOrder: 1,
            createdAt: new Date(),
          },
          {
            id: "easypaisa",
            type: "easypaisa" as const,
            isActive: true,
            displayOrder: 2,
            createdAt: new Date(),
          },
          {
            id: "jazzcash",
            type: "jazzcash" as const,
            isActive: true,
            displayOrder: 3,
            createdAt: new Date(),
          },
          {
            id: "bank_transfer",
            type: "bank_transfer" as const,
            isActive: true,
            displayOrder: 4,
            createdAt: new Date(),
          },
        ];
        setPaymentMethods(paymentMethods);

        // Get products with basic info only
        const allProducts = await productService.getAll({ isActive: true, limit: 50 });

        // Convert to ProductWithStock format
        let products: ProductWithStock[] = allProducts.products.map(product => ({
          id: product.id,
          name: product.info?.name || "",
          image: product.multimedia?.images?.[0] || "",
          price: 0, // Will be calculated on client side when needed
          stock: 0, // Will be checked on client side when needed
          isAvailableForOrder: false, // Will be determined on client side
        }));

        // Ensure products from the order are included
        for (const item of orderData.items) {
          if (!products.find(p => p.id === item.productId)) {
            try {
              const productData = await productService.getById(item.productId);
              if (productData) {
                products = [...products, {
                  id: productData.id,
                  name: productData.info?.name || "",
                  image: productData.multimedia?.images?.[0] || "",
                  price: 0, // Will be calculated on client side when needed
                  stock: 0, // Will be checked on client side when needed
                  isAvailableForOrder: false, // Will be determined on client side
                }];
              }
            } catch (error) {
              console.error(`Error fetching product ${item.productId}:`, error);
            }
          }
        }

        setProducts(products);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load edit form");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500">
        {error}
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center">
        Order not found
      </div>
    );
  }

  return (
    <OrderEditForm
      order={order}
      customers={customers}
      products={products}
      paymentMethods={paymentMethods}
    />
  );
}