import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id: mealId } = await params;
    const { name, type, date } = await request.json();

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
            "Vous devez avoir un slot dans cette instance pour modifier un repas",
        },
        { status: 403 }
      );
    }

    // Préparer les données à mettre à jour
    const updateData: {
      name?: string;
      type?: "breakfast" | "lunch" | "dinner";
      date?: Date | null;
    } = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
          { error: "Le nom du repas est requis" },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (type !== undefined) {
      if (!["breakfast", "lunch", "dinner"].includes(type)) {
        return NextResponse.json(
          { error: "Le type de repas est invalide" },
          { status: 400 }
        );
      }
      updateData.type = type;
    }

    if (date !== undefined) {
      updateData.date = date ? new Date(date) : null;
    }

    // Mettre à jour le repas
    const updatedMeal = await db.meal.update({
      where: { id: mealId },
      data: updateData,
    });

    return NextResponse.json(updatedMeal, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du repas:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la mise à jour du repas" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id: mealId } = await params;

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
            "Vous devez avoir un slot dans cette instance pour supprimer un repas",
        },
        { status: 403 }
      );
    }

    // Supprimer le repas
    await db.meal.delete({
      where: { id: mealId },
    });

    return NextResponse.json(
      { success: true, instanceId: meal.instanceId },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la suppression du repas:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la suppression du repas" },
      { status: 500 }
    );
  }
}
