import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { mealId, slotIds } = await request.json();

    if (!mealId || !Array.isArray(slotIds)) {
      return NextResponse.json(
        { error: "mealId et slotIds (array) sont requis" },
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
            "Vous devez avoir un slot dans cette instance pour modifier les propriétaires",
        },
        { status: 403 }
      );
    }

    // Récupérer tous les slots de l'instance pour validation
    const allSlots = await db.slot.findMany({
      where: {
        instanceId: meal.instanceId,
      },
    });

    // Vérifier que tous les slots appartiennent à la même instance
    const allSlotIds = new Set(allSlots.map((s) => s.id));
    const invalidSlots = slotIds.filter((id: string) => !allSlotIds.has(id));
    if (invalidSlots.length > 0) {
      return NextResponse.json(
        { error: "Un ou plusieurs slots sont invalides" },
        { status: 400 }
      );
    }

    // Si aucun slot, supprimer le repas (dernier propriétaire)
    if (slotIds.length === 0) {
      await db.meal.delete({
        where: { id: mealId },
      });

      return NextResponse.json(
        { success: true, deleted: true },
        { status: 200 }
      );
    }

    // Définir tous les slots du repas
    await db.meal.update({
      where: { id: mealId },
      data: {
        slots: {
          set: slotIds.map((id: string) => ({ id })),
        },
      },
    });

    return NextResponse.json(
      { success: true, deleted: false },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la mise à jour des propriétaires:", error);
    return NextResponse.json(
      {
        error:
          "Une erreur est survenue lors de la mise à jour des propriétaires",
      },
      { status: 500 }
    );
  }
}

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
            "Vous devez avoir un slot dans cette instance pour ajouter des propriétaires",
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
    const slotId = searchParams.get("slotId");

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
            "Vous devez avoir un slot dans cette instance pour retirer des propriétaires",
        },
        { status: 403 }
      );
    }

    // Si slotId est fourni, retirer ce slot spécifique
    // Sinon, retirer le slot de l'utilisateur actuel
    const userSlot = meal.instance.slots[0];
    const slotToRemove = slotId
      ? meal.slots.find((slot) => slot.id === slotId)
      : meal.slots.find((slot) => slot.userId === session.user.id);

    if (!slotToRemove) {
      return NextResponse.json({ error: "Slot non trouvé" }, { status: 404 });
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
          disconnect: { id: slotToRemove.id },
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
