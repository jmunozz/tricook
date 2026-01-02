import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

/**
 * Convertit les unités de volume en grammes
 * Assumption: 1L = 1000g (densité de l'eau)
 */
function convertToGrams(
  quantity: number,
  unit: string
): { quantity: number; unit: string } {
  const normalizedUnit = unit.trim().toLowerCase();

  // Unités de volume à convertir en grammes
  if (
    normalizedUnit === "l" ||
    normalizedUnit === "litre" ||
    normalizedUnit === "litres"
  ) {
    return { quantity: quantity * 1000, unit: "g" };
  }
  if (
    normalizedUnit === "ml" ||
    normalizedUnit === "millilitre" ||
    normalizedUnit === "millilitres"
  ) {
    return { quantity: quantity, unit: "g" }; // 1ml = 1g (eau)
  }
  if (
    normalizedUnit === "cl" ||
    normalizedUnit === "centilitre" ||
    normalizedUnit === "centilitres"
  ) {
    return { quantity: quantity * 10, unit: "g" }; // 1cl = 10ml = 10g
  }

  // Si ce n'est pas une unité de volume, retourner tel quel
  return { quantity, unit };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier que l'utilisateur a accès à cette instance
    const instance = await db.instance.findUnique({
      where: { id },
      include: {
        users: {
          where: {
            id: session.user.id,
          },
        },
        meals: {
          include: {
            mealIngredients: {
              include: {
                ingredient: true,
              },
            },
          },
        },
      },
    });

    if (!instance || instance.users.length === 0) {
      return NextResponse.json(
        { error: "Instance non trouvée ou accès refusé" },
        { status: 404 }
      );
    }

    // Collecter les noms des repas impliqués
    const mealNames = instance.meals.map((meal) => meal.name).filter(Boolean);
    const uniqueMealNames = Array.from(new Set(mealNames));

    // Agréger les ingrédients par nom et unité (même ingrédient + même unité = addition des quantités)
    const ingredientsMap = new Map<
      string,
      { quantity: number; unit: string; category: string }
    >();

    instance.meals.forEach((meal) => {
      meal.mealIngredients.forEach((mi) => {
        // Convertir les unités de volume en grammes
        const { quantity: convertedQuantity, unit: convertedUnit } =
          convertToGrams(mi.quantity, mi.unit);

        // Normaliser le nom de l'ingrédient et l'unité pour créer une clé unique
        const normalizedName = mi.ingredient.name.toLowerCase().trim();
        const normalizedUnit = convertedUnit.trim();
        const key = `${normalizedName}_${normalizedUnit}`;

        const existing = ingredientsMap.get(key);

        if (existing) {
          // Si l'ingrédient existe déjà avec la même unité, additionner les quantités
          existing.quantity += convertedQuantity;
        } else {
          // Sinon, créer une nouvelle entrée
          ingredientsMap.set(key, {
            quantity: convertedQuantity,
            unit: normalizedUnit,
            category: mi.ingredient.category || "autre",
          });
        }
      });
    });

    // Générer le texte de la liste de courses
    const lines: string[] = [];
    lines.push(`LISTE DE COURSES - ${instance.name}`);
    lines.push(`Générée le ${new Date().toLocaleDateString("fr-FR")}`);
    lines.push("");

    // Ajouter le résumé des repas impliqués
    if (uniqueMealNames.length > 0) {
      lines.push("REPAS INCLUS:");
      uniqueMealNames.forEach((mealName) => {
        lines.push(`  - ${mealName}`);
      });
      lines.push("");
    }

    // Grouper les ingrédients par catégorie
    const ingredientsByCategory = new Map<
      string,
      Array<{ name: string; quantity: number; unit: string }>
    >();

    ingredientsMap.forEach(({ quantity, unit, category }, key) => {
      const ingredientName = key.split("_")[0];
      if (!ingredientsByCategory.has(category)) {
        ingredientsByCategory.set(category, []);
      }
      ingredientsByCategory.get(category)!.push({
        name: ingredientName,
        quantity,
        unit,
      });
    });

    // Trier les catégories par ordre alphabétique
    const sortedCategories = Array.from(ingredientsByCategory.entries()).sort(
      (a, b) => a[0].localeCompare(b[0])
    );

    // Afficher les ingrédients par catégorie
    sortedCategories.forEach(([category, items]) => {
      lines.push(`${category.toUpperCase()}:`);
      // Trier les ingrédients dans chaque catégorie par nom
      items.sort((a, b) => a.name.localeCompare(b.name));
      items.forEach(({ name, quantity, unit }) => {
        lines.push(`  - ${quantity} ${unit} de ${name}`);
      });
      lines.push("");
    });

    if (sortedCategories.length === 0) {
      lines.push("Aucun ingrédient à acheter.");
    }

    const totalIngredients = Array.from(ingredientsMap.keys()).length;
    lines.push(
      `Total : ${totalIngredients} ingrédient${totalIngredients > 1 ? "s" : ""}`
    );

    const text = lines.join("\n");

    return new NextResponse(text, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="liste-de-courses-${
          instance.name
        }-${new Date().toISOString().split("T")[0]}.txt"`,
      },
    });
  } catch (error) {
    console.error("Erreur lors de l'export de la liste de courses:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'export" },
      { status: 500 }
    );
  }
}
