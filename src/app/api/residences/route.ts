import { NextResponse } from "next/server";
import { listPublicLodgings } from "@/lib/residences-data";

export async function GET() {
  const lodgings = await listPublicLodgings();
  return NextResponse.json({ lodgings });
}
