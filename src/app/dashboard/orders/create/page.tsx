import { Suspense } from "react";
import customerService from "@/services/customerService";
import paymentMethodService from "@/services/paymentMethodService";
import { productService } from "@/services/productService";
import batchService from "@/services/batchService";
import { OrderCreateForm } from "@/components/features/orders/order-create-form";

export default async function CreateOrderPage() {
  // Fetch all necessary data on the server
  const [customers, paymentMethods, allProducts] = await Promise.all([
    customerService.getAllCustomersForSearch({ isActive: true }),
    paymentMethodService.getActivePaymentMethods(),
    productService.getAll({ isActive: true }),
  ]);

  // Get stock data for all products
  const productIds = allProducts.map((p) => p.id);
  const stockData = await batchService.getStockDataForProducts(productIds);

  // Get first available batch for each product (for pricing and batch ID)
  const productsWithStock = await Promise.all(
    allProducts.map(async (product) => {
      const batches = await batchService.getBatchesByProductId(product.id);
      const activeBatch = batches.find((b) => b.remainingQuantity > 0);

      // Use the new productService function to get highest applicable discount percentage
      const highestDiscountPercentage =
        await productService.getHighestActiveDiscountPercentageByProductId(
          product.id
        );

      // Calculate the discount amount based on the batch price
      const price = activeBatch?.price || 0;
      const discountAmount = (price * highestDiscountPercentage) / 100;

      return {
        id: product.id,
        name: product.info.name,
        image: product.multimedia?.images?.[0] || "",
        price: price,
        stock: stockData[product.id]?.usableStock || 0,
        batchId: activeBatch?.id || "",
        discountPercentage: highestDiscountPercentage,
        discountAmount: discountAmount,
        finalPrice: price - discountAmount,
      };
    })
  );

  // Filter out products with no stock or no active batch
  const availableProducts = productsWithStock.filter(
    (p) => p.stock > 0 && p.batchId
  );

  // Serialize data for client component
  const serializedCustomers = JSON.parse(JSON.stringify(customers));
  const serializedProducts = JSON.parse(JSON.stringify(availableProducts));
  const serializedPaymentMethods = JSON.parse(JSON.stringify(paymentMethods));

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrderCreateForm
        customers={serializedCustomers}
        products={serializedProducts}
        paymentMethods={serializedPaymentMethods}
      />
    </Suspense>
  );
}
