export type BlogCategory =
  | "residences"
  | "evenementiel"
  | "btp"
  | "entreprise";

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  content: string[];
  category: BlogCategory;
  author: string;
  date: string; // YYYY-MM-DD
  readMinutes: number;
  image: string;
  featured?: boolean;
};

export function blogCategoryLabel(category: BlogCategory): string {
  switch (category) {
    case "residences":
      return "Résidences";
    case "evenementiel":
      return "Événementiel";
    case "btp":
      return "BTP";
    case "entreprise":
      return "Entreprise";
    default: {
      const _exhaustive: never = category;
      return _exhaustive;
    }
  }
}

export function formatBlogDate(date: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "choisir-residence-meublee-abidjan",
    title: "Comment choisir une résidence meublée à Abidjan",
    excerpt:
      "Emplacement, équipements, caution et calendrier de disponibilité : les critères FEBiS pour un séjour serein.",
    content: [
      "À Abidjan, la demande de résidences meublées de qualité ne cesse de croître — que ce soit pour un déplacement professionnel, une transition familiale ou un séjour prolongé.",
      "Chez FEBiS, chaque fiche logement précise le quartier, la capacité, le tarif nuitée et le statut (disponible, réservé, maintenance). Avant de réserver, vérifiez le calendrier et le parcours acompte → check-in → état des lieux.",
      "Nos conseils : privilégiez un logement proche de vos déplacements quotidiens, confirmez la présence d’un générateur et d’un parking sécurisé, et conservez une trace écrite de l’état des lieux à l’arrivée.",
      "La plateforme FEBiS centralise ces informations pour limiter les allers-retours et sécuriser votre séjour dès la demande en ligne.",
    ],
    category: "residences",
    author: "Équipe FEBiS",
    date: "2026-08-12",
    readMinutes: 4,
    image: "/images/blog-residences.jpg",
    featured: true,
  },
  {
    slug: "organiser-evenement-sans-stress",
    title: "Organiser un événement sans stress : checklist matériel",
    excerpt:
      "Mobilier, sono, éclairage, cautions et retours — la méthode FEBiS pour une location maîtrisée.",
    content: [
      "Un événement réussi repose autant sur la scénographie que sur la logistique. Le module Événementiel FEBiS affiche la disponibilité en temps réel et les cautions par article.",
      "Checklist essentielle : valider le nombre de convives, réserver le matériel 7 à 14 jours à l’avance, générer un devis avec dates d’événement et de retour, puis planifier la sortie et le retour.",
      "En cas de dommage, les pénalités sont définies article par article — transparence utile pour le client comme pour l’équipe opérationnelle.",
      "Résultat : moins d’imprévus le jour J, et un suivi clair de chaque mouvement de matériel.",
    ],
    category: "evenementiel",
    author: "Pôle Événementiel",
    date: "2026-07-28",
    readMinutes: 5,
    image: "/images/blog-event.jpg",
    featured: true,
  },
  {
    slug: "suivi-chantier-btp-transparent",
    title: "Suivi de chantier BTP : de la prospection à la livraison",
    excerpt:
      "Comment FEBiS structure les étapes d’un projet : devis, contrat, avancement et réception.",
    content: [
      "Dans le BTP, la confiance se construit sur la lisibilité du parcours. FEBiS accompagne les projets depuis l’opportunité commerciale jusqu’à la livraison finale.",
      "Chaque étape — devis, signature, suivi d’avancement, contrôles qualité — peut être documentée pour le client et pour l’équipe interne.",
      "Sur le terrain, nos récents travaux illustrent des villas, rénovations et immeubles livrés avec reporting régulier.",
      "L’objectif : réduire les zones d’ombre entre le bureau d’études, le chantier et le maître d’ouvrage.",
    ],
    category: "btp",
    author: "Pôle BTP",
    date: "2026-07-05",
    readMinutes: 4,
    image: "/images/blog-btp.jpg",
    featured: true,
  },
  {
    slug: "plateforme-unifiee-febis",
    title: "Pourquoi une plateforme unique pour quatre activités",
    excerpt:
      "Résidences, BTP, événementiel et boutique : une même expérience client et une data partagée.",
    content: [
      "FEBiS n’est pas seulement une vitrine multi-activités : c’est une plateforme qui relie CRM, opérations et parcours client.",
      "Un même contact peut réserver une résidence, louer du matériel événementiel et suivre un projet BTP — sans multiplier les outils.",
      "Cette unification simplifie le reporting directionnel et améliore la réactivité des équipes opérationnelles.",
      "Phase après phase, chaque module CDC s’ajoute au même socle digital.",
    ],
    category: "entreprise",
    author: "Direction FEBiS",
    date: "2026-06-18",
    readMinutes: 3,
    image: "/images/expertise-desk.jpg",
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

export function getFeaturedPosts(limit = 3): BlogPost[] {
  const featured = BLOG_POSTS.filter((post) => post.featured);
  return (featured.length > 0 ? featured : BLOG_POSTS).slice(0, limit);
}
