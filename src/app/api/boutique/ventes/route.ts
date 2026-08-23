import { NextRequest, NextResponse } from "next/server";
import { listOrdersByEmail, listRecentSales } from "@/lib/boutique-data";

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email")?.trim() ?? "";

  if (email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email invalide." }, { status: 400 });
    }
    const orders = await listOrdersByEmail(email);
    return NextResponse.json({ orders });
  }

  const sales = await listRecentSales(12);
  return NextResponse.json({ orders: sales });
}
