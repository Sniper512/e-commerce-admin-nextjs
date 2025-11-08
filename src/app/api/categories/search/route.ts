import { NextRequest, NextResponse } from "next/server";
import categoryService from "@/services/categoryService";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query || query.trim().length < 2) {
      return NextResponse.json([]);
    }

    const results = await categoryService.searchCategoriesAndSubCategories(
      query
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error searching categories:", error);
    return NextResponse.json(
      { error: "Failed to search categories" },
      { status: 500 }
    );
  }
}
