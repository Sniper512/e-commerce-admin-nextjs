"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import paymentMethodService from "@/services/paymentMethodService";
import type { PaymentMethod, PaymentMethodType } from "@/types";

interface PaymentMethodFormProps {
  paymentMethod?: PaymentMethod;
  isEditMode?: boolean;
}

export function PaymentMethodForm({
  paymentMethod,
  isEditMode = false,
}: PaymentMethodFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    type: paymentMethod?.type || ("cash_on_delivery" as PaymentMethodType),
    displayOrder: paymentMethod?.displayOrder || 1,
    isActive: paymentMethod?.isActive ?? true,
    accountNumber: paymentMethod?.accountDetails?.accountNumber || "",
    accountTitle: paymentMethod?.accountDetails?.accountTitle || "",
    bankName: paymentMethod?.accountDetails?.bankName || "",
  });

  // Update form data if payment method prop changes
  useEffect(() => {
    if (paymentMethod) {
      setFormData({
        type: paymentMethod.type || "cash_on_delivery",
        displayOrder: paymentMethod.displayOrder || 1,
        isActive: paymentMethod.isActive ?? true,
        accountNumber: paymentMethod.accountDetails?.accountNumber || "",
        accountTitle: paymentMethod.accountDetails?.accountTitle || "",
        bankName: paymentMethod.accountDetails?.bankName || "",
      });
    }
  }, [paymentMethod]);

  const needsAccountDetails = (type: PaymentMethodType) => {
    return ["easypaisa", "jazzcash", "bank_transfer"].includes(type);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (needsAccountDetails(formData.type)) {
      if (!formData.accountNumber.trim()) {
        setError("Account number is required for this payment method");
        return;
      }

      // Account Title is required for all online payment methods
      if (!formData.accountTitle.trim()) {
        setError("Account title is required for this payment method");
        return;
      }

      // Bank Name is required only for Bank Transfer
      if (formData.type === "bank_transfer" && !formData.bankName.trim()) {
        setError("Bank name is required for Bank Transfer payment method");
        return;
      }
    }

    setLoading(true);

    try {
      if (isEditMode && paymentMethod) {
        // Update existing payment method (exclude type)
        const updateData: Partial<PaymentMethod> = {
          displayOrder: formData.displayOrder,
          isActive: formData.isActive,
        };

        // Add account details if applicable
        if (needsAccountDetails(formData.type)) {
          updateData.accountDetails = {
            accountNumber: formData.accountNumber,
            accountTitle: formData.accountTitle,
            bankName: formData.bankName,
          };
        }

        await paymentMethodService.updatePaymentMethod(
          paymentMethod.id,
          updateData
        );
        alert("Payment method updated successfully!");
      } else {
        // Create new payment method (include type)
        const createData: Partial<PaymentMethod> = {
          type: formData.type,
          displayOrder: formData.displayOrder,
          isActive: formData.isActive,
        };

        // Add account details if applicable
        if (needsAccountDetails(formData.type)) {
          createData.accountDetails = {
            accountNumber: formData.accountNumber,
            accountTitle: formData.accountTitle,
            bankName: formData.bankName,
          };
        }

        await paymentMethodService.createPaymentMethod(createData);
        alert("Payment method created successfully!");
      }
      router.push("/dashboard/payments/methods");
      router.refresh();
    } catch (error: any) {
      setError(
        error.message ||
          `Failed to ${
            isEditMode ? "update" : "create"
          } payment method. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else if (type === "number") {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? "" : parseInt(value, 10),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/payments/methods">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              {isEditMode ? "Edit Payment Method" : "Add New Payment Method"}
            </h1>
            <p className="text-gray-500 mt-1">
              {isEditMode
                ? "Update payment method information"
                : "Create a new payment method for customers"}
            </p>
          </div>
        </div>
        <Button type="submit" form="payment-method-form" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {isEditMode ? "Update" : "Save"}
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <form id="payment-method-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Method Type */}
                <div className="space-y-2">
                  <Label htmlFor="type">
                    Method Type <span className="text-red-500">*</span>
                  </Label>
                  {isEditMode ? (
                    <Input
                      type="text"
                      id="type"
                      value={formData.type
                        .replace("_", " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                      disabled
                      className="bg-gray-100 cursor-not-allowed"
                    />
                  ) : (
                    <Select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      required
                      disabled={loading}>
                      <option value="cash_on_delivery">Cash on Delivery</option>
                      <option value="easypaisa">Easypaisa</option>
                      <option value="jazzcash">JazzCash</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </Select>
                  )}
                  <p className="text-sm text-gray-500">
                    {isEditMode
                      ? "Method type cannot be changed after creation"
                      : "Select the type of payment method"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Account Details Section - Only for online payments */}
            {needsAccountDetails(formData.type) && (
              <Card>
                <CardHeader>
                  <CardTitle>Account Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Account Number */}
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">
                      Account Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="accountNumber"
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleChange}
                      placeholder="Enter account number"
                      disabled={loading}
                    />
                  </div>

                  {/* Account Title */}
                  <div className="space-y-2">
                    <Label htmlFor="accountTitle">
                      Account Title
                      <span className="text-red-500"> *</span>
                    </Label>
                    <Input
                      type="text"
                      id="accountTitle"
                      name="accountTitle"
                      value={formData.accountTitle}
                      onChange={handleChange}
                      placeholder="Enter account title"
                      disabled={loading}
                    />
                    <p className="text-sm text-gray-500">
                      Account title is required for all online payment methods
                    </p>
                  </div>

                  {/* Bank Name - Only for bank transfer */}
                  {formData.type === "bank_transfer" && (
                    <div className="space-y-2">
                      <Label htmlFor="bankName">
                        Bank Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="text"
                        id="bankName"
                        name="bankName"
                        value={formData.bankName}
                        onChange={handleChange}
                        placeholder="Enter bank name"
                        disabled={loading}
                      />
                      <p className="text-sm text-gray-500">
                        Bank name is required for Bank Transfer
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Settings */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Display Order */}
                <div className="space-y-2">
                  <Label htmlFor="displayOrder">Display Order</Label>
                  <Input
                    type="number"
                    id="displayOrder"
                    name="displayOrder"
                    value={formData.displayOrder}
                    onChange={handleChange}
                    min="1"
                    disabled={loading}
                  />
                  <p className="text-sm text-gray-500">
                    Order in which this method appears
                  </p>
                </div>

                {/* Is Active */}
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 mt-0.5"
                    disabled={loading}
                  />
                  <label
                    htmlFor="isActive"
                    className="ml-3 text-sm text-gray-700">
                    Active payment method
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
