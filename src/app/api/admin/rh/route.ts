import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  createEmployee,
  listEmployees,
  EMPLOYEE_DEPARTMENTS,
  EMPLOYEE_STATUSES,
} from "@/lib/rh";
import type { EmployeeDepartment, EmployeeStatus } from "@/lib/types";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const employees = await listEmployees({
    q: searchParams.get("q") ?? undefined,
    department: searchParams.get("department") ?? undefined,
    status: (searchParams.get("status") ?? "all") as EmployeeStatus | "all",
  });

  return NextResponse.json({ employees });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    department?: string;
    jobTitle?: string;
    status?: string;
    hireDate?: string;
    address?: string;
    emergencyContact?: string;
    notes?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const firstName = body.firstName?.trim() ?? "";
  const lastName = body.lastName?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const jobTitle = body.jobTitle?.trim() ?? "";
  const hireDate = body.hireDate?.trim() ?? "";
  const department = body.department as EmployeeDepartment;

  if (firstName.length < 2 || lastName.length < 2) {
    return NextResponse.json({ error: "Nom et prénom requis" }, { status: 400 });
  }
  if (!email.includes("@")) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }
  if (!jobTitle || !hireDate) {
    return NextResponse.json(
      { error: "Poste et date d’embauche requis" },
      { status: 400 },
    );
  }
  if (!EMPLOYEE_DEPARTMENTS.includes(department)) {
    return NextResponse.json({ error: "Département invalide" }, { status: 400 });
  }

  const status = (body.status ?? "actif") as EmployeeStatus;
  if (!EMPLOYEE_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  const employee = await createEmployee({
    firstName,
    lastName,
    email,
    phone: body.phone,
    department,
    jobTitle,
    status,
    hireDate,
    address: body.address,
    emergencyContact: body.emergencyContact,
    notes: body.notes,
  });

  if (!employee) {
    return NextResponse.json(
      { error: "Impossible de créer le dossier (MongoDB ?)" },
      { status: 503 },
    );
  }

  return NextResponse.json({ employee }, { status: 201 });
}
