// Force dynamic rendering to avoid build-time Firestore calls
export const dynamic = 'force-dynamic';

import categoryService from "@/services/categoryService";
import { CategoryAddForm } from "@/components/features/categories/category-add-form";

export default async function AddCategoryPage() {
  // Fetch data on the server
  const categories = await categoryService.getAllCategories();

  // Serialize data for client component
  const serializedCategories = JSON.parse(JSON.stringify(categories));

  return <CategoryAddForm categories={serializedCategories} />;
}
