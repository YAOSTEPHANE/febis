import type { BtpHouseSpec, BtpQuoteLine } from "@/lib/types";

export const BTP_QUOTE_CATEGORIES = [
  "etudes",
  "terrassement",
  "gros_oeuvre",
  "toiture",
  "menuiseries",
  "electricite",
  "plomberie",
  "enduits",
  "sols",
  "finitions",
  "exterieurs",
  "services",
] as const;

export type BtpQuoteCategory = (typeof BTP_QUOTE_CATEGORIES)[number];

export type BtpQuoteUnit = "m2" | "m3" | "ml" | "u" | "forfait" | "kg" | "sac";

export type BtpQuoteCatalogItem = {
  code: string;
  category: BtpQuoteCategory;
  label: string;
  description: string;
  unit: BtpQuoteUnit;
  /** Prix unitaire indicatif XOF (niveau standard) */
  unitPrice: number;
  /** Quantité ≈ surface × facteur */
  qtyPerM2?: number;
  /** Quantité fixe si sélectionné */
  defaultQty?: number;
  /** Ajout de quantité par étage au-delà du RDC */
  perExtraFloor?: number;
  /** Réservé au pack extérieur */
  exteriorOnly?: boolean;
};

export const FINISH_LEVELS = ["standard", "confort", "premium"] as const;
export type FinishLevel = (typeof FINISH_LEVELS)[number];

export function finishLevelLabel(level: string): string {
  switch (level) {
    case "standard":
      return "Standard";
    case "confort":
      return "Confort";
    case "premium":
      return "Premium";
    default:
      return level;
  }
}

export function finishLevelMultiplier(level: FinishLevel): number {
  switch (level) {
    case "standard":
      return 1;
    case "confort":
      return 1.25;
    case "premium":
      return 1.55;
    default: {
      const _exhaustive: never = level;
      return _exhaustive;
    }
  }
}

export function btpQuoteCategoryLabel(category: string): string {
  switch (category) {
    case "etudes":
      return "Études & administratif";
    case "terrassement":
      return "Terrassement & fondations";
    case "gros_oeuvre":
      return "Gros œuvre";
    case "toiture":
      return "Toiture & étanchéité";
    case "menuiseries":
      return "Menuiseries";
    case "electricite":
      return "Électricité";
    case "plomberie":
      return "Plomberie & sanitaire";
    case "enduits":
      return "Enduits & peinture";
    case "sols":
      return "Sols & carrelage";
    case "finitions":
      return "Finitions intérieures";
    case "exterieurs":
      return "Extérieurs & clôture";
    case "services":
      return "Main d’œuvre & divers";
    default:
      return category;
  }
}

export function btpQuoteUnitLabel(unit: string): string {
  switch (unit) {
    case "m2":
      return "m²";
    case "m3":
      return "m³";
    case "ml":
      return "ml";
    case "u":
      return "u";
    case "forfait":
      return "forfait";
    case "kg":
      return "kg";
    case "sac":
      return "sac";
    default:
      return unit;
  }
}

/** Catalogue indicatif — construction maison individuelle (Côte d’Ivoire) */
export const HOUSE_BUILD_CATALOG: BtpQuoteCatalogItem[] = [
  {
    code: "ETU-01",
    category: "etudes",
    label: "Étude de sol",
    description: "Sondages et rapport géotechnique.",
    unit: "forfait",
    unitPrice: 350000,
    defaultQty: 1,
  },
  {
    code: "ETU-02",
    category: "etudes",
    label: "Plans architecturaux",
    description: "Plans de masse, niveaux, façades, coupes.",
    unit: "forfait",
    unitPrice: 800000,
    defaultQty: 1,
  },
  {
    code: "ETU-03",
    category: "etudes",
    label: "Étude structure béton",
    description: "Calculs et plans ferraillage / béton armé.",
    unit: "forfait",
    unitPrice: 450000,
    defaultQty: 1,
  },
  {
    code: "ETU-04",
    category: "etudes",
    label: "Permis de construire / dossiers",
    description: "Constitution et suivi administratif.",
    unit: "forfait",
    unitPrice: 250000,
    defaultQty: 1,
  },
  {
    code: "TER-01",
    category: "terrassement",
    label: "Débroussaillage & nettoyage terrain",
    description: "Préparation de la parcelle.",
    unit: "m2",
    unitPrice: 1500,
    qtyPerM2: 1.2,
  },
  {
    code: "TER-02",
    category: "terrassement",
    label: "Terrassement / fouilles",
    description: "Excavation fondations et plateforme.",
    unit: "m3",
    unitPrice: 12000,
    qtyPerM2: 0.45,
  },
  {
    code: "TER-03",
    category: "terrassement",
    label: "Fondations (semelles / longrines)",
    description: "Béton armé de fondation.",
    unit: "m3",
    unitPrice: 95000,
    qtyPerM2: 0.22,
  },
  {
    code: "TER-04",
    category: "terrassement",
    label: "Remblai compacté",
    description: "Remblai sous dallage.",
    unit: "m3",
    unitPrice: 18000,
    qtyPerM2: 0.18,
  },
  {
    code: "GO-01",
    category: "gros_oeuvre",
    label: "Ciment (sacs 50 kg)",
    description: "Approvisionnement ciment chantier.",
    unit: "sac",
    unitPrice: 6500,
    qtyPerM2: 1.8,
    perExtraFloor: 1.4,
  },
  {
    code: "GO-02",
    category: "gros_oeuvre",
    label: "Fer à béton",
    description: "Armatures HA pour structure.",
    unit: "kg",
    unitPrice: 750,
    qtyPerM2: 28,
    perExtraFloor: 22,
  },
  {
    code: "GO-03",
    category: "gros_oeuvre",
    label: "Gravier / sable",
    description: "Granulats pour béton et mortier.",
    unit: "m3",
    unitPrice: 35000,
    qtyPerM2: 0.35,
    perExtraFloor: 0.25,
  },
  {
    code: "GO-04",
    category: "gros_oeuvre",
    label: "Blocs / parpaings",
    description: "Maçonnerie murs porteurs et cloisons.",
    unit: "u",
    unitPrice: 450,
    qtyPerM2: 55,
    perExtraFloor: 45,
  },
  {
    code: "GO-05",
    category: "gros_oeuvre",
    label: "Dalle béton armé",
    description: "Dalle de plancher / RDC.",
    unit: "m2",
    unitPrice: 28000,
    qtyPerM2: 1,
    perExtraFloor: 1,
  },
  {
    code: "GO-06",
    category: "gros_oeuvre",
    label: "Poteaux & poutres",
    description: "Éléments structurels béton armé.",
    unit: "ml",
    unitPrice: 22000,
    qtyPerM2: 0.55,
    perExtraFloor: 0.4,
  },
  {
    code: "GO-07",
    category: "gros_oeuvre",
    label: "Escalier béton",
    description: "Cage d’escalier entre niveaux.",
    unit: "u",
    unitPrice: 650000,
    defaultQty: 0,
    perExtraFloor: 1,
  },
  {
    code: "TOI-01",
    category: "toiture",
    label: "Charpente bois / métallique",
    description: "Structure porteuse toiture.",
    unit: "m2",
    unitPrice: 18000,
    qtyPerM2: 1.15,
  },
  {
    code: "TOI-02",
    category: "toiture",
    label: "Couverture (bac alu / tuiles)",
    description: "Matériau de couverture.",
    unit: "m2",
    unitPrice: 12000,
    qtyPerM2: 1.15,
  },
  {
    code: "TOI-03",
    category: "toiture",
    label: "Étanchéité & isolation toiture",
    description: "Membrane, sous-toiture, finitions.",
    unit: "m2",
    unitPrice: 8500,
    qtyPerM2: 1.1,
  },
  {
    code: "TOI-04",
    category: "toiture",
    label: "Gouttières & descentes EP",
    description: "Évacuation eaux pluviales.",
    unit: "ml",
    unitPrice: 8500,
    qtyPerM2: 0.35,
  },
  {
    code: "MEN-01",
    category: "menuiseries",
    label: "Portes intérieures",
    description: "Huisseries et portes chambres / pièces.",
    unit: "u",
    unitPrice: 95000,
    defaultQty: 0,
  },
  {
    code: "MEN-02",
    category: "menuiseries",
    label: "Porte d’entrée blindée",
    description: "Porte principale sécurisée.",
    unit: "u",
    unitPrice: 450000,
    defaultQty: 1,
  },
  {
    code: "MEN-03",
    category: "menuiseries",
    label: "Fenêtres aluminium / PVC",
    description: "Ouvertures vitrées (unité moyenne).",
    unit: "u",
    unitPrice: 180000,
    qtyPerM2: 0.08,
  },
  {
    code: "MEN-04",
    category: "menuiseries",
    label: "Portes-fenêtres / baies",
    description: "Ouvertures salon / terrasse.",
    unit: "u",
    unitPrice: 320000,
    defaultQty: 2,
  },
  {
    code: "ELE-01",
    category: "electricite",
    label: "Tableau électrique & disjoncteurs",
    description: "Tableau principal + différentiels.",
    unit: "forfait",
    unitPrice: 280000,
    defaultQty: 1,
  },
  {
    code: "ELE-02",
    category: "electricite",
    label: "Câblage & points électriques",
    description: "Prises, interrupteurs, éclairage.",
    unit: "u",
    unitPrice: 18000,
    qtyPerM2: 0.9,
  },
  {
    code: "ELE-03",
    category: "electricite",
    label: "Éclairage LED (appareils)",
    description: "Luminaires inclus au devis.",
    unit: "u",
    unitPrice: 25000,
    qtyPerM2: 0.35,
  },
  {
    code: "ELE-04",
    category: "electricite",
    label: "Mise à la terre & parafoudre",
    description: "Sécurité électrique.",
    unit: "forfait",
    unitPrice: 150000,
    defaultQty: 1,
  },
  {
    code: "PLO-01",
    category: "plomberie",
    label: "Réseau eau froide / chaude",
    description: "Tuyauterie cuivre / PPR.",
    unit: "ml",
    unitPrice: 6500,
    qtyPerM2: 1.2,
  },
  {
    code: "PLO-02",
    category: "plomberie",
    label: "Évacuations eaux usées",
    description: "Collecteurs et branchements.",
    unit: "ml",
    unitPrice: 5500,
    qtyPerM2: 0.9,
  },
  {
    code: "PLO-03",
    category: "plomberie",
    label: "Sanitaires (WC, lavabo, douche)",
    description: "Appareils par salle d’eau.",
    unit: "u",
    unitPrice: 185000,
    defaultQty: 0,
  },
  {
    code: "PLO-04",
    category: "plomberie",
    label: "Chauffe-eau",
    description: "Ballon électrique ou solaire.",
    unit: "u",
    unitPrice: 220000,
    defaultQty: 1,
  },
  {
    code: "PLO-05",
    category: "plomberie",
    label: "Fosse septique / assainissement",
    description: "Fosse et drains (si hors réseau).",
    unit: "forfait",
    unitPrice: 650000,
    defaultQty: 1,
  },
  {
    code: "END-01",
    category: "enduits",
    label: "Enduit intérieur",
    description: "Enduit murs et plafonds.",
    unit: "m2",
    unitPrice: 4500,
    qtyPerM2: 2.8,
    perExtraFloor: 2.4,
  },
  {
    code: "END-02",
    category: "enduits",
    label: "Enduit / crépi extérieur",
    description: "Façades.",
    unit: "m2",
    unitPrice: 6500,
    qtyPerM2: 1.4,
    perExtraFloor: 1.1,
  },
  {
    code: "END-03",
    category: "enduits",
    label: "Peinture intérieure",
    description: "Sous-couche + finition.",
    unit: "m2",
    unitPrice: 3500,
    qtyPerM2: 2.8,
    perExtraFloor: 2.4,
  },
  {
    code: "END-04",
    category: "enduits",
    label: "Peinture façade",
    description: "Protection et esthétique extérieure.",
    unit: "m2",
    unitPrice: 4200,
    qtyPerM2: 1.4,
    perExtraFloor: 1.1,
  },
  {
    code: "SOL-01",
    category: "sols",
    label: "Chape de nivellement",
    description: "Support avant carrelage.",
    unit: "m2",
    unitPrice: 5500,
    qtyPerM2: 1,
    perExtraFloor: 1,
  },
  {
    code: "SOL-02",
    category: "sols",
    label: "Carrelage sols",
    description: "Pose comprise, qualité selon finition.",
    unit: "m2",
    unitPrice: 12000,
    qtyPerM2: 0.95,
    perExtraFloor: 0.95,
  },
  {
    code: "SOL-03",
    category: "sols",
    label: "Faïence salles d’eau",
    description: "Murs humides.",
    unit: "m2",
    unitPrice: 14000,
    qtyPerM2: 0.35,
  },
  {
    code: "SOL-04",
    category: "sols",
    label: "Plinthes",
    description: "Finitions bas de murs.",
    unit: "ml",
    unitPrice: 3500,
    qtyPerM2: 0.85,
    perExtraFloor: 0.7,
  },
  {
    code: "FIN-01",
    category: "finitions",
    label: "Faux plafonds",
    description: "Plafonds staff / placo.",
    unit: "m2",
    unitPrice: 9000,
    qtyPerM2: 0.85,
    perExtraFloor: 0.85,
  },
  {
    code: "FIN-02",
    category: "finitions",
    label: "Cuisine équipée (base)",
    description: "Meubles + plan de travail.",
    unit: "forfait",
    unitPrice: 1800000,
    defaultQty: 1,
  },
  {
    code: "FIN-03",
    category: "finitions",
    label: "Dressing / placards",
    description: "Rangements chambres.",
    unit: "u",
    unitPrice: 280000,
    defaultQty: 0,
  },
  {
    code: "FIN-04",
    category: "finitions",
    label: "Climatisation (splits)",
    description: "Unités murales principales.",
    unit: "u",
    unitPrice: 450000,
    defaultQty: 0,
  },
  {
    code: "EXT-01",
    category: "exterieurs",
    label: "Clôture & muret",
    description: "Périmètre parcelle.",
    unit: "ml",
    unitPrice: 45000,
    defaultQty: 40,
    exteriorOnly: true,
  },
  {
    code: "EXT-02",
    category: "exterieurs",
    label: "Portail motorisé",
    description: "Entrée véhicule.",
    unit: "u",
    unitPrice: 850000,
    defaultQty: 1,
    exteriorOnly: true,
  },
  {
    code: "EXT-03",
    category: "exterieurs",
    label: "Dallage / allées extérieures",
    description: "Accès et cour.",
    unit: "m2",
    unitPrice: 16000,
    defaultQty: 40,
    exteriorOnly: true,
  },
  {
    code: "EXT-04",
    category: "exterieurs",
    label: "Fosse / regard & branchements",
    description: "Raccordements parcelle.",
    unit: "forfait",
    unitPrice: 320000,
    defaultQty: 1,
    exteriorOnly: true,
  },
  {
    code: "SRV-01",
    category: "services",
    label: "Main d’œuvre maçonnerie",
    description: "Équipe gros œuvre.",
    unit: "forfait",
    unitPrice: 2500000,
    defaultQty: 1,
  },
  {
    code: "SRV-02",
    category: "services",
    label: "Main d’œuvre second œuvre",
    description: "Électricité, plomberie, finitions.",
    unit: "forfait",
    unitPrice: 1800000,
    defaultQty: 1,
  },
  {
    code: "SRV-03",
    category: "services",
    label: "Échafaudage & engins",
    description: "Location matériel chantier.",
    unit: "forfait",
    unitPrice: 450000,
    defaultQty: 1,
  },
  {
    code: "SRV-04",
    category: "services",
    label: "Transport matériaux",
    description: "Approvisionnement site.",
    unit: "forfait",
    unitPrice: 350000,
    defaultQty: 1,
  },
  {
    code: "SRV-05",
    category: "services",
    label: "Direction de travaux / suivi",
    description: "Pilotage et contrôles qualité.",
    unit: "forfait",
    unitPrice: 600000,
    defaultQty: 1,
  },
];

function roundQty(value: number, unit: BtpQuoteUnit): number {
  if (unit === "forfait" || unit === "u") {
    return Math.max(0, Math.round(value));
  }
  if (unit === "sac" || unit === "kg") {
    return Math.max(0, Math.round(value));
  }
  return Math.max(0, Math.round(value * 10) / 10);
}

export function estimateCatalogQuantity(
  item: BtpQuoteCatalogItem,
  spec: Pick<BtpHouseSpec, "surfaceM2" | "floors" | "rooms">,
): number {
  const surface = Math.max(20, spec.surfaceM2);
  const floors = Math.max(1, Math.round(spec.floors));
  const extraFloors = Math.max(0, floors - 1);
  const rooms = Math.max(1, Math.round(spec.rooms));

  let qty = 0;
  if (typeof item.qtyPerM2 === "number") {
    qty += surface * item.qtyPerM2;
    if (typeof item.perExtraFloor === "number") {
      qty += surface * item.perExtraFloor * extraFloors;
    }
  } else if (typeof item.defaultQty === "number") {
    qty += item.defaultQty;
    if (typeof item.perExtraFloor === "number") {
      qty += item.perExtraFloor * extraFloors;
    }
  }

  // Heuristiques métier
  if (item.code === "MEN-01") qty = Math.max(rooms + 2, floors * 3);
  if (item.code === "PLO-03") qty = Math.max(1, Math.ceil(rooms / 2) + (floors > 1 ? 1 : 0));
  if (item.code === "FIN-03") qty = Math.max(1, rooms - 1);
  if (item.code === "FIN-04") qty = Math.max(1, Math.ceil(rooms / 2) + 1);
  if (item.code === "GO-07") qty = extraFloors;
  if (item.code === "SRV-01" || item.code === "SRV-02") {
    qty = 1;
  }

  return roundQty(qty, item.unit);
}

export function buildQuoteLineFromCatalog(
  item: BtpQuoteCatalogItem,
  quantity: number,
  finishLevel: FinishLevel,
): BtpQuoteLine {
  const qty = Math.max(0, quantity);
  const unitPrice = Math.round(
    item.unitPrice * finishLevelMultiplier(finishLevel),
  );
  return {
    code: item.code,
    category: item.category,
    label: item.label,
    unit: item.unit,
    quantity: qty,
    unitPrice,
    lineTotal: Math.round(qty * unitPrice),
  };
}

export function buildHouseQuoteLines(input: {
  spec: BtpHouseSpec;
  selectedCodes: string[];
  quantityOverrides?: Record<string, number>;
}): BtpQuoteLine[] {
  const selected = new Set(input.selectedCodes);
  const lines: BtpQuoteLine[] = [];

  for (const item of HOUSE_BUILD_CATALOG) {
    if (!selected.has(item.code)) continue;
    if (item.exteriorOnly && !input.spec.includeExterior) continue;

    const estimated = estimateCatalogQuantity(item, input.spec);
    const qty =
      input.quantityOverrides &&
      Object.prototype.hasOwnProperty.call(input.quantityOverrides, item.code)
        ? Math.max(0, input.quantityOverrides[item.code] ?? 0)
        : estimated;

    if (qty <= 0) continue;
    lines.push(buildQuoteLineFromCatalog(item, qty, input.spec.finishLevel));
  }

  return lines;
}

export function sumQuoteLines(lines: BtpQuoteLine[]): number {
  return lines.reduce((sum, line) => sum + line.lineTotal, 0);
}

export function defaultSelectedCodes(includeExterior: boolean): string[] {
  return HOUSE_BUILD_CATALOG.filter(
    (item) => includeExterior || !item.exteriorOnly,
  ).map((item) => item.code);
}

export function parseQuoteLines(raw: unknown): BtpQuoteLine[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const lines: BtpQuoteLine[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const item = row as Record<string, unknown>;
    const code = typeof item.code === "string" ? item.code.trim() : "";
    const label = typeof item.label === "string" ? item.label.trim() : "";
    const category =
      typeof item.category === "string" ? item.category.trim() : "";
    const unit = typeof item.unit === "string" ? item.unit.trim() : "u";
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);
    if (!code || !label || !Number.isFinite(quantity) || quantity <= 0) continue;
    if (!Number.isFinite(unitPrice) || unitPrice < 0) continue;
    lines.push({
      code,
      category: category || "services",
      label,
      unit: unit || "u",
      quantity,
      unitPrice,
      lineTotal: Math.round(quantity * unitPrice),
    });
  }
  return lines.length > 0 ? lines : undefined;
}

export function parseHouseSpec(raw: unknown): BtpHouseSpec | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const spec = raw as Record<string, unknown>;
  const surfaceM2 = Number(spec.surfaceM2);
  const floors = Number(spec.floors);
  const rooms = Number(spec.rooms);
  const finishLevel = String(spec.finishLevel ?? "standard");
  if (!Number.isFinite(surfaceM2) || surfaceM2 < 20) return undefined;
  if (!Number.isFinite(floors) || floors < 1) return undefined;
  if (!Number.isFinite(rooms) || rooms < 1) return undefined;
  if (!(FINISH_LEVELS as readonly string[]).includes(finishLevel)) {
    return undefined;
  }
  return {
    surfaceM2: Math.round(surfaceM2),
    floors: Math.round(floors),
    rooms: Math.round(rooms),
    finishLevel: finishLevel as FinishLevel,
    includeExterior: Boolean(spec.includeExterior),
  };
}
