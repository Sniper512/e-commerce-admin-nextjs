import {
	collection,
	doc,
	getDocs,
	getDoc,
	addDoc,
	updateDoc,
	deleteDoc,
	query,
	where,
	orderBy,
	Timestamp,
	QueryConstraint,
	increment,
} from "firebase/firestore";
import { db } from "@/../firebaseConfig";
import { Order, Customer, Payment, Refund } from "@/types";

const ORDERS_COLLECTION = "orders";
const CUSTOMERS_COLLECTION = "customers";
const PAYMENTS_COLLECTION = "payments";
const REFUNDS_COLLECTION = "refunds";

// Order Services
export const orderService = {
	// Get all orders
	async getAll(filters?: {
		customerId?: string;
		status?: string;
		paymentStatus?: string;
	}): Promise<Order[]> {
		const constraints: QueryConstraint[] = [];

		if (filters?.customerId) {
			constraints.push(where("customerId", "==", filters.customerId));
		}
		if (filters?.status) {
			constraints.push(where("status", "==", filters.status));
		}
		if (filters?.paymentStatus) {
			constraints.push(where("paymentStatus", "==", filters.paymentStatus));
		}

		constraints.push(orderBy("createdAt", "desc"));

		const q = query(collection(db, ORDERS_COLLECTION), ...constraints);
		const snapshot = await getDocs(q);

		return snapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
			createdAt: doc.data().createdAt?.toDate(),
			updatedAt: doc.data().updatedAt?.toDate(),
			deliveredAt: doc.data().deliveredAt?.toDate(),
		})) as Order[];
	},

	// Get order by ID
	async getById(id: string): Promise<Order | null> {
		const docRef = doc(db, ORDERS_COLLECTION, id);
		const docSnap = await getDoc(docRef);

		if (!docSnap.exists()) return null;

		return {
			id: docSnap.id,
			...docSnap.data(),
			createdAt: docSnap.data().createdAt?.toDate(),
			updatedAt: docSnap.data().updatedAt?.toDate(),
			deliveredAt: docSnap.data().deliveredAt?.toDate(),
		} as Order;
	},

	// Create order
	async create(
		data: Omit<Order, "id" | "createdAt" | "updatedAt">
	): Promise<string> {
		const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
			...data,
			createdAt: Timestamp.now(),
			updatedAt: Timestamp.now(),
		});

		// Update customer stats
		const customerRef = doc(db, CUSTOMERS_COLLECTION, data.customerId);
		await updateDoc(customerRef, {
			totalOrders: increment(1),
			totalSpent: increment(data.total),
		});

		return docRef.id;
	},

	// Update order status
	async updateStatus(id: string, status: Order["status"]): Promise<void> {
		const docRef = doc(db, ORDERS_COLLECTION, id);
		const updateData: any = {
			status,
			updatedAt: Timestamp.now(),
		};

		if (status === "delivered") {
			updateData.deliveredAt = Timestamp.now();
		}

		await updateDoc(docRef, updateData);
	},

	// Update payment status
	async updatePaymentStatus(
		id: string,
		paymentStatus: Order["paymentStatus"]
	): Promise<void> {
		const docRef = doc(db, ORDERS_COLLECTION, id);
		await updateDoc(docRef, {
			paymentStatus,
			updatedAt: Timestamp.now(),
		});
	},

	// Cancel order
	async cancel(id: string, reason?: string): Promise<void> {
		const docRef = doc(db, ORDERS_COLLECTION, id);
		await updateDoc(docRef, {
			status: "cancelled",
			adminNotes: reason || "Order cancelled",
			updatedAt: Timestamp.now(),
		});
	},
};

// Customer Services
export const customerService = {
	// Get all customers
	async getAll(isActive?: boolean): Promise<Customer[]> {
		const constraints: QueryConstraint[] = [];

		if (isActive !== undefined) {
			constraints.push(where("isActive", "==", isActive));
		}

		constraints.push(orderBy("createdAt", "desc"));

		const q = query(collection(db, CUSTOMERS_COLLECTION), ...constraints);
		const snapshot = await getDocs(q);

		return snapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
			createdAt: doc.data().createdAt?.toDate(),
			updatedAt: doc.data().updatedAt?.toDate(),
		})) as Customer[];
	},

	// Get customer by ID
	async getById(id: string): Promise<Customer | null> {
		const docRef = doc(db, CUSTOMERS_COLLECTION, id);
		const docSnap = await getDoc(docRef);

		if (!docSnap.exists()) return null;

		return {
			id: docSnap.id,
			...docSnap.data(),
			createdAt: docSnap.data().createdAt?.toDate(),
			updatedAt: docSnap.data().updatedAt?.toDate(),
		} as Customer;
	},

	// Create customer
	async create(
		data: Omit<Customer, "id" | "createdAt" | "updatedAt">
	): Promise<string> {
		const docRef = await addDoc(collection(db, CUSTOMERS_COLLECTION), {
			...data,
			totalOrders: 0,
			totalSpent: 0,
			averageOrderValue: 0,
			createdAt: Timestamp.now(),
			updatedAt: Timestamp.now(),
		});
		return docRef.id;
	},

	// Update customer
	async update(id: string, data: Partial<Customer>): Promise<void> {
		const docRef = doc(db, CUSTOMERS_COLLECTION, id);
		await updateDoc(docRef, {
			...data,
			updatedAt: Timestamp.now(),
		});
	},

	// Delete customer
	async delete(id: string): Promise<void> {
		const docRef = doc(db, CUSTOMERS_COLLECTION, id);
		await deleteDoc(docRef);
	},

	// Get customer orders
	async getOrders(customerId: string): Promise<Order[]> {
		return orderService.getAll({ customerId });
	},

	// Update FCM token for push notifications
	async updateFcmToken(id: string, fcmToken: string): Promise<void> {
		const docRef = doc(db, CUSTOMERS_COLLECTION, id);
		await updateDoc(docRef, {
			fcmToken,
			updatedAt: Timestamp.now(),
		});
	},
};

// Payment Services
export const paymentService = {
	// Get all payments
	async getAll(filters?: {
		orderId?: string;
		customerId?: string;
		status?: string;
	}): Promise<Payment[]> {
		const constraints: QueryConstraint[] = [];

		if (filters?.orderId) {
			constraints.push(where("orderId", "==", filters.orderId));
		}
		if (filters?.customerId) {
			constraints.push(where("customerId", "==", filters.customerId));
		}
		if (filters?.status) {
			constraints.push(where("status", "==", filters.status));
		}

		constraints.push(orderBy("createdAt", "desc"));

		const q = query(collection(db, PAYMENTS_COLLECTION), ...constraints);
		const snapshot = await getDocs(q);

		return snapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
			createdAt: doc.data().createdAt?.toDate(),
			updatedAt: doc.data().updatedAt?.toDate(),
		})) as Payment[];
	},

	// Create payment
	async create(
		data: Omit<Payment, "id" | "createdAt" | "updatedAt">
	): Promise<string> {
		const docRef = await addDoc(collection(db, PAYMENTS_COLLECTION), {
			...data,
			createdAt: Timestamp.now(),
			updatedAt: Timestamp.now(),
		});

		// Update order payment status if paid
		if (data.status === "paid") {
			await orderService.updatePaymentStatus(data.orderId, "paid");
		}

		return docRef.id;
	},

	// Update payment status
	async updateStatus(id: string, status: Payment["status"]): Promise<void> {
		const docRef = doc(db, PAYMENTS_COLLECTION, id);
		await updateDoc(docRef, {
			status,
			updatedAt: Timestamp.now(),
		});
	},
};

// Refund Services
export const refundService = {
	// Get all refunds
	async getAll(filters?: {
		orderId?: string;
		customerId?: string;
		status?: string;
	}): Promise<Refund[]> {
		const constraints: QueryConstraint[] = [];

		if (filters?.orderId) {
			constraints.push(where("orderId", "==", filters.orderId));
		}
		if (filters?.customerId) {
			constraints.push(where("customerId", "==", filters.customerId));
		}
		if (filters?.status) {
			constraints.push(where("status", "==", filters.status));
		}

		constraints.push(orderBy("createdAt", "desc"));

		const q = query(collection(db, REFUNDS_COLLECTION), ...constraints);
		const snapshot = await getDocs(q);

		return snapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
			createdAt: doc.data().createdAt?.toDate(),
			updatedAt: doc.data().updatedAt?.toDate(),
		})) as Refund[];
	},

	// Create refund request
	async create(
		data: Omit<Refund, "id" | "createdAt" | "updatedAt">
	): Promise<string> {
		const docRef = await addDoc(collection(db, REFUNDS_COLLECTION), {
			...data,
			status: "pending",
			createdAt: Timestamp.now(),
			updatedAt: Timestamp.now(),
		});
		return docRef.id;
	},

	// Approve refund
	async approve(id: string, processedBy: string): Promise<void> {
		const docRef = doc(db, REFUNDS_COLLECTION, id);
		await updateDoc(docRef, {
			status: "approved",
			processedBy,
			updatedAt: Timestamp.now(),
		});

		// Get refund details to update order and payment
		const refundSnap = await getDoc(docRef);
		if (refundSnap.exists()) {
			const refund = refundSnap.data();

			// Update order status
			await orderService.updateStatus(refund.orderId, "refunded");
			await orderService.updatePaymentStatus(refund.orderId, "refunded");
		}
	},

	// Reject refund
	async reject(id: string, processedBy: string, notes?: string): Promise<void> {
		const docRef = doc(db, REFUNDS_COLLECTION, id);
		await updateDoc(docRef, {
			status: "rejected",
			processedBy,
			notes,
			updatedAt: Timestamp.now(),
		});
	},

	// Complete refund
	async complete(id: string): Promise<void> {
		const docRef = doc(db, REFUNDS_COLLECTION, id);
		await updateDoc(docRef, {
			status: "completed",
			updatedAt: Timestamp.now(),
		});
	},
};
