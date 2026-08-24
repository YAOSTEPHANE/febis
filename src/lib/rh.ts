import "server-only";
import { ObjectId, type Db, type Filter } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type {
  AttendanceDoc,
  AttendanceStatus,
  ContractStatus,
  ContractType,
  EmployeeDepartment,
  EmployeeDoc,
  EmployeeStatus,
  EmploymentContractDoc,
  HrDocCategory,
  HrDocumentDoc,
  LeaveDoc,
  LeaveStatus,
  LeaveType,
} from "@/lib/types";
import type {
  SerializedAttendance,
  SerializedContract,
  SerializedEmployee,
  SerializedHrDocument,
  SerializedLeave,
  RhOverview,
} from "@/lib/rh-shared";
import {
  ATTENDANCE_STATUSES,
  CONTRACT_STATUSES,
  CONTRACT_TYPES,
  EMPLOYEE_DEPARTMENTS,
  EMPLOYEE_STATUSES,
  HR_DOC_CATEGORIES,
  LEAVE_STATUSES,
  LEAVE_TYPES,
} from "@/lib/rh-shared";

export {
  ATTENDANCE_STATUSES,
  CONTRACT_STATUSES,
  CONTRACT_TYPES,
  EMPLOYEE_DEPARTMENTS,
  EMPLOYEE_STATUSES,
  HR_DOC_CATEGORIES,
  LEAVE_STATUSES,
  LEAVE_TYPES,
  attendanceStatusLabel,
  contractStatusLabel,
  contractTypeLabel,
  departmentLabel,
  employeeStatusLabel,
  hrDocCategoryLabel,
  leaveStatusLabel,
  leaveTypeLabel,
} from "@/lib/rh-shared";

export type {
  SerializedAttendance,
  SerializedContract,
  SerializedEmployee,
  SerializedHrDocument,
  SerializedLeave,
  RhOverview,
} from "@/lib/rh-shared";


async function tryDb(): Promise<Db | null> {
  try {
    return await getDb();
  } catch {
    return null;
  }
}

function toIso(value: Date | string | undefined | null) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function serializeEmployee(doc: EmployeeDoc & { _id: ObjectId }): SerializedEmployee {
  return {
    id: doc._id.toString(),
    employeeNumber: doc.employeeNumber,
    firstName: doc.firstName,
    lastName: doc.lastName,
    fullName: `${doc.firstName} ${doc.lastName}`.trim(),
    email: doc.email,
    phone: doc.phone ?? "",
    department: doc.department,
    jobTitle: doc.jobTitle,
    status: doc.status,
    hireDate: doc.hireDate,
    endDate: doc.endDate ?? "",
    address: doc.address ?? "",
    emergencyContact: doc.emergencyContact ?? "",
    notes: doc.notes ?? "",
    createdAt: toIso(doc.createdAt) ?? new Date(0).toISOString(),
    updatedAt: toIso(doc.updatedAt) ?? new Date(0).toISOString(),
  };
}

function serializeContract(
  doc: EmploymentContractDoc & { _id: ObjectId },
): SerializedContract {
  return {
    id: doc._id.toString(),
    employeeId: doc.employeeId,
    employeeName: doc.employeeName,
    type: doc.type,
    status: doc.status,
    title: doc.title,
    startDate: doc.startDate,
    endDate: doc.endDate ?? "",
    salaryGross: doc.salaryGross ?? null,
    notes: doc.notes ?? "",
    createdAt: toIso(doc.createdAt) ?? new Date(0).toISOString(),
  };
}

function serializeAttendance(
  doc: AttendanceDoc & { _id: ObjectId },
): SerializedAttendance {
  return {
    id: doc._id.toString(),
    employeeId: doc.employeeId,
    employeeName: doc.employeeName,
    date: doc.date,
    status: doc.status,
    checkIn: doc.checkIn ?? "",
    checkOut: doc.checkOut ?? "",
    note: doc.note ?? "",
  };
}

function serializeLeave(doc: LeaveDoc & { _id: ObjectId }): SerializedLeave {
  return {
    id: doc._id.toString(),
    employeeId: doc.employeeId,
    employeeName: doc.employeeName,
    type: doc.type,
    status: doc.status,
    startDate: doc.startDate,
    endDate: doc.endDate,
    days: doc.days,
    reason: doc.reason ?? "",
    createdAt: toIso(doc.createdAt) ?? new Date(0).toISOString(),
  };
}

function serializeHrDocument(
  doc: HrDocumentDoc & { _id: ObjectId },
): SerializedHrDocument {
  return {
    id: doc._id.toString(),
    employeeId: doc.employeeId,
    employeeName: doc.employeeName,
    category: doc.category,
    title: doc.title,
    fileName: doc.fileName,
    mimeType: doc.mimeType ?? "",
    fileUrl: doc.fileUrl,
    notes: doc.notes ?? "",
    uploadedAt: toIso(doc.uploadedAt) ?? new Date(0).toISOString(),
  };
}

async function nextEmployeeNumber(db: Db) {
  const counters = db.collection<{ _id: string; seq: number }>("counters");
  const result = await counters.findOneAndUpdate(
    { _id: "employees" },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" },
  );
  const seq = result?.seq ?? 1;
  return `EMP-${String(seq).padStart(4, "0")}`;
}

function daysBetween(start: string, end: string) {
  const a = new Date(`${start}T00:00:00`);
  const b = new Date(`${end}T00:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) || b < a) return 1;
  return Math.floor((b.getTime() - a.getTime()) / 86400000) + 1;
}

export async function listEmployees(filters?: {
  q?: string;
  department?: string;
  status?: EmployeeStatus | "all";
}): Promise<SerializedEmployee[]> {
  const db = await tryDb();
  if (!db) return [];

  const query: Filter<EmployeeDoc> = {};
  const q = filters?.q?.trim();
  if (q) {
    const rx = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    query.$or = [
      { firstName: rx },
      { lastName: rx },
      { email: rx },
      { phone: rx },
      { employeeNumber: rx },
      { jobTitle: rx },
    ];
  }
  if (filters?.department && filters.department !== "all") {
    query.department = filters.department as EmployeeDepartment;
  }
  if (filters?.status && filters.status !== "all") {
    query.status = filters.status;
  }

  const rows = await db
    .collection<EmployeeDoc>("employees")
    .find(query)
    .sort({ lastName: 1, firstName: 1 })
    .limit(200)
    .toArray();

  return rows
    .filter((r): r is EmployeeDoc & { _id: ObjectId } => Boolean(r._id))
    .map(serializeEmployee);
}

export async function createEmployee(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department: EmployeeDepartment;
  jobTitle: string;
  status?: EmployeeStatus;
  hireDate: string;
  address?: string;
  emergencyContact?: string;
  notes?: string;
}): Promise<SerializedEmployee | null> {
  const db = await tryDb();
  if (!db) return null;
  if (!EMPLOYEE_DEPARTMENTS.includes(input.department)) return null;

  const now = new Date();
  const doc: EmployeeDoc = {
    employeeNumber: await nextEmployeeNumber(db),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone?.trim() || undefined,
    department: input.department,
    jobTitle: input.jobTitle.trim(),
    status: input.status ?? "actif",
    hireDate: input.hireDate,
    address: input.address?.trim(),
    emergencyContact: input.emergencyContact?.trim(),
    notes: input.notes?.trim(),
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection("employees").insertOne({ ...doc } as never);
  return serializeEmployee({
    ...doc,
    _id: result.insertedId,
  } as EmployeeDoc & { _id: ObjectId });
}

export async function updateEmployee(
  id: string,
  patch: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    department: EmployeeDepartment;
    jobTitle: string;
    status: EmployeeStatus;
    hireDate: string;
    endDate: string;
    address: string;
    emergencyContact: string;
    notes: string;
  }>,
): Promise<SerializedEmployee | null> {
  const db = await tryDb();
  if (!db || !ObjectId.isValid(id)) return null;

  const $set: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.firstName !== undefined) $set.firstName = patch.firstName.trim();
  if (patch.lastName !== undefined) $set.lastName = patch.lastName.trim();
  if (patch.email !== undefined) $set.email = patch.email.trim().toLowerCase();
  if (patch.phone !== undefined) $set.phone = patch.phone.trim();
  if (patch.department !== undefined) {
    if (!EMPLOYEE_DEPARTMENTS.includes(patch.department)) return null;
    $set.department = patch.department;
  }
  if (patch.jobTitle !== undefined) $set.jobTitle = patch.jobTitle.trim();
  if (patch.status !== undefined) {
    if (!EMPLOYEE_STATUSES.includes(patch.status)) return null;
    $set.status = patch.status;
  }
  if (patch.hireDate !== undefined) $set.hireDate = patch.hireDate;
  if (patch.endDate !== undefined) $set.endDate = patch.endDate || null;
  if (patch.address !== undefined) $set.address = patch.address.trim();
  if (patch.emergencyContact !== undefined) {
    $set.emergencyContact = patch.emergencyContact.trim();
  }
  if (patch.notes !== undefined) $set.notes = patch.notes;

  await db.collection("employees").updateOne({ _id: new ObjectId(id) }, { $set });
  const updated = await db
    .collection("employees")
    .findOne({ _id: new ObjectId(id) });
  if (!updated?._id) return null;
  return serializeEmployee(updated as EmployeeDoc & { _id: ObjectId });
}

export async function getEmployeeDetail(id: string) {
  const db = await tryDb();
  if (!db || !ObjectId.isValid(id)) return null;

  const employee = await db
    .collection("employees")
    .findOne({ _id: new ObjectId(id) });
  if (!employee?._id) return null;

  const employeeId = String(employee._id);
  const [contracts, attendances, leaves, documents] = await Promise.all([
    db
      .collection<EmploymentContractDoc>("employmentContracts")
      .find({ employeeId })
      .sort({ startDate: -1 })
      .limit(50)
      .toArray(),
    db
      .collection<AttendanceDoc>("attendances")
      .find({ employeeId })
      .sort({ date: -1 })
      .limit(60)
      .toArray(),
    db
      .collection<LeaveDoc>("leaves")
      .find({ employeeId })
      .sort({ startDate: -1 })
      .limit(50)
      .toArray(),
    db
      .collection<HrDocumentDoc>("hrDocuments")
      .find({ employeeId })
      .sort({ uploadedAt: -1 })
      .limit(50)
      .toArray(),
  ]);

  return {
    employee: serializeEmployee(employee as EmployeeDoc & { _id: ObjectId }),
    contracts: contracts
      .filter((r): r is EmploymentContractDoc & { _id: ObjectId } => Boolean(r._id))
      .map(serializeContract),
    attendances: attendances
      .filter((r): r is AttendanceDoc & { _id: ObjectId } => Boolean(r._id))
      .map(serializeAttendance),
    leaves: leaves
      .filter((r): r is LeaveDoc & { _id: ObjectId } => Boolean(r._id))
      .map(serializeLeave),
    documents: documents
      .filter((r): r is HrDocumentDoc & { _id: ObjectId } => Boolean(r._id))
      .map(serializeHrDocument),
  };
}

async function getEmployeeName(db: Db, employeeId: string) {
  if (!ObjectId.isValid(employeeId)) return null;
  const emp = await db
    .collection("employees")
    .findOne({ _id: new ObjectId(employeeId) });
  if (!emp) return null;
  return {
    id: String(emp._id),
    name: `${emp.firstName} ${emp.lastName}`.trim(),
  };
}

export async function createContract(input: {
  employeeId: string;
  type: ContractType;
  status?: ContractStatus;
  title: string;
  startDate: string;
  endDate?: string;
  salaryGross?: number;
  notes?: string;
}): Promise<SerializedContract | null> {
  const db = await tryDb();
  if (!db) return null;
  if (!CONTRACT_TYPES.includes(input.type)) return null;

  const emp = await getEmployeeName(db, input.employeeId);
  if (!emp) return null;

  const now = new Date();
  const doc: EmploymentContractDoc = {
    employeeId: emp.id,
    employeeName: emp.name,
    type: input.type,
    status: input.status ?? "actif",
    title: input.title.trim(),
    startDate: input.startDate,
    endDate: input.endDate || undefined,
    salaryGross: input.salaryGross,
    currency: "XOF",
    notes: input.notes?.trim(),
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection("employmentContracts").insertOne({ ...doc } as never);
  return serializeContract({
    ...doc,
    _id: result.insertedId,
  } as EmploymentContractDoc & { _id: ObjectId });
}

export async function recordAttendance(input: {
  employeeId: string;
  date: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  note?: string;
}): Promise<SerializedAttendance | null> {
  const db = await tryDb();
  if (!db) return null;
  if (!ATTENDANCE_STATUSES.includes(input.status)) return null;

  const emp = await getEmployeeName(db, input.employeeId);
  if (!emp) return null;

  const now = new Date();
  const existing = await db.collection("attendances").findOne({
    employeeId: emp.id,
    date: input.date,
  });

  if (existing?._id) {
    await db.collection("attendances").updateOne(
      { _id: existing._id },
      {
        $set: {
          status: input.status,
          checkIn: input.checkIn,
          checkOut: input.checkOut,
          note: input.note?.trim(),
          updatedAt: now,
        },
      },
    );
    const updated = await db
      .collection("attendances")
      .findOne({ _id: existing._id });
    return serializeAttendance(updated as AttendanceDoc & { _id: ObjectId });
  }

  const doc: AttendanceDoc = {
    employeeId: emp.id,
    employeeName: emp.name,
    date: input.date,
    status: input.status,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    note: input.note?.trim(),
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection("attendances").insertOne({ ...doc } as never);
  return serializeAttendance({
    ...doc,
    _id: result.insertedId,
  } as AttendanceDoc & { _id: ObjectId });
}

export async function createLeave(input: {
  employeeId: string;
  type: LeaveType;
  status?: LeaveStatus;
  startDate: string;
  endDate: string;
  reason?: string;
}): Promise<SerializedLeave | null> {
  const db = await tryDb();
  if (!db) return null;
  if (!LEAVE_TYPES.includes(input.type)) return null;

  const emp = await getEmployeeName(db, input.employeeId);
  if (!emp) return null;

  const now = new Date();
  const doc: LeaveDoc = {
    employeeId: emp.id,
    employeeName: emp.name,
    type: input.type,
    status: input.status ?? "demande",
    startDate: input.startDate,
    endDate: input.endDate,
    days: daysBetween(input.startDate, input.endDate),
    reason: input.reason?.trim(),
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection("leaves").insertOne({ ...doc } as never);
  return serializeLeave({
    ...doc,
    _id: result.insertedId,
  } as LeaveDoc & { _id: ObjectId });
}

export async function updateLeaveStatus(
  id: string,
  status: LeaveStatus,
): Promise<SerializedLeave | null> {
  const db = await tryDb();
  if (!db || !ObjectId.isValid(id)) return null;
  if (!LEAVE_STATUSES.includes(status)) return null;

  await db.collection("leaves").updateOne(
    { _id: new ObjectId(id) },
    { $set: { status, updatedAt: new Date() } },
  );
  const updated = await db
    .collection("leaves")
    .findOne({ _id: new ObjectId(id) });
  if (!updated?._id) return null;
  return serializeLeave(updated as LeaveDoc & { _id: ObjectId });
}

export async function addHrDocument(input: {
  employeeId: string;
  category: HrDocCategory;
  title: string;
  fileName: string;
  fileUrl: string;
  mimeType?: string;
  notes?: string;
}): Promise<SerializedHrDocument | null> {
  const db = await tryDb();
  if (!db) return null;
  if (!HR_DOC_CATEGORIES.includes(input.category)) return null;

  const emp = await getEmployeeName(db, input.employeeId);
  if (!emp) return null;

  // Limite data URL ~700KB pour éviter de saturer Mongo
  if (input.fileUrl.startsWith("data:") && input.fileUrl.length > 700_000) {
    throw new Error("Fichier trop volumineux (max ~500 Ko en base). Utilisez une URL.");
  }

  const now = new Date();
  const doc: HrDocumentDoc = {
    employeeId: emp.id,
    employeeName: emp.name,
    category: input.category,
    title: input.title.trim(),
    fileName: input.fileName.trim(),
    mimeType: input.mimeType,
    fileUrl: input.fileUrl.trim(),
    notes: input.notes?.trim(),
    uploadedAt: now,
    createdAt: now,
  };

  const result = await db.collection("hrDocuments").insertOne({ ...doc } as never);
  return serializeHrDocument({
    ...doc,
    _id: result.insertedId,
  } as HrDocumentDoc & { _id: ObjectId });
}

export async function updateContractStatus(
  id: string,
  status: ContractStatus,
): Promise<SerializedContract | null> {
  const db = await tryDb();
  if (!db || !ObjectId.isValid(id)) return null;
  if (!CONTRACT_STATUSES.includes(status)) return null;

  await db.collection("employmentContracts").updateOne(
    { _id: new ObjectId(id) },
    { $set: { status, updatedAt: new Date() } },
  );
  const updated = await db
    .collection("employmentContracts")
    .findOne({ _id: new ObjectId(id) });
  if (!updated?._id) return null;
  return serializeContract(updated as EmploymentContractDoc & { _id: ObjectId });
}

export async function deleteHrDocument(id: string): Promise<boolean> {
  const db = await tryDb();
  if (!db || !ObjectId.isValid(id)) return false;
  const result = await db
    .collection("hrDocuments")
    .deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

export async function getRhOverview(): Promise<RhOverview> {
  const empty: RhOverview = {
    employeesTotal: 0,
    employeesActive: 0,
    leavesPending: 0,
    attendanceToday: 0,
    contractsExpiring: 0,
    documentsTotal: 0,
  };
  const db = await tryDb();
  if (!db) return empty;

  const today = new Date().toISOString().slice(0, 10);
  const in60 = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [
    employeesTotal,
    employeesActive,
    leavesPending,
    attendanceToday,
    contractsExpiring,
    documentsTotal,
  ] = await Promise.all([
    db.collection("employees").countDocuments(),
    db.collection("employees").countDocuments({
      status: { $in: ["actif", "essai"] },
    }),
    db.collection("leaves").countDocuments({ status: "demande" }),
    db.collection("attendances").countDocuments({ date: today }),
    db.collection("employmentContracts").countDocuments({
      status: "actif",
      endDate: { $gte: today, $lte: in60 },
    }),
    db.collection("hrDocuments").countDocuments(),
  ]);

  return {
    employeesTotal,
    employeesActive,
    leavesPending,
    attendanceToday,
    contractsExpiring,
    documentsTotal,
  };
}
