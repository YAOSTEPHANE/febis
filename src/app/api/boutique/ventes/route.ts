import { NextRequest, NextResponse } from "next/server";
import { listOrdersByEmail } from "@/lib/boutique-data";

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email")?.trim() ?? "";

  if (!email) {
    return NextResponse.json(
      { error: "Email requis pour consulter l’historique." },
      { status: 400 },
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email invalide." }, { status: 400 });
  }

  const orders = await listOrdersByEmail(email);
  return NextResponse.json({ orders });
}
