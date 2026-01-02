import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { quantity, unit } = await request.json();

    if (!quantity || !unit) {
      return NextResponse.json(
        { error: "La quantité et l'unité sont requises" },
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

    // Récupérer l'ingrédient du repas
    const mealIngredient = await db.mealIngredient.findUnique({
      where: { id },
      include: {
        meal: {
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
        },
      },
    });

    if (!mealIngredient) {
      return NextResponse.json(
        { error: "Ingrédient non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur a accès à l'instance
    if (mealIngredient.meal.instance.users.length === 0) {
      return NextResponse.json(
        { error: "Vous n'avez pas accès à cette instance" },
        { status: 403 }
      );
    }

    // Vérifier que l'utilisateur a un slot dans l'instance
    if (mealIngredient.meal.instance.slots.length === 0) {
      return NextResponse.json(
        {
          error:
            "Vous devez avoir un slot dans cette instance pour modifier des ingrédients",
        },
        { status: 403 }
      );
    }

    // Mettre à jour l'ingrédient du repas
    const updatedMealIngredient = await db.mealIngredient.update({
      where: { id },
      data: {
        quantity: quantityNum,
        unit,
      },
      include: {
        ingredient: true,
      },
    });

    return NextResponse.json(updatedMealIngredient, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'ingrédient:", error);
    return NextResponse.json(
      {
        error: "Une erreur est survenue lors de la mise à jour de l'ingrédient",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer l'ingrédient du repas
    const mealIngredient = await db.mealIngredient.findUnique({
      where: { id },
      include: {
        meal: {
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
        },
      },
    });

    if (!mealIngredient) {
      return NextResponse.json(
        { error: "Ingrédient non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur a accès à l'instance
    if (mealIngredient.meal.instance.users.length === 0) {
      return NextResponse.json(
        { error: "Vous n'avez pas accès à cette instance" },
        { status: 403 }
      );
    }

    // Vérifier que l'utilisateur a un slot dans l'instance
    if (mealIngredient.meal.instance.slots.length === 0) {
      return NextResponse.json(
        {
          error:
            "Vous devez avoir un slot dans cette instance pour supprimer des ingrédients",
        },
        { status: 403 }
      );
    }

    // Supprimer l'ingrédient du repas
    await db.mealIngredient.delete({
      where: { id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'ingrédient:", error);
    return NextResponse.json(
      {
        error: "Une erreur est survenue lors de la suppression de l'ingrédient",
      },
      { status: 500 }
    );
  }
}
