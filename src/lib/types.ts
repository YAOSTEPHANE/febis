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
  "mobile_money",
  "virement",
  "especes",
] as const;
export type PaymentChannel = (typeof PAYMENT_CHANNELS)[number];

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
  lines: ShopOrderLine[];
  totalAmount: number;
  currency: "XOF";
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
};
