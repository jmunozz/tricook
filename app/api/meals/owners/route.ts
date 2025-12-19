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

    const { mealId, slotId } = await request.json();

    if (!mealId || !slotId) {
      return NextResponse.json(
        { error: "mealId et slotId sont requis" },
        { status: 400 }
      );
    }

    // Vérifier que le repas existe et que l'utilisateur est propriétaire
    const meal = await db.meal.findUnique({
      where: { id: mealId },
      include: {
        slots: {
          include: {
            user: true,
          },
        },
        instance: true,
      },
    });

    if (!meal) {
      return NextResponse.json({ error: "Repas non trouvé" }, { status: 404 });
    }

    // Vérifier que l'utilisateur est propriétaire du repas
    const userSlot = meal.slots.find((slot) => slot.userId === session.user.id);
    if (!userSlot) {
      return NextResponse.json(
        {
          error:
            "Vous devez être propriétaire de ce repas pour ajouter des propriétaires",
        },
        { status: 403 }
      );
    }

    // Vérifier que le slot existe et appartient à la même instance
    const slot = await db.slot.findUnique({
      where: { id: slotId },
    });

    if (!slot || slot.instanceId !== meal.instanceId) {
      return NextResponse.json(
        { error: "Slot invalide ou n'appartient pas à la même instance" },
        { status: 400 }
      );
    }

    // Vérifier que le slot n'est pas déjà assigné au repas
    const isAlreadyAssigned = meal.slots.some((s) => s.id === slotId);
    if (isAlreadyAssigned) {
      return NextResponse.json(
        { error: "Ce slot est déjà assigné à ce repas" },
        { status: 400 }
      );
    }

    // Ajouter le slot au repas
    await db.meal.update({
      where: { id: mealId },
      data: {
        slots: {
          connect: { id: slotId },
        },
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de l'ajout du propriétaire:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'ajout du propriétaire" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mealId = searchParams.get("mealId");

    if (!mealId) {
      return NextResponse.json({ error: "mealId est requis" }, { status: 400 });
    }

    // Vérifier que le repas existe
    const meal = await db.meal.findUnique({
      where: { id: mealId },
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

    // Trouver le slot de l'utilisateur dans les propriétaires du repas
    const userSlot = meal.slots.find((slot) => slot.userId === session.user.id);

    if (!userSlot) {
      return NextResponse.json(
        { error: "Vous n'êtes pas propriétaire de ce repas" },
        { status: 403 }
      );
    }

    // Si c'est le dernier propriétaire, supprimer le repas
    if (meal.slots.length === 1) {
      await db.meal.delete({
        where: { id: mealId },
      });

      return NextResponse.json(
        { success: true, deleted: true },
        { status: 200 }
      );
    }

    // Sinon, retirer le slot du repas
    await db.meal.update({
      where: { id: mealId },
      data: {
        slots: {
          disconnect: { id: userSlot.id },
        },
      },
    });

    return NextResponse.json(
      { success: true, deleted: false },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors du retrait du propriétaire:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors du retrait du propriétaire" },
      { status: 500 }
    );
  }
}
