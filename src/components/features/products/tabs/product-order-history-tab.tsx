'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { PurchaseOrderHistory } from '@/types';

interface ProductOrderHistoryTabProps {
    purchaseHistory: PurchaseOrderHistory[];
}

export function ProductOrderHistoryTab({ purchaseHistory }: ProductOrderHistoryTabProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Purchased with Orders</CardTitle>
                <p className="text-sm text-gray-600">
                    Here you can see a list of orders in which this product was purchased.
                </p>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="table-header">Order ID</th>
                                <th className="table-header">Date</th>
                                <th className="table-header">Customer</th>
                                <th className="table-header">Quantity</th>
                                <th className="table-header">Unit Price</th>
                                <th className="table-header">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchaseHistory && purchaseHistory.length > 0 ? (
                                purchaseHistory.map((order, index) => (
                                    <tr key={index} className="border-b">
                                        <td className="table-cell">{order.orderId}</td>
                                        <td className="table-cell">
                                            {new Date(order.orderDate).toLocaleDateString()}
                                        </td>
                                        <td className="table-cell">{order.customerName}</td>
                                        <td className="table-cell">{order.quantity}</td>
                                        <td className="table-cell">${order.unitPrice.toFixed(2)}</td>
                                        <td className="table-cell">${order.totalAmount.toFixed(2)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td className="table-cell" colSpan={6}>
                                        <div className="text-center py-8 text-gray-500">
                                            No purchase history available
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
