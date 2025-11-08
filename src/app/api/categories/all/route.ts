import { NextResponse } from "next/server";
import categoryService from "@/services/categoryService";

export async function GET() {
  try {
    const categories =
      await categoryService.getAllCategoriesWithSubCategories();
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching all categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
