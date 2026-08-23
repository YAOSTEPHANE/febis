import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/febis";
const dbName = process.env.MONGODB_DB ?? "febis";

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const now = new Date();

  const passwordHash = await bcrypt.hash("FebisAdmin2026!", 12);

  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("clients").createIndex({ email: 1 }, { unique: true, sparse: true });
  await db.collection("lodgings").createIndex({ slug: 1 }, { unique: true });
  await db.collection("contacts").createIndex({ createdAt: -1 });
  await db.collection("reservations").createIndex({ lodgingSlug: 1, checkIn: 1 });
  await db.collection("reservations").createIndex({ createdAt: -1 });

  await db.collection("users").updateOne(
    { email: "admin@febis.ci" },
    {
      $set: {
        email: "admin@febis.ci",
        passwordHash,
        name: "Administrateur FEBiS",
        role: "admin",
        active: true,
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  );

  const lodgings = [
    {
      title: "Résidence Cocody Premium",
      slug: "cocody-premium",
      description:
        "Appartement meublé haut de gamme à Cocody — idéal court et moyen séjour.",
      longDescription:
        "Un écrin contemporain au cœur de Cocody : volumes généreux, matériaux nobles et services d’accueil FEBiS. Parfait pour dirigeants, familles et séjours d’affaires exigeants.",
      photos: [
        "/images/pole-residences.jpg",
        "/images/residence-bedroom.jpg",
        "/images/residence-terrace.jpg",
      ],
      pricePerNight: 45000,
      depositPercent: 30,
      currency: "XOF",
      status: "disponible",
      capacity: 4,
      bedrooms: 2,
      bathrooms: 2,
      location: "Cocody, Abidjan",
      neighborhood: "Cocody",
      category: "appartement",
      amenities: ["Wi-Fi", "Climatisation", "Cuisine équipée", "Parking", "Linge"],
      highlights: ["Vue jardin", "Check-in flexible", "Conciergerie"],
    },
    {
      title: "Studio Plateau Affaires",
      slug: "plateau-affaires",
      description:
        "Studio fonctionnel au Plateau pour déplacements professionnels.",
      longDescription:
        "Studio design face aux axes du Plateau : connexion fibre, coin bureau et lit premium. Une base discrète et efficace pour vos missions en ville.",
      photos: [
        "/images/residence-bedroom.jpg",
        "/images/pole-residences.jpg",
        "/images/residence-terrace.jpg",
      ],
      pricePerNight: 28000,
      depositPercent: 30,
      currency: "XOF",
      status: "disponible",
      capacity: 2,
      bedrooms: 1,
      bathrooms: 1,
      location: "Plateau, Abidjan",
      neighborhood: "Plateau",
      category: "studio",
      amenities: ["Wi-Fi", "Climatisation", "Bureau", "Smart TV"],
      highlights: ["Centre-ville", "Idéal business"],
    },
    {
      title: "Villa Riviera Famille",
      slug: "riviera-famille",
      description:
        "Villa spacieuse à Riviera pour familles et séjours prolongés.",
      longDescription:
        "Villa familiale avec jardin et générateur : l’équilibre parfait entre intimité et confort premium pour les longues escales à Riviera.",
      photos: [
        "/images/residence-terrace.jpg",
        "/images/pole-residences.jpg",
        "/images/residence-bedroom.jpg",
      ],
      pricePerNight: 85000,
      depositPercent: 40,
      currency: "XOF",
      status: "maintenance",
      capacity: 8,
      bedrooms: 4,
      bathrooms: 3,
      location: "Riviera, Abidjan",
      neighborhood: "Riviera",
      category: "villa",
      amenities: ["Wi-Fi", "Jardin", "Générateur", "Sécurité", "Cuisine"],
      highlights: ["Grand salon", "Espace enfants"],
    },
    {
      title: "Suite Executive Marcory",
      slug: "suite-marcory",
      description:
        "Suite premium à Marcory pour séjours business avec salon privé.",
      longDescription:
        "Suite exécutive avec salon séparé, dressing et service conciergerie — conçue pour les séjours professionnels exigeants.",
      photos: [
        "/images/residence-bedroom.jpg",
        "/images/residence-terrace.jpg",
        "/images/pole-residences.jpg",
      ],
      pricePerNight: 62000,
      depositPercent: 35,
      currency: "XOF",
      status: "disponible",
      capacity: 3,
      bedrooms: 1,
      bathrooms: 1,
      location: "Marcory, Abidjan",
      neighborhood: "Marcory",
      category: "suite",
      amenities: ["Wi-Fi", "Climatisation", "Salon", "Parking", "Service"],
      highlights: ["Salon privé", "Idéal cadres"],
    },
  ];

  for (const lodging of lodgings) {
    await db.collection("lodgings").updateOne(
      { slug: lodging.slug },
      {
        $set: { ...lodging, updatedAt: now },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );
  }

  await db.collection("equipment").createIndex({ slug: 1 }, { unique: true });
  await db.collection("eventQuotes").createIndex({ createdAt: -1 });

  const equipment = [
    {
      name: "Chaises Chiavari or",
      slug: "chaises-chiavari-or",
      category: "mobilier",
      description: "Lot de chaises premium pour cérémonies et réceptions.",
      photo: "/images/event-materiel.jpg",
      pricePerDay: 1500,
      depositAmount: 5000,
      currency: "XOF",
      quantityTotal: 200,
      quantityAvailable: 168,
      status: "disponible",
      penaltyPerDamage: 12000,
    },
    {
      name: "Sono pack 1000W",
      slug: "sono-pack-1000w",
      category: "sonorisation",
      description: "Système amplifié avec micros HF pour soirées et conférences.",
      photo: "/images/pole-eventiel.jpg",
      pricePerDay: 45000,
      depositAmount: 150000,
      currency: "XOF",
      quantityTotal: 8,
      quantityAvailable: 5,
      status: "disponible",
      penaltyPerDamage: 80000,
    },
    {
      name: "Projecteurs LED ambiance",
      slug: "projecteurs-led-ambiance",
      category: "eclairage",
      description: "Éclairage scénique RGB pilotable pour mise en lumière.",
      photo: "/images/event-materiel.jpg",
      pricePerDay: 18000,
      depositAmount: 40000,
      currency: "XOF",
      quantityTotal: 24,
      quantityAvailable: 0,
      status: "loue",
      penaltyPerDamage: 35000,
    },
    {
      name: "Arche florale premium",
      slug: "arche-florale-premium",
      category: "decoration",
      description: "Structure décorative pour entrées et photo booth.",
      photo: "/images/pole-eventiel.jpg",
      pricePerDay: 75000,
      depositAmount: 100000,
      currency: "XOF",
      quantityTotal: 4,
      quantityAvailable: 2,
      status: "disponible",
      penaltyPerDamage: 90000,
    },
    {
      name: "Service vaisselle cristal",
      slug: "vaisselle-cristal",
      category: "vaisselle",
      description: "Assiettes, verres et couverts pour 50 convives.",
      photo: "/images/event-materiel.jpg",
      pricePerDay: 35000,
      depositAmount: 80000,
      currency: "XOF",
      quantityTotal: 12,
      quantityAvailable: 9,
      status: "disponible",
      penaltyPerDamage: 25000,
    },
    {
      name: "Tente stretch 10x15",
      slug: "tente-stretch-10x15",
      category: "mobilier",
      description: "Couverture événementielle élégante pour extérieur.",
      photo: "/images/pole-eventiel.jpg",
      pricePerDay: 120000,
      depositAmount: 250000,
      currency: "XOF",
      quantityTotal: 3,
      quantityAvailable: 1,
      status: "maintenance",
      penaltyPerDamage: 200000,
    },
  ];

  for (const item of equipment) {
    await db.collection("equipment").updateOne(
      { slug: item.slug },
      {
        $set: { ...item, updatedAt: now },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );
  }

  await db.collection("homepage").createIndex({ key: 1 }, { unique: true });
  await db.collection("blogPosts").createIndex({ slug: 1 }, { unique: true });
  await db.collection("testimonials").createIndex({ id: 1 }, { unique: true });
  await db.collection("travaux").createIndex({ id: 1 }, { unique: true });

  console.log("Seed OK — lancez aussi « Seed contenu accueil » dans /admin/dashboard");
  console.log("Admin: admin@febis.ci / FebisAdmin2026!");
  console.log(`DB: ${dbName} @ ${uri}`);
  await client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
