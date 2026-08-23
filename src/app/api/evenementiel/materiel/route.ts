import { NextResponse } from "next/server";
import { listPublicEquipment } from "@/lib/evenementiel-data";

export async function GET() {
  const equipment = await listPublicEquipment();
  return NextResponse.json({ equipment });
}
