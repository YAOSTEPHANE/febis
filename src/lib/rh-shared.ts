import type {
  AttendanceStatus,
  ContractStatus,
  ContractType,
  EmployeeDepartment,
  EmployeeStatus,
  HrDocCategory,
  LeaveStatus,
  LeaveType,
} from "@/lib/types";
import {
  ATTENDANCE_STATUSES,
  CONTRACT_STATUSES,
  CONTRACT_TYPES,
  EMPLOYEE_DEPARTMENTS,
  EMPLOYEE_STATUSES,
  HR_DOC_CATEGORIES,
  LEAVE_STATUSES,
  LEAVE_TYPES,
} from "@/lib/types";

export type SerializedEmployee = {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
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
  createdAt: string;
  updatedAt: string;
};

export type SerializedContract = {
  id: string;
  employeeId: string;
  employeeName: string;
  type: ContractType;
  status: ContractStatus;
  title: string;
  startDate: string;
  endDate: string;
  salaryGross: number | null;
  notes: string;
  createdAt: string;
};

export type SerializedAttendance = {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  status: AttendanceStatus;
  checkIn: string;
  checkOut: string;
  note: string;
};

export type SerializedLeave = {
  id: string;
  employeeId: string;
  employeeName: string;
  type: LeaveType;
  status: LeaveStatus;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  createdAt: string;
};

export type SerializedHrDocument = {
  id: string;
  employeeId: string;
  employeeName: string;
  category: HrDocCategory;
  title: string;
  fileName: string;
  mimeType: string;
  fileUrl: string;
  notes: string;
  uploadedAt: string;
};

export function departmentLabel(value: string) {
  switch (value) {
    case "direction":
      return "Direction";
    case "residences":
      return "Résidences";
    case "btp":
      return "BTP";
    case "evenementiel":
      return "Événementiel";
    case "boutique":
      return "Boutique";
    case "compta":
      return "Compta";
    case "rh":
      return "RH";
    case "operations":
      return "Opérations";
    default:
      return value;
  }
}

export function employeeStatusLabel(value: string) {
  switch (value) {
    case "actif":
      return "Actif";
    case "essai":
      return "Période d’essai";
    case "suspendu":
      return "Suspendu";
    case "sortie":
      return "Sorti";
    default:
      return value;
  }
}

export function contractTypeLabel(value: string) {
  switch (value) {
    case "cdi":
      return "CDI";
    case "cdd":
      return "CDD";
    case "stage":
      return "Stage";
    case "freelance":
      return "Freelance";
    case "apprentissage":
      return "Apprentissage";
    default:
      return value;
  }
}

export function attendanceStatusLabel(value: string) {
  switch (value) {
    case "present":
      return "Présent";
    case "absent":
      return "Absent";
    case "retard":
      return "Retard";
    case "teletravail":
      return "Télétravail";
    case "mission":
      return "Mission";
    default:
      return value;
  }
}

export function leaveTypeLabel(value: string) {
  switch (value) {
    case "conges_payes":
      return "Congés payés";
    case "maladie":
      return "Maladie";
    case "sans_solde":
      return "Sans solde";
    case "maternite":
      return "Maternité";
    case "paternite":
      return "Paternité";
    case "exceptionnel":
      return "Exceptionnel";
    default:
      return value;
  }
}

export function leaveStatusLabel(value: string) {
  switch (value) {
    case "demande":
      return "Demande";
    case "approuve":
      return "Approuvé";
    case "refuse":
      return "Refusé";
    case "annule":
      return "Annulé";
    default:
      return value;
  }
}

export function hrDocCategoryLabel(value: string) {
  switch (value) {
    case "contrat":
      return "Contrat";
    case "identite":
      return "Identité";
    case "diplome":
      return "Diplôme";
    case "medical":
      return "Médical";
    case "paie":
      return "Paie";
    case "autre":
      return "Autre";
    default:
      return value;
  }
}

export {
  ATTENDANCE_STATUSES,
  CONTRACT_STATUSES,
  CONTRACT_TYPES,
  EMPLOYEE_DEPARTMENTS,
  EMPLOYEE_STATUSES,
  HR_DOC_CATEGORIES,
  LEAVE_STATUSES,
  LEAVE_TYPES,
};
