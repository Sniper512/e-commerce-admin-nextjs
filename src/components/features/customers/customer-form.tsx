"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import customerService from "@/services/customerService";
import { useToast } from "@/components/ui/toast-context";
import type { Customer } from "@/types";

interface CustomerAddFormProps {
  customer?: Customer;
  isEditMode?: boolean;
}

export function CustomerForm({
  customer,
  isEditMode = false,
}: CustomerAddFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: customer?.name || "",
    phone: customer?.phone || "",
    address: customer?.address || "",
    notificationsEnabled: customer?.notificationsEnabled ?? true,
    isActive: customer?.isActive ?? true,
  });

  // Update form data if customer prop changes
  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || "",
        phone: customer.phone || "",
        address: customer.address || "",
        notificationsEnabled: customer.notificationsEnabled ?? true,
        isActive: customer.isActive ?? true,
      });
    }
  }, [customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError("Customer name is required");
      return;
    }

    if (!formData.phone.trim()) {
      setError("Phone number is required");
      return;
    }

    // Basic phone validation
    const phoneRegex = /^[\d\s\-+()]+$/;
    if (!phoneRegex.test(formData.phone)) {
      setError("Please enter a valid phone number");
      return;
    }

    setLoading(true);

    try {
      if (isEditMode && customer) {
        // Update existing customer
        await customerService.updateCustomer(customer.id, formData);
        showToast("success", "Customer updated successfully!");
      } else {
        // Create new customer
        await customerService.createCustomer(formData);
        showToast("success", "Customer created successfully!");
      }
      router.push("/dashboard/customers");
      router.refresh();
    } catch (error: any) {
      console.error(
        `Error ${isEditMode ? "updating" : "creating"} customer:`,
        error
      );
      setError(
        error.message ||
          `Failed to ${
            isEditMode ? "update" : "create"
          } customer. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {isEditMode ? "Edit Customer" : "Add New Customer"}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEditMode
            ? "Update customer information"
            : "Create a new customer record for your store"}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
              {/* Customer Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter customer name"
                  required
                  disabled={loading}
                />
              </div>

              {/* Phone Number */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter phone number"
                  required
                  disabled={loading}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Customer's contact phone number
                </p>
              </div>

              {/* Address */}
              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 mb-2">
                  Address (Optional)
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Enter customer address"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Right Column - Settings */}
          <div className="space-y-6">
            {/* Customer Stats (only in edit mode) */}
            {isEditMode && customer && (
              <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Customer Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Orders:</span>
                    <span className="text-sm font-semibold">
                      {customer.totalOrders}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Spent:</span>
                    <span className="text-sm font-semibold">
                      Rs. {customer.totalSpent.toLocaleString()}
                    </span>
                  </div>
                  {customer.totalOrders > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Avg Order Value:
                      </span>
                      <span className="text-sm font-semibold">
                        Rs.{" "}
                        {Math.round(
                          customer.totalSpent / customer.totalOrders
                        ).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Customer Settings
              </h3>

              {/* Notifications Enabled */}
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="notificationsEnabled"
                  name="notificationsEnabled"
                  checked={formData.notificationsEnabled}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 mt-0.5"
                  disabled={loading}
                />
                <label
                  htmlFor="notificationsEnabled"
                  className="ml-3 text-sm text-gray-700">
                  Enable notifications for this customer
                </label>
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
                  Active customer
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {loading
              ? isEditMode
                ? "Updating..."
                : "Creating..."
              : isEditMode
              ? "Update Customer"
              : "Create Customer"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            disabled={loading}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
