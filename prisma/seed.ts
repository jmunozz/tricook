import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { INGREDIENT_CATEGORIES } from "../lib/constants";
import ingredientsData from "./ingredients.json";

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

type IngredientData = {
  name: string;
  category: string;
  defaultUnit: string | null;
};

const ingredients = ingredientsData as IngredientData[];

// Validate that all categories in the JSON file are valid
function validateCategories() {
  const validCategories = new Set(INGREDIENT_CATEGORIES);
  const invalidIngredients: string[] = [];

  for (const ingredient of ingredients) {
    if (
      ingredient.category &&
      !validCategories.has(ingredient.category as any)
    ) {
      invalidIngredients.push(
        `${ingredient.name}: "${ingredient.category}" is not a valid category`
      );
    }
  }

  if (invalidIngredients.length > 0) {
    throw new Error(
      `Invalid categories found:\n${invalidIngredients.join("\n")}`
    );
  }
}

async function main() {
  console.log("🌱 Début du seed...");

  // Validate categories before proceeding
  validateCategories();
  console.log("✅ Catégories validées");

  // Créer ou récupérer une instance globale (shadow) pour les ingrédients approuvés
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
    console.log("✅ Instance globale (shadow) créée");
  } else {
    console.log("✅ Instance globale (shadow) trouvée");
  }

  // Créer ou mettre à jour les ingrédients
  for (const ingredientData of ingredients) {
    const normalizedName = ingredientData.name.toLowerCase().trim();
    const category = ingredientData.category || null;
    const defaultUnit = ingredientData.defaultUnit || null;

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
        defaultUnit: defaultUnit,
      },
      create: {
        name: normalizedName,
        category: category,
        defaultUnit: defaultUnit,
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
