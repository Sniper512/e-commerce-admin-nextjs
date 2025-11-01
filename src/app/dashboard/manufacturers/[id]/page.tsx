import manufacturerService from "@/services/manufacturerService";
import { notFound } from "next/navigation";
import { ManufacturerEditForm } from "@/components/features/manufacturers/manufacturer-edit-form";

interface ManufacturerDetailPageProps {
  params: {
    id: string;
  };
}

export default async function ManufacturerDetailPage({
  params,
}: ManufacturerDetailPageProps) {
  const { id } = await params;

  // Fetch manufacturer data on the server
  const manufacturer = await manufacturerService.getManufacturerById(id);

  // If manufacturer not found, show 404
  if (!manufacturer) {
    notFound();
  }

  // Serialize data for client component
  const serializedManufacturer = JSON.parse(JSON.stringify(manufacturer));

  return <ManufacturerEditForm manufacturer={serializedManufacturer} />;
}
