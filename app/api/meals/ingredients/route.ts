import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { mealId, ingredientId, quantity, unit } = await request.json();

    if (!mealId || !ingredientId || !quantity || !unit) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 }
      );
    }

    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      return NextResponse.json(
        { error: "La quantité doit être un nombre positif" },
        { status: 400 }
      );
    }

    // Vérifier que le repas existe
    const meal = await db.meal.findUnique({
      where: { id: mealId },
      include: {
        instance: {
          include: {
            users: {
              where: {
                id: session.user.id,
              },
            },
            slots: {
              where: {
                userId: session.user.id,
              },
            },
          },
        },
      },
    });

    if (!meal) {
      return NextResponse.json({ error: "Repas non trouvé" }, { status: 404 });
    }

    // Vérifier que l'utilisateur a accès à l'instance
    if (meal.instance.users.length === 0) {
      return NextResponse.json(
        { error: "Vous n'avez pas accès à cette instance" },
        { status: 403 }
      );
    }

    // Vérifier que l'utilisateur a un slot dans l'instance
    if (meal.instance.slots.length === 0) {
      return NextResponse.json(
        {
          error:
            "Vous devez avoir un slot dans cette instance pour ajouter des ingrédients",
        },
        { status: 403 }
      );
    }

    // Vérifier que l'ingrédient existe
    const ingredient = await db.ingredient.findUnique({
      where: { id: ingredientId },
    });

    if (!ingredient) {
      return NextResponse.json(
        { error: "Ingrédient non trouvé" },
        { status: 404 }
      );
    }

    // Créer l'ingrédient du repas
    const mealIngredient = await db.mealIngredient.create({
      data: {
        mealId,
        ingredientId,
        quantity: quantityNum,
        unit,
      },
      include: {
        ingredient: true,
      },
    });

    return NextResponse.json(mealIngredient, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'ingrédient:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'ajout de l'ingrédient" },
      { status: 500 }
    );
  }
}
