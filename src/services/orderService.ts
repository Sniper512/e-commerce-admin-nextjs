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
  async createOrder(orderData: Omit<Order, "id">): Promise<string> {
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
            await batchService.adjustBatchQuantity(
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

  // Update order
  async updateOrder(id: string, updates: Partial<Order>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error("Order not found");
      }

      const sanitizedData = sanitizeForFirestore(updates);
      await updateDoc(docRef, sanitizedData);
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

      const updates: Partial<Order> = {
        status: newStatus,
        statusHistory,
      };

      // If delivered, set deliveredAt
      if (newStatus === "delivered") {
        updates.deliveredAt = new Date();
      }

      await this.updateOrder(id, updates);
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

      await this.updateOrder(id, {
        paymentStatus: newStatus,
        paymentStatusHistory,
      });
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
          (o) => o.status === "placed" || o.status === "pending_confirmation"
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
