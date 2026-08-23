import type { Activity } from "@/lib/types";

export type Testimonial = {
  id: string;
  quote: string;
  name: string;
  role: string;
  activity: Activity;
  rating: 4 | 5;
};

export function testimonialActivityLabel(activity: Activity): string {
  switch (activity) {
    case "residences":
      return "Résidences";
    case "btp":
      return "BTP";
    case "evenementiel":
      return "Événementiel";
    case "boutique":
      return "Boutique";
    default: {
      const _exhaustive: never = activity;
      return _exhaustive;
    }
  }
}

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "t1",
    quote:
      "Réservation fluide, logement conforme aux photos et check-out sans friction. FEBiS a vraiment professionnalisé le séjour meublé.",
    name: "Aïcha K.",
    role: "Cadre, Marcory",
    activity: "residences",
    rating: 5,
  },
  {
    id: "t2",
    quote:
      "Pour notre mariage, le devis matériel et le suivi des retours nous ont évité bien des stress. Équipe réactive, matériel impeccable.",
    name: "Jean-Marc & Sarah",
    role: "Mariés, Cocody",
    activity: "evenementiel",
    rating: 5,
  },
  {
    id: "t3",
    quote:
      "Le suivi d’avancement de notre villa était clair à chaque étape. On savait où en était le chantier, sans mauvaise surprise.",
    name: "Olivier D.",
    role: "Maître d’ouvrage, Angré",
    activity: "btp",
    rating: 5,
  },
  {
    id: "t4",
    quote:
      "Commande boutique reçue rapidement, variantes bien gérées. Une expérience e-commerce digne d’une vraie enseigne.",
    name: "Fatou B.",
    role: "Cliente, Plateau",
    activity: "boutique",
    rating: 4,
  },
  {
    id: "t5",
    quote:
      "Nous louons régulièrement la sono FEBiS pour nos soirées corporate. Disponibilité live et cautions transparentes : top.",
    name: "Agence Horizon",
    role: "Event planner",
    activity: "evenementiel",
    rating: 5,
  },
  {
    id: "t6",
    quote:
      "Studio bien situé, communication claire sur l’acompte. Je recommande FEBiS pour les déplacements professionnels.",
    name: "Karim T.",
    role: "Consultant",
    activity: "residences",
    rating: 4,
  },
];
