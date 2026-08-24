import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  addHrDocument,
  createContract,
  createLeave,
  getEmployeeDetail,
  recordAttendance,
  updateEmployee,
  updateLeaveStatus,
  ATTENDANCE_STATUSES,
  CONTRACT_TYPES,
  HR_DOC_CATEGORIES,
  LEAVE_STATUSES,
  LEAVE_TYPES,
  EMPLOYEE_DEPARTMENTS,
  EMPLOYEE_STATUSES,
} from "@/lib/rh";
import type {
  AttendanceStatus,
  ContractType,
  EmployeeDepartment,
  EmployeeStatus,
  HrDocCategory,
  LeaveStatus,
  LeaveType,
} from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  const detail = await getEmployeeDetail(id);
  if (!detail) {
    return NextResponse.json({ error: "Employé introuvable" }, { status: 404 });
  }
  return NextResponse.json(detail);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const action = typeof body.action === "string" ? body.action : "profile";

  try {
    if (action === "profile") {
      const department = body.department as EmployeeDepartment | undefined;
      const status = body.status as EmployeeStatus | undefined;
      if (department && !EMPLOYEE_DEPARTMENTS.includes(department)) {
        return NextResponse.json({ error: "Département invalide" }, { status: 400 });
      }
      if (status && !EMPLOYEE_STATUSES.includes(status)) {
        return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
      }

      const employee = await updateEmployee(id, {
        firstName: typeof body.firstName === "string" ? body.firstName : undefined,
        lastName: typeof body.lastName === "string" ? body.lastName : undefined,
        email: typeof body.email === "string" ? body.email : undefined,
        phone: typeof body.phone === "string" ? body.phone : undefined,
        department,
        jobTitle: typeof body.jobTitle === "string" ? body.jobTitle : undefined,
        status,
        hireDate: typeof body.hireDate === "string" ? body.hireDate : undefined,
        endDate: typeof body.endDate === "string" ? body.endDate : undefined,
        address: typeof body.address === "string" ? body.address : undefined,
        emergencyContact:
          typeof body.emergencyContact === "string"
            ? body.emergencyContact
            : undefined,
        notes: typeof body.notes === "string" ? body.notes : undefined,
      });
      if (!employee) {
        return NextResponse.json({ error: "Employé introuvable" }, { status: 404 });
      }
    }

    if (action === "contract") {
      const type = body.type as ContractType;
      if (!CONTRACT_TYPES.includes(type)) {
        return NextResponse.json({ error: "Type de contrat invalide" }, { status: 400 });
      }
      const contract = await createContract({
        employeeId: id,
        type,
        title: String(body.title ?? ""),
        startDate: String(body.startDate ?? ""),
        endDate: typeof body.endDate === "string" ? body.endDate : undefined,
        salaryGross:
          typeof body.salaryGross === "number"
            ? body.salaryGross
            : Number(body.salaryGross) || undefined,
        notes: typeof body.notes === "string" ? body.notes : undefined,
      });
      if (!contract) {
        return NextResponse.json({ error: "Création contrat impossible" }, { status: 400 });
      }
    }

    if (action === "attendance") {
      const status = body.status as AttendanceStatus;
      if (!ATTENDANCE_STATUSES.includes(status)) {
        return NextResponse.json({ error: "Statut présence invalide" }, { status: 400 });
      }
      const attendance = await recordAttendance({
        employeeId: id,
        date: String(body.date ?? ""),
        status,
        checkIn: typeof body.checkIn === "string" ? body.checkIn : undefined,
        checkOut: typeof body.checkOut === "string" ? body.checkOut : undefined,
        note: typeof body.note === "string" ? body.note : undefined,
      });
      if (!attendance) {
        return NextResponse.json({ error: "Présence non enregistrée" }, { status: 400 });
      }
    }

    if (action === "leave") {
      const type = body.type as LeaveType;
      if (!LEAVE_TYPES.includes(type)) {
        return NextResponse.json({ error: "Type de congé invalide" }, { status: 400 });
      }
      const leave = await createLeave({
        employeeId: id,
        type,
        startDate: String(body.startDate ?? ""),
        endDate: String(body.endDate ?? ""),
        reason: typeof body.reason === "string" ? body.reason : undefined,
      });
      if (!leave) {
        return NextResponse.json({ error: "Congé non créé" }, { status: 400 });
      }
    }

    if (action === "leave_status") {
      const leaveId = String(body.leaveId ?? "");
      const status = body.status as LeaveStatus;
      if (!LEAVE_STATUSES.includes(status)) {
        return NextResponse.json({ error: "Statut congé invalide" }, { status: 400 });
      }
      const leave = await updateLeaveStatus(leaveId, status);
      if (!leave) {
        return NextResponse.json({ error: "Congé introuvable" }, { status: 404 });
      }
    }

    if (action === "document") {
      const category = body.category as HrDocCategory;
      if (!HR_DOC_CATEGORIES.includes(category)) {
        return NextResponse.json({ error: "Catégorie document invalide" }, { status: 400 });
      }
      const document = await addHrDocument({
        employeeId: id,
        category,
        title: String(body.title ?? ""),
        fileName: String(body.fileName ?? "document"),
        fileUrl: String(body.fileUrl ?? ""),
        mimeType: typeof body.mimeType === "string" ? body.mimeType : undefined,
        notes: typeof body.notes === "string" ? body.notes : undefined,
      });
      if (!document) {
        return NextResponse.json({ error: "Document non enregistré" }, { status: 400 });
      }
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur" },
      { status: 400 },
    );
  }

  const detail = await getEmployeeDetail(id);
  return NextResponse.json(detail);
}
