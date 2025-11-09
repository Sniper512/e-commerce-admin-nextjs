"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, CreditCard, CheckCircle2, XCircle, Power } from "lucide-react";
import paymentMethodService from "@/services/paymentMethodService";
import type { PaymentMethod } from "@/types";
import Image from "next/image";
import { LinkButton } from "@/components/ui/link-button";
import { useState } from "react";

interface PaymentMethodsListProps {
  paymentMethods: PaymentMethod[];
}

export function PaymentMethodsList({
  paymentMethods,
}: PaymentMethodsListProps) {
  const router = useRouter();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggleActive = async (
    id: string,
    currentStatus: boolean,
    methodType: string
  ) => {
    const action = currentStatus ? "deactivate" : "activate";
    const typeName = methodType.replace("_", " ");

    const confirmed = window.confirm(
      `Are you sure you want to ${action} the ${typeName} payment method?`
    );

    if (!confirmed) return;

    setTogglingId(id);
    try {
      await paymentMethodService.toggleActiveStatus(id);
      router.refresh();
    } catch (error: any) {
      console.error("Error toggling payment method status:", error);
      alert(
        error.message ||
          "Failed to update payment method status. Please try again."
      );
    } finally {
      setTogglingId(null);
    }
  };

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case "easypaisa":
        return (
          <Image
            src="/images/payment-methods/easypaisa.png"
            alt="Easypaisa"
            width={24}
            height={24}
          />
        );
      case "jazzcash":
        return (
          <Image
            src="/images/payment-methods/jazzcash.png"
            alt="JazzCash"
            width={24}
            height={24}
          />
        );
      case "bank_transfer":
        return (
          <Image
            src="/images/payment-methods/bank.png"
            alt="Bank Transfer"
            width={24}
            height={24}
          />
        );
      case "cash_on_delivery":
        return (
          <Image
            src="/images/payment-methods/cod.png"
            alt="Cash on Delivery"
            width={24}
            height={24}
          />
        );
      default:
        return "";
    }
  };

  // Calculate stats
  const totalMethods = paymentMethods.length;
  const activeMethods = paymentMethods.filter((m) => m.isActive).length;
  const inactiveMethods = totalMethods - activeMethods;

  return (
    <>
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Methods</p>
                <p className="text-2xl font-bold">{totalMethods}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold">{activeMethods}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactive</p>
                <p className="text-2xl font-bold">{inactiveMethods}</p>
              </div>
              <XCircle className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Account Number</TableHead>
                <TableHead>Account Title</TableHead>
                <TableHead>Bank Name</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentMethods.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-gray-500">
                    No payment methods yet. Add your first payment method!
                  </TableCell>
                </TableRow>
              ) : (
                paymentMethods.map((method) => (
                  <TableRow key={method.id}>
                    <TableCell className="font-medium">
                      {method.displayOrder}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="text-xl">
                          {getPaymentMethodIcon(method.type)}
                        </span>
                        <span className="font-medium capitalize">
                          {method.type.replaceAll("_", " ")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {method.accountDetails?.accountNumber || (
                        <Badge variant="secondary" className="text-gray-400">
                          —
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {method.accountDetails?.accountTitle || (
                        <Badge variant="secondary" className="text-gray-400">
                          —
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="uppercase">
                      {method.accountDetails?.bankName ? (
                        method.accountDetails?.bankName
                      ) : method.type !== "cash_on_delivery" ? (
                        method.type.replaceAll("_", " ")
                      ) : (
                        <Badge variant="secondary" className="text-gray-400">
                          —
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={method.isActive ? "success" : "secondary"}>
                        {method.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        <Button
                          variant={"outline"}
                          size="sm"
                          title={
                            method.isActive
                              ? "Deactivate Payment Method"
                              : "Activate Payment Method"
                          }
                          className={
                            method.isActive
                              ? "text-green-800 border-green-800 bg-green-200"
                              : "text-gray-800 border-gray-800 bg-gray-200"
                          }
                          onClick={() =>
                            handleToggleActive(
                              method.id,
                              method.isActive,
                              method.type
                            )
                          }
                          disabled={togglingId === method.id}>
                          <Power
                            className={`h-3 w-3 ${
                              togglingId === method.id ? "animate-pulse" : ""
                            }`}
                          />
                        </Button>
                        <LinkButton
                          variant="outline"
                          size="sm"
                          title="Edit Payment Method"
                          href={`/dashboard/payments/methods/${method.id}`}>
                          <Edit className="h-3 w-3" />
                        </LinkButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
