import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer l'instance globale pour les ingrédients approuvés
    const globalInstance = await db.instance.findFirst({
      where: {
        name: "Global Ingredients",
      },
    });

    const ingredientInstances = [];
    if (globalInstance) {
      ingredientInstances.push(globalInstance.id);
    }

    // Récupérer tous les ingrédients approuvés (globaux uniquement pour l'instant)
    const ingredients = await db.ingredient.findMany({
      where: {
        instanceId: { in: ingredientInstances },
        status: "approved",
      },
      select: {
        id: true,
        name: true,
        category: true,
        defaultUnit: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ ingredients }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la récupération des ingrédients:", error);
    return NextResponse.json(
      {
        error:
          "Une erreur est survenue lors de la récupération des ingrédients",
      },
      { status: 500 }
    );
  }
}
