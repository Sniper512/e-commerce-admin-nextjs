// Force dynamic rendering to avoid build-time Firestore calls
export const dynamic = 'force-dynamic';

import { BatchForm } from "@/components/features/batches/batch-form";

export default async function AddBatchPage() {
  return <BatchForm />;
}
