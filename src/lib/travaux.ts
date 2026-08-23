export type WorkPole = "evenementiel" | "btp";

export type RecentWork = {
  id: string;
  pole: WorkPole;
  title: string;
  location: string;
  year: string;
  summary: string;
  image: string;
  tags: string[];
};

export const RECENT_WORKS: RecentWork[] = [
  {
    id: "evt-mariage-lagune",
    pole: "evenementiel",
    title: "Mariage sur la lagune",
    location: "Cocody, Abidjan",
    year: "2026",
    summary:
      "Scénographie complète : tente stretch, éclairage LED, mobilier Chiavari or et sono.",
    image: "/images/travail-event-1.jpg",
    tags: ["Mariage", "Décoration", "Sono"],
  },
  {
    id: "btp-villa-riviera",
    pole: "btp",
    title: "Villa Rivière Angré",
    location: "Angré, Abidjan",
    year: "2025",
    summary:
      "Construction d’une villa R+1 : gros œuvre, second œuvre et livraison clé en main.",
    image: "/images/travail-btp-2.jpg",
    tags: ["Villa", "Clé en main"],
  },
  {
    id: "evt-gala-corporate",
    pole: "evenementiel",
    title: "Gala corporate Plateau",
    location: "Plateau, Abidjan",
    year: "2025",
    summary:
      "Soirée 280 convives — scène, lumière ambiance, vaisselle cristal et coordination logistique.",
    image: "/images/travail-event-2.jpg",
    tags: ["Corporate", "Éclairage"],
  },
  {
    id: "btp-chantier-marcory",
    pole: "btp",
    title: "Chantier résidentiel Marcory",
    location: "Marcory, Abidjan",
    year: "2025",
    summary:
      "Suivi d’avancement d’un immeuble R+2 : planning, contrôles qualité et reporting client.",
    image: "/images/travail-btp-1.jpg",
    tags: ["Immeuble", "Suivi"],
  },
  {
    id: "evt-reception-vip",
    pole: "evenementiel",
    title: "Réception VIP Zone 4",
    location: "Zone 4, Abidjan",
    year: "2024",
    summary:
      "Location matériel premium, mise en place et retour avec inventaire sans incident.",
    image: "/images/pole-eventiel.jpg",
    tags: ["Réception", "Location"],
  },
  {
    id: "btp-renovation-yopougon",
    pole: "btp",
    title: "Rénovation showroom",
    location: "Yopougon, Abidjan",
    year: "2024",
    summary:
      "Réhabilitation intérieure : cloisonnement, finitions et mise aux normes électriques.",
    image: "/images/pole-btp.jpg",
    tags: ["Rénovation", "Finitions"],
  },
];

export function workPoleLabel(pole: WorkPole): string {
  switch (pole) {
    case "evenementiel":
      return "Événementiel";
    case "btp":
      return "BTP";
    default: {
      const _exhaustive: never = pole;
      return _exhaustive;
    }
  }
}
