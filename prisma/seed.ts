import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const ingredients = [
  "Tomate",
  "Oignon",
  "Ail",
  "Carotte",
  "Pomme de terre",
  "Courgette",
  "Aubergine",
  "Poivron",
  "Champignon",
  "Épinard",
  "Salade",
  "Concombre",
  "Brocoli",
  "Chou-fleur",
  "Céleri",
  "Poireau",
  "Basilic",
  "Persil",
  "Coriandre",
  "Thym",
  "Romarin",
  "Laurier",
  "Huile d'olive",
  "Beurre",
  "Crème fraîche",
  "Lait",
  "Fromage",
  "Œuf",
  "Poulet",
  "Bœuf",
  "Porc",
  "Saumon",
  "Thon",
  "Crevette",
  "Riz",
  "Pâtes",
  "Pain",
  "Farine",
  "Sucre",
  "Sel",
  "Poivre",
  "Vinaigre",
  "Citron",
  "Moutarde",
  "Pâte de curry",
  "Miel",
  "Yaourt",
  "Pomme",
  "Banane",
  "Fraise",
  "Chocolat",
];

// Fonction pour assigner une catégorie à un ingrédient
function getIngredientCategory(ingredientName: string): string {
  const name = ingredientName.toLowerCase().trim();

  // Fruits et légumes
  const fruitsEtLegumes = [
    "tomate",
    "oignon",
    "carotte",
    "pomme de terre",
    "courgette",
    "aubergine",
    "poivron",
    "champignon",
    "épinard",
    "salade",
    "concombre",
    "brocoli",
    "chou-fleur",
    "céleri",
    "poireau",
    "pomme",
    "banane",
    "fraise",
    "citron",
  ];

  // Herbes et aromates
  const herbesEtAromates = [
    "basilic",
    "persil",
    "coriandre",
    "thym",
    "romarin",
    "laurier",
    "ail",
  ];

  // Épices
  const epices = ["sel", "poivre", "moutarde", "pâte de curry"];

  // Produits laitiers
  const produitsLaitiers = [
    "beurre",
    "crème fraîche",
    "lait",
    "fromage",
    "yaourt",
  ];

  // Viandes et poissons
  const viandesEtPoissons = [
    "poulet",
    "bœuf",
    "porc",
    "saumon",
    "thon",
    "crevette",
  ];

  // Féculents
  const feculents = ["riz", "pâtes", "pain", "farine"];

  // Autres
  const autres = ["huile d'olive", "vinaigre", "sucre", "miel", "chocolat"];

  if (fruitsEtLegumes.includes(name)) return "fruit et légumes";
  if (herbesEtAromates.includes(name)) return "herbes et aromates";
  if (epices.includes(name)) return "épice";
  if (produitsLaitiers.includes(name)) return "produits laitiers";
  if (viandesEtPoissons.includes(name)) return "viande et poisson";
  if (feculents.includes(name)) return "féculent";
  if (autres.includes(name)) return "autre";

  // Par défaut
  return "autre";
}

async function main() {
  console.log("🌱 Début du seed...");

  // Créer ou récupérer une instance globale pour les ingrédients approuvés
  let globalInstance = await prisma.instance.findFirst({
    where: {
      name: "Global Ingredients",
    },
    include: {
      users: true,
    },
  });

  if (!globalInstance) {
    // Créer un utilisateur système pour l'instance globale
    const systemUser = await prisma.user.upsert({
      where: { email: "system@tricook.local" },
      update: {},
      create: {
        email: "system@tricook.local",
        password: "system", // Mot de passe factice, ne sera jamais utilisé
      },
    });

    globalInstance = await prisma.instance.create({
      data: {
        name: "Global Ingredients",
        joinToken: "global-ingredients-seed",
        users: {
          connect: { id: systemUser.id },
        },
      },
      include: {
        users: true,
      },
    });
    console.log("✅ Instance globale créée");
  }

  // Créer les ingrédients
  for (const ingredientName of ingredients) {
    const normalizedName = ingredientName.toLowerCase().trim();
    const category = getIngredientCategory(ingredientName);

    await prisma.ingredient.upsert({
      where: {
        name_instanceId: {
          name: normalizedName,
          instanceId: globalInstance.id,
        },
      },
      update: {
        status: "approved",
        category: category,
      },
      create: {
        name: normalizedName,
        category: category,
        instanceId: globalInstance.id,
        status: "approved",
        createdById: globalInstance.users?.[0]?.id || null,
      },
    });
  }

  console.log(`✅ ${ingredients.length} ingrédients créés/mis à jour`);
  console.log("✨ Seed terminé !");
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
