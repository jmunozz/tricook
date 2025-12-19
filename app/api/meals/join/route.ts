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

    const { mealId, instanceId } = await request.json();

    if (!mealId || !instanceId) {
      return NextResponse.json(
        { error: "mealId et instanceId sont requis" },
        { status: 400 }
      );
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

    // Vérifier que l'utilisateur n'est pas déjà propriétaire
    const isAlreadyOwner = meal.slots.some(
      (slot) => slot.userId === session.user.id
    );
    if (isAlreadyOwner) {
      return NextResponse.json(
        { error: "Vous êtes déjà propriétaire de ce repas" },
        { status: 400 }
      );
    }

    // Trouver ou créer le slot de l'utilisateur dans l'instance
    let userSlot = await db.slot.findFirst({
      where: {
        instanceId,
        userId: session.user.id,
      },
    });

    // Si l'utilisateur n'a pas de slot, en créer un
    if (!userSlot) {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { email: true },
      });

      userSlot = await db.slot.create({
        data: {
          name: user?.email || "Membre",
          instanceId,
          userId: session.user.id,
        },
      });
    }

    // Ajouter le slot au repas
    await db.meal.update({
      where: { id: mealId },
      data: {
        slots: {
          connect: { id: userSlot.id },
        },
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la jointure au repas:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la jointure au repas" },
      { status: 500 }
    );
  }
}
