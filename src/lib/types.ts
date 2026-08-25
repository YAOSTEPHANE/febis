export const ROLES = ["admin", "direction", "compta", "operationnels"] as const;
export type Role = (typeof ROLES)[number];

export const ACTIVITIES = [
  "residences",
  "btp",
  "evenementiel",
  "boutique",
] as const;
export type Activity = (typeof ACTIVITIES)[number];

export const LODGING_STATUSES = [
  "disponible",
  "reserve",
  "maintenance",
] as const;
export type LodgingStatus = (typeof LODGING_STATUSES)[number];

export const LODGING_CATEGORIES = [
  "appartement",
  "studio",
  "villa",
  "suite",
] as const;
export type LodgingCategory = (typeof LODGING_CATEGORIES)[number];

export const DAY_STATUSES = [
  "disponible",
  "reserve",
  "maintenance",
] as const;
export type DayStatus = (typeof DAY_STATUSES)[number];

export const RESERVATION_STEPS = [
  "demande",
  "reservation",
  "acompte",
  "check_in",
  "check_out",
  "etat_des_lieux",
] as const;
export type ReservationStep = (typeof RESERVATION_STEPS)[number];

export const PAYMENT_CHANNELS = [
  "wave",
  "orange_money",
  "mtn_money",
  "mobile_money",
  "virement",
  "especes",
] as const;
export type PaymentChannel = (typeof PAYMENT_CHANNELS)[number];

/** Providers Mobile Money (hors legacy / virement / espèces). */
export const MOBILE_MONEY_PROVIDERS = [
  "wave",
  "orange_money",
  "mtn_money",
] as const;
export type MobileMoneyProvider = (typeof MOBILE_MONEY_PROVIDERS)[number];

export function isMobileMoneyProvider(
  channel: string,
): channel is MobileMoneyProvider {
  return (MOBILE_MONEY_PROVIDERS as readonly string[]).includes(channel);
}

export type UserDoc = {
  _id?: string;
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ClientDoc = {
  _id?: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  tags?: string[];
  modules?: Array<Activity | "general">;
  status?: ClientStatus;
  interactions?: ClientInteraction[];
  lastInteractionAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export const CLIENT_STATUSES = ["prospect", "actif", "inactif"] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export const INTERACTION_TYPES = [
  "contact_form",
  "reservation_demande",
  "event_quote",
  "shop_order",
  "note",
  "appel",
  "email",
  "facture",
  "projet",
] as const;
export type InteractionType = (typeof INTERACTION_TYPES)[number];

export type ClientInteraction = {
  id: string;
  type: InteractionType | string;
  activity: Activity | "general" | string;
  title?: string;
  message: string;
  refType?: "reservation" | "event_quote" | "shop_order" | "invoice" | "project" | "contact";
  refId?: string;
  at: Date;
};

export const INVOICE_STATUSES = [
  "brouillon",
  "emise",
  "payee",
  "annulee",
] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export type InvoiceDoc = {
  _id?: string;
  number: string;
  clientId: string;
  clientEmail?: string;
  clientName: string;
  activity: Activity | "general";
  title: string;
  amount: number;
  currency: "XOF";
  status: InvoiceStatus;
  sourceType?: "reservation" | "event_quote" | "shop_order" | "manual";
  sourceId?: string;
  createdAt: Date;
  updatedAt: Date;
};

export const PROJECT_STATUSES = [
  "ouvert",
  "en_cours",
  "termine",
  "annule",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export type ProjectDoc = {
  _id?: string;
  title: string;
  clientId: string;
  clientEmail?: string;
  clientName: string;
  activity: Activity | "general";
  status: ProjectStatus;
  amount?: number;
  currency?: "XOF";
  sourceType?: "reservation" | "event_quote" | "shop_order" | "btp" | "manual";
  sourceId?: string;
  createdAt: Date;
  updatedAt: Date;
};

export const EXPENSE_CATEGORIES = [
  "achats",
  "salaires",
  "maintenance",
  "logistique",
  "marketing",
  "loyers",
  "autres",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export type ExpenseDoc = {
  _id?: string;
  activity: Activity;
  category: ExpenseCategory;
  title: string;
  amount: number;
  currency: "XOF";
  paymentChannel?: PaymentChannel;
  reference?: string;
  notes?: string;
  spentAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export const PAYMENT_DIRECTIONS = ["entrant", "sortant"] as const;
export type PaymentDirection = (typeof PAYMENT_DIRECTIONS)[number];

export const PAYMENT_STATUSES = [
  "en_attente",
  "confirme",
  "echec",
  "annule",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type PaymentDoc = {
  _id?: string;
  activity: Activity | "general";
  channel: PaymentChannel;
  direction: PaymentDirection;
  amount: number;
  currency: "XOF";
  status: PaymentStatus;
  title: string;
  reference?: string;
  clientId?: string;
  clientName?: string;
  clientPhone?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  notes?: string;
  /** Opérateur MM : wave (cadrage CDC §4.9) */
  provider?: "wave" | "manual";
  providerSessionId?: string;
  providerCheckoutUrl?: string;
  providerPayload?: Record<string, string | number | boolean | null>;
  paidAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export const BILLING_DOC_TYPES = [
  "devis",
  "facture",
  "recu",
  "contrat",
  "rapport",
] as const;
export type BillingDocType = (typeof BILLING_DOC_TYPES)[number];

export type BillingLine = {
  label: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type BillingDocumentDoc = {
  _id?: string;
  type: BillingDocType;
  number: string;
  title: string;
  activity: Activity | "general";
  clientId?: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientCompany?: string;
  lines: BillingLine[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: "XOF";
  notes?: string;
  validUntil?: string;
  sourceType?:
    | "reservation"
    | "event_quote"
    | "shop_order"
    | "invoice"
    | "btp"
    | "manual"
    | "report";
  sourceId?: string;
  meta?: Record<string, string | number | boolean>;
  createdAt: Date;
  updatedAt: Date;
};

export type ContactLeadDoc = {
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  activity?: Activity | "general";
  message: string;
  createdAt: Date;
  source: "site-vitrine";
};

export type LodgingDoc = {
  _id?: string;
  title: string;
  slug: string;
  description: string;
  longDescription?: string;
  photos: string[];
  pricePerNight: number;
  depositPercent: number;
  currency: "XOF";
  status: LodgingStatus;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  location: string;
  neighborhood: string;
  category: LodgingCategory;
  amenities: string[];
  highlights?: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type ReservationDoc = {
  _id?: string;
  lodgingId: string;
  lodgingSlug: string;
  lodgingTitle: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  nights: number;
  guests: number;
  totalAmount: number;
  depositAmount: number;
  currency: "XOF";
  step: ReservationStep;
  message?: string;
  paymentChannel?: PaymentChannel | null;
  inventoryNotes?: string;
  cancelled?: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CalendarDay = {
  date: string;
  status: DayStatus;
  label: string;
};

export const EQUIPMENT_STATUSES = [
  "disponible",
  "loue",
  "maintenance",
] as const;
export type EquipmentStatus = (typeof EQUIPMENT_STATUSES)[number];

export const EQUIPMENT_CATEGORIES = [
  "mobilier",
  "sonorisation",
  "eclairage",
  "decoration",
  "vaisselle",
] as const;
export type EquipmentCategory = (typeof EQUIPMENT_CATEGORIES)[number];

export const QUOTE_STATUSES = [
  "brouillon",
  "envoye",
  "accepte",
  "refuse",
] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const MOVEMENT_TYPES = ["sortie", "retour"] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];

export type EquipmentDoc = {
  _id?: string;
  name: string;
  slug: string;
  category: EquipmentCategory;
  description: string;
  photo: string;
  pricePerDay: number;
  depositAmount: number;
  currency: "XOF";
  quantityTotal: number;
  quantityAvailable: number;
  status: EquipmentStatus;
  penaltyPerDamage: number;
  createdAt: Date;
  updatedAt: Date;
};

export type EventQuoteLine = {
  equipmentSlug: string;
  equipmentName: string;
  quantity: number;
  days: number;
  unitPrice: number;
  depositUnit: number;
  lineTotal: number;
  lineDeposit: number;
};

export type EventQuoteDoc = {
  _id?: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  eventDate: string;
  returnDate: string;
  message?: string;
  lines: EventQuoteLine[];
  rentalTotal: number;
  depositTotal: number;
  currency: "XOF";
  status: QuoteStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type EquipmentMovementDoc = {
  _id?: string;
  quoteId?: string;
  equipmentSlug: string;
  type: MovementType;
  quantity: number;
  note?: string;
  damageReported?: boolean;
  penaltyAmount?: number;
  createdAt: Date;
};

export const PRODUCT_CATEGORIES = [
  "mode",
  "maison",
  "accessoires",
  "beaute",
] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const ORDER_STATUSES = [
  "en_attente",
  "confirmee",
  "expediee",
  "livree",
  "annulee",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type ProductVariant = {
  sku: string;
  size?: string;
  color?: string;
  stock: number;
  price: number;
};

export type ProductDoc = {
  _id?: string;
  name: string;
  slug: string;
  category: ProductCategory;
  description: string;
  photo: string;
  currency: "XOF";
  variants: ProductVariant[];
  featured?: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ShopOrderLine = {
  productSlug: string;
  productName: string;
  sku: string;
  size?: string;
  color?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type ShopOrderDoc = {
  _id?: string;
  orderNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  deliveryAddress: string;
  message?: string;
  paymentChannel?: PaymentChannel | null;
  lines: ShopOrderLine[];
  totalAmount: number;
  currency: "XOF";
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
};

/* ——— Module RH ——— */

export const EMPLOYEE_STATUSES = [
  "actif",
  "essai",
  "suspendu",
  "sortie",
] as const;
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

export const EMPLOYEE_DEPARTMENTS = [
  "direction",
  "residences",
  "btp",
  "evenementiel",
  "boutique",
  "compta",
  "rh",
  "operations",
] as const;
export type EmployeeDepartment = (typeof EMPLOYEE_DEPARTMENTS)[number];

export type EmployeeDoc = {
  _id?: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department: EmployeeDepartment;
  jobTitle: string;
  status: EmployeeStatus;
  hireDate: string; // YYYY-MM-DD
  endDate?: string;
  address?: string;
  emergencyContact?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

export const CONTRACT_TYPES = [
  "cdi",
  "cdd",
  "stage",
  "freelance",
  "apprentissage",
] as const;
export type ContractType = (typeof CONTRACT_TYPES)[number];

export const CONTRACT_STATUSES = [
  "brouillon",
  "actif",
  "expire",
  "resilie",
] as const;
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export type EmploymentContractDoc = {
  _id?: string;
  employeeId: string;
  employeeName: string;
  type: ContractType;
  status: ContractStatus;
  title: string;
  startDate: string;
  endDate?: string;
  salaryGross?: number;
  currency: "XOF";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

export const ATTENDANCE_STATUSES = [
  "present",
  "absent",
  "retard",
  "teletravail",
  "mission",
] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export type AttendanceDoc = {
  _id?: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  checkIn?: string; // HH:mm
  checkOut?: string;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
};

export const LEAVE_TYPES = [
  "conges_payes",
  "maladie",
  "sans_solde",
  "maternite",
  "paternite",
  "exceptionnel",
] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];

export const LEAVE_STATUSES = [
  "demande",
  "approuve",
  "refuse",
  "annule",
] as const;
export type LeaveStatus = (typeof LEAVE_STATUSES)[number];

export type LeaveDoc = {
  _id?: string;
  employeeId: string;
  employeeName: string;
  type: LeaveType;
  status: LeaveStatus;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
};

export const HR_DOC_CATEGORIES = [
  "contrat",
  "identite",
  "diplome",
  "medical",
  "paie",
  "autre",
] as const;
export type HrDocCategory = (typeof HR_DOC_CATEGORIES)[number];

export type HrDocumentDoc = {
  _id?: string;
  employeeId: string;
  employeeName: string;
  category: HrDocCategory;
  title: string;
  fileName: string;
  mimeType?: string;
  /** URL externe ou data URL (petits fichiers) */
  fileUrl: string;
  notes?: string;
  uploadedAt: Date;
  createdAt: Date;
};

/* ——— Module BTP (CDC §4.3) ——— */

export const BTP_STEPS = [
  "prospect",
  "devis",
  "contrat",
  "chantier",
  "avancement",
  "livraison",
] as const;
export type BtpStep = (typeof BTP_STEPS)[number];

export type BtpProjectDoc = {
  _id?: string;
  reference: string;
  title: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientCompany?: string;
  location: string;
  description?: string;
  step: BtpStep;
  quoteAmount: number;
  contractAmount?: number;
  progressPercent: number;
  currency: "XOF";
  startDate?: string;
  expectedEndDate?: string;
  deliveredAt?: string | null;
  notes?: string;
  cancelled?: boolean;
  crmClientId?: string;
  crmProjectId?: string;
  createdAt: Date;
  updatedAt: Date;
};
