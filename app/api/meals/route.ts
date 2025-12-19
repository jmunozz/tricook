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

    const { name, type, date, instanceId, slotIds } = await request.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Le nom du repas est requis" },
        { status: 400 }
      );
    }

    if (!["breakfast", "lunch", "dinner"].includes(type)) {
      return NextResponse.json(
        { error: "Le type de repas est invalide" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur a accès à cette instance
    const instance = await db.instance.findUnique({
      where: { id: instanceId },
      include: {
        users: {
          where: {
            id: session.user.id,
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

    // Préparer la liste des slots à assigner (slot de l'utilisateur + slots sélectionnés)
    const slotsToConnect: string[] = [userSlot.id];

    // Ajouter les slots sélectionnés s'ils existent et ne sont pas déjà dans la liste
    if (slotIds && slotIds.length > 0) {
      const selectedSlots = await db.slot.findMany({
        where: {
          id: { in: slotIds },
          instanceId,
        },
      });

      if (selectedSlots.length !== slotIds.length) {
        return NextResponse.json(
          { error: "Un ou plusieurs slots sont invalides" },
          { status: 400 }
        );
      }

      // Ajouter les slots sélectionnés qui ne sont pas déjà le slot de l'utilisateur
      selectedSlots.forEach((slot) => {
        if (slot.id !== userSlot.id && !slotsToConnect.includes(slot.id)) {
          slotsToConnect.push(slot.id);
        }
      });
    }

    const meal = await db.meal.create({
      data: {
        name: name.trim(),
        type,
        date: date ? new Date(date) : null,
        instanceId,
        slots: {
          connect: slotsToConnect.map((id) => ({ id })),
        },
      },
      include: {
        slots: true,
      },
    });

    return NextResponse.json(meal, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création du repas:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la création du repas" },
      { status: 500 }
    );
  }
}
