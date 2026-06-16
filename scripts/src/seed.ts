import bcrypt from "bcryptjs";
import { createDatabase } from "./lib/database.js";
import { ensureSuperAdmin, getDefaultSuperAdmin } from "./lib/super-admin.js";

const { db, pool, schema } = createDatabase();

async function seed() {
  console.log("🌱 Seeding database...");
  const verifiedAt = new Date();

  // ── 1. Users ─────────────────────────────────────────────────────────────
  const agentHash = await bcrypt.hash("agent123", 10);
  const customerHash = await bcrypt.hash("client123", 10);

  await ensureSuperAdmin({ db, schema }, getDefaultSuperAdmin());

  const agentData = [
    { fullName: "Khalid Benali", email: "khalid@locationauto.ma", phone: "+212661000002" },
    { fullName: "Fatima Zahra", email: "fatima@locationauto.ma", phone: "+212661000003" },
    { fullName: "Youssef Alami", email: "youssef@locationauto.ma", phone: "+212661000004" },
  ];

  const agents = [];
  for (const a of agentData) {
    const [user] = await db.insert(schema.usersTable).values({
      ...a, passwordHash: agentHash, role: "AGENT", status: "ACTIVE",
      emailVerifiedAt: verifiedAt,
    }).onConflictDoNothing().returning();
    if (user) {
      const [agent] = await db.insert(schema.agentsTable).values({ userId: user.id, status: "ACTIVE" }).returning();
      agents.push(agent);
    }
  }

  const customerData = [
    { fullName: "Mohammed Chakir", email: "mohammed@example.ma", phone: "+212661100001" },
    { fullName: "Nadia Benjelloun", email: "nadia@example.ma", phone: "+212661100002" },
    { fullName: "Omar Tahiri", email: "omar@example.ma", phone: "+212661100003" },
    { fullName: "Samira Idrissi", email: "samira@example.ma", phone: "+212661100004" },
    { fullName: "Amine Ouali", email: "amine@example.ma", phone: "+212661100005" },
  ];

  const customers = [];
  for (const c of customerData) {
    const [user] = await db.insert(schema.usersTable).values({
      ...c, passwordHash: customerHash, role: "CUSTOMER", status: "ACTIVE",
      emailVerifiedAt: verifiedAt,
    }).onConflictDoNothing().returning();
    if (user) {
      const [customer] = await db.insert(schema.customersTable).values({ userId: user.id, cin: `AB${Math.floor(100000 + Math.random() * 900000)}` }).returning();
      customers.push({ ...customer, user });
    }
  }

  // ── 2. Company Settings ───────────────────────────────────────────────────
  await db.insert(schema.companySettingsTable).values({
    brandName: "Location Auto Maroc",
    slogan: "Louez votre voiture facilement au Maroc",
    phone: "+212522000000",
    whatsapp: "+212661000000",
    email: "contact@locationauto.ma",
    address: "123 Boulevard Mohammed V, Casablanca 20000",
    city: "Casablanca",
    primaryColor: "#B45309",
    secondaryColor: "#0F172A",
    paymentDeadlineHours: 12,
  }).onConflictDoNothing();

  // ── 3. Cars ───────────────────────────────────────────────────────────────
  const carData = [
    {
      brand: "Dacia", model: "Logan", year: 2022, category: "BERLINE" as const, fuelType: "ESSENCE" as const,
      transmission: "MANUELLE" as const, seats: 5, doors: 4, airConditioning: true,
      dailyPrice: "250", weeklyPrice: "1500", monthlyPrice: "5500", depositAmount: "2000",
      city: "Casablanca", licensePlate: "32487-A-1", internalReference: "LOG-01",
      description: "La Dacia Logan est la voiture idéale pour vos déplacements en ville et sur route. Économique, fiable et confortable.",
      status: "AVAILABLE" as const, insuranceIncluded: true,
      mainImageUrl: "https://images.unsplash.com/photo-1550355291-bbee04a2d75d?w=800&q=80",
    },
    {
      brand: "Dacia", model: "Sandero", year: 2023, category: "CITADINE" as const, fuelType: "ESSENCE" as const,
      transmission: "MANUELLE" as const, seats: 5, doors: 4, airConditioning: true,
      dailyPrice: "230", weeklyPrice: "1400", monthlyPrice: "5000", depositAmount: "1500",
      city: "Casablanca", licensePlate: "14823-B-1", internalReference: "SAN-01",
      description: "La Dacia Sandero est une citadine polyvalente, économique et spacieuse. Parfaite pour la ville.",
      status: "AVAILABLE" as const, insuranceIncluded: true,
      mainImageUrl: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80",
    },
    {
      brand: "Renault", model: "Clio", year: 2023, category: "CITADINE" as const, fuelType: "ESSENCE" as const,
      transmission: "MANUELLE" as const, seats: 5, doors: 4, airConditioning: true,
      dailyPrice: "280", weeklyPrice: "1700", monthlyPrice: "6000", depositAmount: "2000",
      city: "Casablanca", licensePlate: "28763-C-1", internalReference: "CLO-01",
      description: "La Renault Clio allie style moderne et efficacité. Un choix populaire pour les touristes.",
      status: "AVAILABLE" as const, insuranceIncluded: true,
      mainImageUrl: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80",
    },
    {
      brand: "Renault", model: "Mégane", year: 2022, category: "BERLINE" as const, fuelType: "DIESEL" as const,
      transmission: "MANUELLE" as const, seats: 5, doors: 4, airConditioning: true,
      dailyPrice: "320", weeklyPrice: "1900", monthlyPrice: "7000", depositAmount: "2500",
      city: "Casablanca", licensePlate: "93741-D-1", internalReference: "MEG-01",
      description: "La Renault Mégane est une berline élégante avec un excellent confort de conduite.",
      status: "AVAILABLE" as const, insuranceIncluded: true,
      mainImageUrl: "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&q=80",
    },
    {
      brand: "Peugeot", model: "208", year: 2023, category: "CITADINE" as const, fuelType: "ESSENCE" as const,
      transmission: "AUTOMATIQUE" as const, seats: 5, doors: 4, airConditioning: true,
      dailyPrice: "300", weeklyPrice: "1800", monthlyPrice: "6500", depositAmount: "2000",
      city: "Casablanca", licensePlate: "48291-E-1", internalReference: "208-01",
      description: "La Peugeot 208 offre un design percutant et une conduite agréable en ville comme sur autoroute.",
      status: "AVAILABLE" as const, insuranceIncluded: false,
      mainImageUrl: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80",
    },
    {
      brand: "Hyundai", model: "i10", year: 2023, category: "CITADINE" as const, fuelType: "ESSENCE" as const,
      transmission: "MANUELLE" as const, seats: 5, doors: 4, airConditioning: true,
      dailyPrice: "200", weeklyPrice: "1200", monthlyPrice: "4500", depositAmount: "1500",
      city: "Casablanca", licensePlate: "17534-F-1", internalReference: "I10-01",
      description: "La Hyundai i10 est une petite citadine économique, idéale pour les courtes distances.",
      status: "AVAILABLE" as const, insuranceIncluded: false,
      mainImageUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80",
    },
    {
      brand: "Hyundai", model: "Tucson", year: 2022, category: "SUV" as const, fuelType: "DIESEL" as const,
      transmission: "AUTOMATIQUE" as const, seats: 5, doors: 4, airConditioning: true,
      dailyPrice: "500", weeklyPrice: "3000", monthlyPrice: "11000", depositAmount: "4000",
      city: "Casablanca", licensePlate: "86452-G-1", internalReference: "TUC-01",
      description: "Le Hyundai Tucson est un SUV robuste et confortable, parfait pour les voyages au Maroc.",
      status: "AVAILABLE" as const, insuranceIncluded: true,
      mainImageUrl: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80",
    },
    {
      brand: "Kia", model: "Picanto", year: 2023, category: "CITADINE" as const, fuelType: "ESSENCE" as const,
      transmission: "MANUELLE" as const, seats: 5, doors: 4, airConditioning: true,
      dailyPrice: "210", weeklyPrice: "1250", monthlyPrice: "4600", depositAmount: "1500",
      city: "Casablanca", licensePlate: "39821-H-1", internalReference: "PIC-01",
      description: "La Kia Picanto est une citadine compacte et économique, très maniable en ville.",
      status: "AVAILABLE" as const, insuranceIncluded: false,
      mainImageUrl: "https://images.unsplash.com/photo-1580274455191-1c62238fa333?w=800&q=80",
    },
    {
      brand: "Volkswagen", model: "Golf", year: 2022, category: "BERLINE" as const, fuelType: "ESSENCE" as const,
      transmission: "AUTOMATIQUE" as const, seats: 5, doors: 4, airConditioning: true,
      dailyPrice: "380", weeklyPrice: "2200", monthlyPrice: "8000", depositAmount: "3000",
      city: "Casablanca", licensePlate: "74612-I-1", internalReference: "GOL-01",
      description: "La Volkswagen Golf est une référence en termes de fiabilité et de confort. Un classique allemand.",
      status: "AVAILABLE" as const, insuranceIncluded: true,
      mainImageUrl: "https://images.unsplash.com/photo-1620891549027-942fdc95d3f5?w=800&q=80",
    },
    {
      brand: "Land Rover", model: "Range Rover Evoque", year: 2022, category: "LUXE" as const, fuelType: "DIESEL" as const,
      transmission: "AUTOMATIQUE" as const, seats: 5, doors: 4, airConditioning: true,
      dailyPrice: "1200", weeklyPrice: "7000", monthlyPrice: "25000", depositAmount: "8000",
      city: "Casablanca", licensePlate: "22184-J-1", internalReference: "EVQ-01",
      description: "Le Range Rover Evoque incarne le luxe à la britannique. Parfait pour les occasions spéciales.",
      status: "AVAILABLE" as const, insuranceIncluded: true,
      mainImageUrl: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&q=80",
    },
  ];

  const insertedCars = [];
  for (const car of carData) {
    const [c] = await db.insert(schema.carsTable).values(car).returning();
    insertedCars.push(c);
  }

  // ── 4. Expenses ───────────────────────────────────────────────────────────
  const expenseTypes = ["ASSURANCE", "VIDANGE", "REPARATION", "TAXE", "PNEUS"] as const;
  for (let i = 0; i < 15; i++) {
    const car = insertedCars[i % insertedCars.length];
    const expType = expenseTypes[i % expenseTypes.length];
    const month = String(Math.floor(Math.random() * 6) + 1).padStart(2, "0");
    await db.insert(schema.carExpensesTable).values({
      carId: car.id,
      type: expType,
      amount: String(Math.floor(500 + Math.random() * 3000)),
      date: `2025-${month}-${String(Math.floor(1 + Math.random() * 28)).padStart(2, "0")}`,
      description: `${expType} pour ${car.brand} ${car.model}`,
    });
  }

  // ── 5. Rental Requests ────────────────────────────────────────────────────
  const statuses: Array<typeof schema.rentalStatusEnum.enumValues[number]> = [
    "PENDING", "CALL_CONFIRMED", "WAITING_AGENCY_PAYMENT", "RESERVED",
    "CAR_DELIVERED", "COMPLETED", "CANCELLED", "ABANDONED", "REJECTED",
  ];

  for (let i = 0; i < 20; i++) {
    const customer = customers[i % customers.length];
    const car = insertedCars[i % insertedCars.length];
    const status = statuses[i % statuses.length];
    const startDay = String((i % 20) + 1).padStart(2, "0");
    const returnDay = String((i % 20) + 4).padStart(2, "0");
    const price = Number(car.dailyPrice) * 3;

    const [rr] = await db.insert(schema.rentalRequestsTable).values({
      customerId: customer?.id,
      carId: car.id,
      fullName: customer?.user?.fullName ?? "Client Test",
      phone: customer?.user?.phone ?? "+212661000000",
      email: customer?.user?.email ?? "test@example.ma",
      startDate: `2025-07-${startDay}`,
      returnDate: `2025-07-${returnDay}`,
      estimatedTotalPrice: String(price),
      finalPrice: status === "COMPLETED" ? String(price) : null,
      status,
      paymentStatus: status === "COMPLETED" || status === "RESERVED" ? "PAID_AT_AGENCY" : "UNPAID",
      paymentDeadline: status === "WAITING_AGENCY_PAYMENT" ? new Date(Date.now() + (i < 5 ? 1 : 12) * 60 * 60 * 1000) : null,
      callConfirmedAt: ["WAITING_AGENCY_PAYMENT", "RESERVED", "CAR_DELIVERED", "COMPLETED"].includes(status) ? new Date() : null,
      paidAtAgencyAt: ["RESERVED", "CAR_DELIVERED", "COMPLETED"].includes(status) ? new Date() : null,
    }).returning();

    if (["RESERVED", "CAR_DELIVERED", "COMPLETED"].includes(status)) {
      await db.insert(schema.carAvailabilityBlocksTable).values({
        carId: rr.carId,
        rentalRequestId: rr.id,
        startDate: rr.startDate,
        endDate: rr.returnDate,
        type: "RESERVED",
        status: "ACTIVE",
      });
    }
  }

  // ── 6. Blog Posts ─────────────────────────────────────────────────────────
  const blogPosts = [
    {
      title: "Les meilleures destinations au Maroc en voiture",
      slug: "meilleures-destinations-maroc-voiture",
      excerpt: "Découvrez les plus beaux endroits du Maroc que vous pouvez explorer en voiture de location.",
      content: `## Explorer le Maroc en liberté\n\nLe Maroc est un pays magnifique qui se prête parfaitement à l'exploration en voiture. Des dunes du Sahara aux plages d'Agadir, en passant par les médinas impériales, chaque kilomètre offre une nouvelle découverte.\n\n## Itinéraire recommandé\n\n1. **Casablanca** — La capitale économique avec son architecture Art Déco\n2. **Marrakech** — La ville rose et ses souks animés\n3. **Ouarzazate** — La porte du désert et ses kasbahs\n4. **Merzouga** — Les dunes de l'Erg Chebbi\n5. **Fès** — La médina médiévale inscrite à l'UNESCO`,
      status: "PUBLISHED" as const,
      coverImage: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=1200&q=80",
      seoTitle: "Meilleures destinations Maroc en voiture 2025",
      seoDescription: "Guide complet pour visiter les plus beaux sites du Maroc en voiture de location.",
    },
    {
      title: "Comment louer une voiture au Maroc : guide complet",
      slug: "comment-louer-voiture-maroc-guide",
      excerpt: "Tout ce que vous devez savoir pour louer une voiture au Maroc en toute sérénité.",
      content: `## Documents nécessaires\n\nPour louer une voiture au Maroc, vous devrez présenter :\n- Une pièce d'identité valide (CIN ou passeport)\n- Un permis de conduire valide\n- Une carte de crédit ou espèces pour la caution\n\n## Nos conseils\n\n1. Réservez à l'avance, surtout en haute saison\n2. Vérifiez l'état du véhicule avant de partir\n3. Gardez vos documents accessibles\n4. Respectez le code de la route marocain`,
      status: "PUBLISHED" as const,
      coverImage: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200&q=80",
      seoTitle: "Guide location voiture Maroc 2025",
      seoDescription: "Guide pratique pour louer une voiture au Maroc : documents, conseils et astuces.",
    },
    {
      title: "Top 5 des voitures les plus louées au Maroc",
      slug: "top-5-voitures-louees-maroc",
      excerpt: "Découvrez les modèles de voitures les plus populaires auprès de nos clients.",
      content: `## Les voitures préférées des Marocains\n\nChaque année, nous analysons les locations pour vous présenter les modèles les plus appréciés.\n\n### 1. Dacia Logan\nÉconomique et fiable, la Logan reste la référence.\n\n### 2. Renault Clio\nModerne et stylée, parfaite pour la ville.\n\n### 3. Hyundai Tucson\nPour les aventuriers qui veulent explorer les pistes.\n\n### 4. Peugeot 208\nConfort et élégance à la française.\n\n### 5. Volkswagen Golf\nLa valeur sûre pour les longs trajets.`,
      status: "PUBLISHED" as const,
      coverImage: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&q=80",
      seoTitle: "Top 5 voitures location Maroc",
      seoDescription: "Les 5 modèles de voitures les plus loués au Maroc selon nos statistiques.",
    },
    {
      title: "Conduire au Maroc : règles et conseils pratiques",
      slug: "conduire-maroc-regles-conseils",
      excerpt: "Guide pratique pour conduire en toute sécurité sur les routes marocaines.",
      content: `## Le code de la route au Maroc\n\nLa conduite au Maroc peut différer de ce à quoi vous êtes habitué. Voici les points essentiels :\n\n- **Vitesse** : 60 km/h en ville, 100 km/h sur route, 120 km/h sur autoroute\n- **Alcool** : Tolérance zéro pour les conducteurs étrangers\n- **Ceinture** : Obligatoire à toutes les places\n- **Téléphone** : Interdit au volant\n\n## Conseils pratiques\n\n1. Méfiez-vous des piétons et des animaux sur les routes rurales\n2. Les ronds-points : la priorité est aux véhicules déjà engagés\n3. Payez toujours les amendes directement aux autorités`,
      status: "PUBLISHED" as const,
      coverImage: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=1200&q=80",
      seoTitle: "Conduire au Maroc : guide et règles 2025",
      seoDescription: "Tout savoir sur le code de la route au Maroc avant de louer une voiture.",
    },
    {
      title: "Marrakech en voiture : les incontournables",
      slug: "marrakech-voiture-incontournables",
      excerpt: "Les sites à ne pas manquer lors de votre séjour à Marrakech avec votre voiture de location.",
      content: `## Marrakech et ses environs\n\nMarrakech est l'une des villes les plus visitées d'Afrique. Avec une voiture de location, vous pouvez explorer bien au-delà de la médina.\n\n### En ville\n- **Jemaa el-Fna** — La place mythique\n- **Jardins Majorelle** — Le bleu de Yves Saint Laurent\n- **Palais de la Bahia** — Un chef-d'œuvre de l'architecture marocaine\n\n### Aux environs\n- **Vallée de l'Ourika** — À 1h de route, des paysages époustouflants\n- **Palmeraie** — Des milliers de palmiers à perte de vue\n- **Ouarzazate** — La porte du désert, à 3h de route`,
      status: "PUBLISHED" as const,
      coverImage: "https://images.unsplash.com/photo-1548813395-bab5e477f878?w=1200&q=80",
      seoTitle: "Marrakech en voiture : guide touristique 2025",
      seoDescription: "Découvrez Marrakech et ses environs en voiture de location avec notre guide complet.",
    },
  ];

  for (const post of blogPosts) {
    await db.insert(schema.blogPostsTable).values(post).onConflictDoNothing();
  }

  console.log("✅ Seeding complete!");
  console.log("\n🔑 Login credentials:");
  console.log("  Super admin: admin@demo.com / demo-admin@$ (MFA disabled)");
  console.log("  Agent:  khalid@locationauto.ma / agent123");
  console.log("  Client: mohammed@example.ma / client123");
  await pool.end();
}

seed().catch(err => {
  console.error("Seed error:", err);
  process.exit(1);
});
