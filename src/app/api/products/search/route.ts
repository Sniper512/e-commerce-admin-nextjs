import { NextRequest, NextResponse } from "next/server";
import { productService } from "@/services/productService";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const searchQuery = searchParams.get("q");

    if (!searchQuery || searchQuery.length < 2) {
      return NextResponse.json([]);
    }

    // Use the same search logic as the products list page
    const products = await productService.searchProducts(searchQuery, 20);

    // Format the results for the dropdown
    const results = products.map((product) => ({
      id: product.id,
      name: product.info.name,
      image: product.multimedia?.images?.[0] || "/images/default-image.svg",
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error searching products:", error);
    return NextResponse.json(
      { error: "Failed to search products" },
      { status: 500 }
    );
  }
}