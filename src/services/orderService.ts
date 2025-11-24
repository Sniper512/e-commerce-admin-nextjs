import { Order, OrderStatus, PaymentStatus } from "@/types";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/../firebaseConfig";
import { sanitizeForFirestore, convertTimestamp } from "@/lib/firestore-utils";
import { adjustBatchQuantity } from "@/helpers/firestore_helper_functions/batches/update_methods/adjustBatchQuantityInDB";

const COLLECTION_NAME = "ORDERS";

// Helper function to convert Firestore data to Order
const firestoreToOrder = (id: string, data: any): Order => {
  return {
    id,
    customerId: data.customerId || "",
    items: data.items || [],
    subtotal: data.subtotal || 0,
    discount: data.discount || 0,
    deliveryFee: data.deliveryFee || 0,
    total: data.total || 0,
    paymentMethod: data.paymentMethod || {},
    paymentStatus: data.paymentStatus || "pending",
    paymentStatusHistory: (data.paymentStatusHistory || []).map((h: any) => ({
      status: h.status,
      updatedAt: convertTimestamp(h.updatedAt),
    })),
    deliveryAddress: data.deliveryAddress || "",
    status: data.status || "placed",
    statusHistory: (data.statusHistory || []).map((h: any) => ({
      status: h.status,
      updatedAt: convertTimestamp(h.updatedAt),
    })),
    riderId: data.riderId,
    proofOfPaymentUrl: data.proofOfPaymentUrl,
    createdAt: convertTimestamp(data.createdAt),
    deliveredAt: data.deliveredAt
      ? convertTimestamp(data.deliveredAt)
      : undefined,
  };
};

const orderService = {
  // Get all orders
  async getAllOrders(): Promise<Order[]> {
    try {
      const ordersRef = collection(db, COLLECTION_NAME);
      const q = query(ordersRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => firestoreToOrder(doc.id, doc.data()));
    } catch (error) {
      console.error("Error fetching orders:", error);
      throw error;
    }
  },

  // Get order by ID
  async getOrderById(id: string): Promise<Order | null> {
    console.log('getOrderById called, db:', db);
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return firestoreToOrder(docSnap.id, docSnap.data());
      }
      return null;
    } catch (error) {
      console.error("Error fetching order:", error);
      throw error;
    }
  },

  // Create new order
  async createOrder(orderData: Omit<Order, "id" | "proofOfPaymentUrl"> & { proofOfPaymentUrl?: string }): Promise<string> {
    try {
      const ordersRef = collection(db, COLLECTION_NAME);

      const newOrderData = {
        customerId: orderData.customerId,
        items: orderData.items,
        subtotal: orderData.subtotal,
        discount: orderData.discount,
        deliveryFee: orderData.deliveryFee || 0,
        total: orderData.total,
        paymentMethod: orderData.paymentMethod,
        paymentStatus: orderData.paymentStatus,
        paymentStatusHistory: orderData.paymentStatusHistory,
        deliveryAddress: orderData.deliveryAddress,
        status: orderData.status,
        statusHistory: orderData.statusHistory,
        riderId: orderData.riderId,
        proofOfPaymentUrl: orderData.proofOfPaymentUrl,
        createdAt: orderData.createdAt || new Date(),
        deliveredAt: orderData.deliveredAt,
      };

      const sanitizedData = sanitizeForFirestore(newOrderData);
      const docRef = await addDoc(ordersRef, sanitizedData);

      // Update customer's totalOrders and totalSpent
      const customerRef = doc(db, "CUSTOMERS", orderData.customerId);
      const customerSnap = await getDoc(customerRef);

      if (customerSnap.exists()) {
        const customerData = customerSnap.data();
        await updateDoc(customerRef, {
          totalOrders: (customerData.totalOrders || 0) + 1,
          totalSpent: (customerData.totalSpent || 0) + orderData.total,
        });
      }

      // Adjust batch quantities for ordered items
      const batchService = (await import("./batchService")).default;
      for (const item of orderData.items) {
        if (item.batchId) {
          try {
            await adjustBatchQuantity(
              item.batchId,
              -item.quantity
            );
          } catch (error) {
            console.error(`Error adjusting batch ${item.batchId}:`, error);
          }
        }
      }

      return docRef.id;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  },

  // Update order (only for COD orders in pending status)
  async updateOrder(id: string, updates: Partial<Order>): Promise<void> {
    try {
      const order = await this.getOrderById(id);
      if (!order) {
        throw new Error("Order not found");
      }

      // Business rule validation
      if (order.status !== 'pending') {
        throw new Error("Only pending orders can be edited");
      }

      if (order.paymentMethod.type !== 'cash_on_delivery') {
        throw new Error("Only COD orders can be edited");
      }

      // Calculate old quantities per batch
      const oldQuantities = new Map<string, number>();
      for (const item of order.items) {
        if (item.batchId) {
          oldQuantities.set(item.batchId, (oldQuantities.get(item.batchId) || 0) + item.quantity);
        }
      }

      const docRef = doc(db, COLLECTION_NAME, id);
      const sanitizedData = sanitizeForFirestore(updates);
      await updateDoc(docRef, sanitizedData);

      // Get updated order
      const updatedOrder = await this.getOrderById(id);
      if (!updatedOrder) {
        throw new Error("Order not found");
      }

      // Calculate new quantities per batch
      const newQuantities = new Map<string, number>();
      for (const item of updatedOrder.items) {
        if (item.batchId) {
          newQuantities.set(item.batchId, (newQuantities.get(item.batchId) || 0) + item.quantity);
        }
      }

      // Adjust batches for quantity changes
      for (const [batchId, oldQty] of oldQuantities) {
        const newQty = newQuantities.get(batchId) || 0;
        const diff = newQty - oldQty;
        if (diff !== 0) {
          try {
            await adjustBatchQuantity(batchId, -diff);
          } catch (error) {
            console.error(`Error adjusting batch ${batchId}:`, error);
          }
        }
      }

      // Adjust for new batches not in old
      for (const [batchId, newQty] of newQuantities) {
        if (!oldQuantities.has(batchId)) {
          try {
            await adjustBatchQuantity(batchId, -newQty);
          } catch (error) {
            console.error(`Error adjusting batch ${batchId}:`, error);
          }
        }
      }
    } catch (error) {
      console.error("Error updating order:", error);
      throw error;
    }
  },

  // Update order status
  async updateOrderStatus(id: string, newStatus: OrderStatus): Promise<void> {
    try {
      const order = await this.getOrderById(id);
      if (!order) {
        throw new Error("Order not found");
      }

      const statusHistory = [
        ...order.statusHistory,
        {
          status: newStatus,
          updatedAt: new Date(),
        },
      ];

      const updates: any = {
        status: newStatus,
        statusHistory: sanitizeForFirestore(statusHistory),
      };

      // If delivered, set deliveredAt
      if (newStatus === "delivered") {
        updates.deliveredAt = new Date();
      }

      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error("Error updating order status:", error);
      throw error;
    }
  },

  // Update payment status
  async updatePaymentStatus(
    id: string,
    newStatus: PaymentStatus
  ): Promise<void> {
    try {
      const order = await this.getOrderById(id);
      if (!order) {
        throw new Error("Order not found");
      }

      const paymentStatusHistory = [
        ...order.paymentStatusHistory,
        {
          status: newStatus,
          updatedAt: new Date(),
        },
      ];

      const docRef = doc(db, COLLECTION_NAME, id);
      const sanitizedData = sanitizeForFirestore({
        paymentStatus: newStatus,
        paymentStatusHistory,
      });
      await updateDoc(docRef, sanitizedData);
    } catch (error) {
      console.error("Error updating payment status:", error);
      throw error;
    }
  },

  // Get orders by customer ID
  async getOrdersByCustomerId(customerId: string): Promise<Order[]> {
    try {
      const orders = await this.getAllOrders();
      return orders.filter((order) => order.customerId === customerId);
    } catch (error) {
      console.error("Error fetching orders by customer:", error);
      throw error;
    }
  },

  // Cancel order (only for COD orders in pending status)
  async cancelOrder(orderId: string): Promise<void> {
    try {
      const order = await this.getOrderById(orderId);
      if (!order) {
        throw new Error("Order not found");
      }

      // Business rule validation
      if (order.status !== 'pending') {
        throw new Error("Only pending orders can be cancelled");
      }

      if (order.paymentMethod.type !== 'cash_on_delivery') {
        throw new Error("Only COD orders can be cancelled");
      }

      // Update order status to cancelled
      await this.updateOrderStatus(orderId, 'cancelled');

      // Reverse customer statistics
      const customerRef = doc(db, "CUSTOMERS", order.customerId);
      const customerSnap = await getDoc(customerRef);

      if (customerSnap.exists()) {
        const customerData = customerSnap.data();
        await updateDoc(customerRef, {
          totalOrders: (customerData.totalOrders || 0) - 1,
          totalSpent: (customerData.totalSpent || 0) - order.total,
        });
      }

      // Restock inventory
      for (const item of order.items) {
        if (item.batchId) {
          try {
            await adjustBatchQuantity(item.batchId, item.quantity);
          } catch (error) {
            console.error(`Error restocking batch ${item.batchId}:`, error);
          }
        }
      }

    } catch (error) {
      console.error("Error cancelling order:", error);
      throw error;
    }
  },

  // Get order statistics
  async getOrderStats(): Promise<{
    totalOrders: number;
    pendingOrders: number;
    confirmedOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
  }> {
    try {
      const orders = await this.getAllOrders();

      return {
        totalOrders: orders.length,
        pendingOrders: orders.filter(
          (o) => o.status === "pending"
        ).length,
        confirmedOrders: orders.filter((o) => o.status === "confirmed").length,
        deliveredOrders: orders.filter((o) => o.status === "delivered").length,
        cancelledOrders: orders.filter((o) => o.status === "cancelled").length,
        totalRevenue: orders
          .filter((o) => o.status === "delivered")
          .reduce((sum, o) => sum + o.total, 0),
      };
    } catch (error) {
      console.error("Error getting order stats:", error);
      throw error;
    }
  },
};

export default orderService;
