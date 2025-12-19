import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

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
            slots: {
              include: {
                user: true,
              },
            },
            instance: {
              include: {
                users: {
                  where: {
                    id: session.user.id,
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

    // Vérifier que l'utilisateur est propriétaire du repas
    const userSlot = mealIngredient.meal.slots.find(
      (slot) => slot.userId === session.user.id
    );

    if (!userSlot) {
      return NextResponse.json(
        {
          error:
            "Vous devez être propriétaire de ce repas pour supprimer des ingrédients",
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
