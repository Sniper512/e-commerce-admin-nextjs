import { notFound } from "next/navigation";
import paymentMethodService from "@/services/paymentMethodService";
import { PaymentMethodForm } from "@/components/features/payments/payment-method-form";

interface PaymentMethodDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PaymentMethodDetailPage({
  params,
}: PaymentMethodDetailPageProps) {
  const { id } = await params;

  // Fetch payment method data on the server
  const paymentMethod = await paymentMethodService.getPaymentMethodById(id);

  if (!paymentMethod) {
    notFound();
  }

  // Serialize data for client component
  const serializedPaymentMethod = JSON.parse(JSON.stringify(paymentMethod));

  return (
    <PaymentMethodForm
      paymentMethod={serializedPaymentMethod}
      isEditMode={true}
    />
  );
}
