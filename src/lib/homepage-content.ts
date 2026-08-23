import type { Activity, LodgingCategory } from "@/lib/types";
import type { BlogCategory, BlogPost } from "@/lib/blog";
import type { Testimonial } from "@/lib/temoignages";
import type { RecentWork, WorkPole } from "@/lib/travaux";

export type HeroContent = {
  eyebrow: string;
  brand: string;
  headline: string;
  highlight: string;
  description: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
};

export type TrustStat = {
  value: string;
  label: string;
};

export type CategoryContent = {
  key: LodgingCategory;
  description: string;
  image: string;
  from: string;
};

export type PoleContent = {
  id: string;
  title: string;
  tag: string;
  description: string;
  image: string;
  points: string[];
  href?: string;
};

export type PlatformItem = {
  title: string;
  text: string;
};

export type PlatformContent = {
  eyebrow: string;
  title: string;
  highlight: string;
  description: string;
  items: PlatformItem[];
  roles: string[];
};

export const DEFAULT_HERO: HeroContent = {
  eyebrow: "Côte d'Ivoire",
  brand: "FEBiS",
  headline: "Résidences, BTP, événementiel & boutique —",
  highlight: "un seul écosystème",
  description:
    "Plateforme digitale pour réserver, louer, construire et vendre — avec un pilotage unifié.",
  primaryCtaLabel: "Explorer",
  primaryCtaHref: "#categories",
  secondaryCtaLabel: "Nous contacter",
  secondaryCtaHref: "#contact",
};

export const DEFAULT_TRUST: TrustStat[] = [
  { value: "4", label: "Pôles d’activité" },
  { value: "24/7", label: "Disponibilité live" },
  { value: "XOF", label: "Tarifs & cautions" },
  { value: "CI", label: "Ancré à Abidjan" },
];

export const DEFAULT_CATEGORIES: CategoryContent[] = [
  {
    key: "appartement",
    description: "Espaces meublés élégants pour séjours court et moyen terme.",
    image: "/images/pole-residences.jpg",
    from: "45 000",
  },
  {
    key: "studio",
    description: "Compacts, efficaces — idéals missions et déplacements affaires.",
    image: "/images/residence-bedroom.jpg",
    from: "28 000",
  },
  {
    key: "villa",
    description: "Grandes demeures avec jardin pour familles et longs séjours.",
    image: "/images/villa-3d.png",
    from: "85 000",
  },
  {
    key: "suite",
    description: "Confort exécutif avec salon privé et services premium.",
    image: "/images/residence-terrace.jpg",
    from: "62 000",
  },
];

export const DEFAULT_POLES: PoleContent[] = [
  {
    id: "residences",
    title: "Résidences meublées",
    tag: "Hébergement",
    description:
      "Fiches logements, calendrier de disponibilité, réservations, acomptes et suivi check-in / check-out.",
    image: "/images/pole-residences.jpg",
    points: ["Photos & tarifs", "Dispo / réservé / maintenance", "État des lieux"],
    href: "/residences",
  },
  {
    id: "btp",
    title: "BTP",
    tag: "Construction",
    description:
      "Prospects, devis, contrats et suivi d’avancement projet jusqu’à la livraison finale.",
    image: "/images/pole-btp.jpg",
    points: ["Opportunités commerciales", "Devis → contrat", "Workflow par étapes"],
    href: "/#travaux",
  },
  {
    id: "evenementiel",
    title: "Événementiel",
    tag: "Location matériel",
    description:
      "Catalogue matériel en temps réel, cautions, devis de location, sorties / retours et dommages.",
    image: "/images/pole-eventiel.jpg",
    points: ["Disponibilité live", "Cautions & pénalités", "Suivi matériel"],
    href: "/evenementiel",
  },
  {
    id: "boutique",
    title: "Boutique",
    tag: "Commerce",
    description:
      "Produits, variantes, stocks, tunnel de commande et historique des ventes.",
    image: "/images/pole-boutique.jpg",
    points: ["Fiches & stock", "Variantes", "Panier → commande"],
    href: "/#boutique",
  },
];

export const DEFAULT_PLATFORM: PlatformContent = {
  eyebrow: "Plateforme digitale",
  title: "Une base centrale.",
  highlight: "Zéro duplication.",
  description:
    "Clients, paiements, stocks et RH partagés dans un écosystème unique — sécurisé (HTTPS, mots de passe hachés, 4 profils d’accès).",
  items: [
    {
      title: "CRM unique",
      text: "Base clients partagée entre tous les modules — historique, factures et projets liés.",
    },
    {
      title: "Finance & paiements",
      text: "Revenus / dépenses par activité, Mobile Money, virement, espèces et suivi des impayés.",
    },
    {
      title: "Facturation PDF",
      text: "Devis, factures, reçus, contrats et rapports générés automatiquement.",
    },
    {
      title: "Pilotage Direction",
      text: "Tableau de bord temps réel, notifications, droits par profil et sauvegardes.",
    },
  ],
  roles: ["Admin", "Direction", "Compta", "Opérationnels"],
};

export type HomepageKey =
  | "hero"
  | "trust"
  | "categories"
  | "poles"
  | "platform";

export type HomepagePayloadMap = {
  hero: HeroContent;
  trust: TrustStat[];
  categories: CategoryContent[];
  poles: PoleContent[];
  platform: PlatformContent;
};

export const HOMEPAGE_DEFAULTS: HomepagePayloadMap = {
  hero: DEFAULT_HERO,
  trust: DEFAULT_TRUST,
  categories: DEFAULT_CATEGORIES,
  poles: DEFAULT_POLES,
  platform: DEFAULT_PLATFORM,
};

export type AdminNavItem = {
  href: string;
  label: string;
  description: string;
};

export const ADMIN_NAV: AdminNavItem[] = [
  {
    href: "/admin/dashboard",
    label: "Vue d’ensemble",
    description: "Compteurs et accès rapide",
  },
  {
    href: "/admin/dashboard/hero",
    label: "Hero",
    description: "Titre, CTA, marque",
  },
  {
    href: "/admin/dashboard/categories",
    label: "Catégories",
    description: "Types de logements",
  },
  {
    href: "/admin/dashboard/stats",
    label: "Bandeau stats",
    description: "Indicateurs confiance",
  },
  {
    href: "/admin/dashboard/residences",
    label: "Résidences",
    description: "Logements à la une",
  },
  {
    href: "/admin/dashboard/evenementiel",
    label: "Événementiel",
    description: "Catalogue matériel",
  },
  {
    href: "/admin/dashboard/travaux",
    label: "Travaux",
    description: "Portfolio BTP & events",
  },
  {
    href: "/admin/dashboard/poles",
    label: "Pôles",
    description: "Quatre activités",
  },
  {
    href: "/admin/dashboard/blog",
    label: "Blog",
    description: "Articles",
  },
  {
    href: "/admin/dashboard/temoignages",
    label: "Témoignages",
    description: "Avis clients",
  },
  {
    href: "/admin/dashboard/plateforme",
    label: "Plateforme",
    description: "Modules transverses",
  },
  {
    href: "/admin/dashboard/contacts",
    label: "Contacts",
    description: "Messages vitrine",
  },
];

export type { BlogPost, BlogCategory, Testimonial, RecentWork, WorkPole, Activity };
