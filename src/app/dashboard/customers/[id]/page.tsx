// Force dynamic rendering to avoid build-time Firestore calls
export const dynamic = 'force-dynamic';

import { notFound } from "next/navigation";
import customerService from "@/services/customerService";
import { CustomerForm } from "@/components/features/customers/customer-form";

interface CustomerDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  const { id } = await params;

  // Fetch customer data on the server
  const customer = await customerService.getCustomerById(id);

  if (!customer) {
    notFound();
  }

  // Serialize data for client component
  const serializedCustomer = JSON.parse(JSON.stringify(customer));

  return <CustomerForm customer={serializedCustomer} isEditMode={true} />;
}
