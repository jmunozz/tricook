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

    const { instanceId, slotId, slotName } = await request.json();

    if (!instanceId) {
      return NextResponse.json(
        { error: "instanceId est requis" },
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

    // Vérifier que l'utilisateur n'a pas déjà un slot dans cette instance
    const existingSlot = await db.slot.findFirst({
      where: {
        instanceId,
        userId: session.user.id,
      },
    });

    if (existingSlot) {
      return NextResponse.json(
        { error: "Vous avez déjà un slot dans cette instance" },
        { status: 400 }
      );
    }

    if (slotId) {
      // Assigner un slot existant
      const slot = await db.slot.findUnique({
        where: { id: slotId },
      });

      if (!slot || slot.instanceId !== instanceId || slot.userId !== null) {
        return NextResponse.json(
          { error: "Slot invalide ou déjà assigné" },
          { status: 400 }
        );
      }

      await db.slot.update({
        where: { id: slotId },
        data: {
          userId: session.user.id,
        },
      });

      return NextResponse.json({ success: true }, { status: 200 });
    } else if (slotName) {
      // Créer un nouveau slot
      if (!slotName.trim()) {
        return NextResponse.json(
          { error: "Le nom du slot est requis" },
          { status: 400 }
        );
      }

      await db.slot.create({
        data: {
          name: slotName.trim(),
          instanceId,
          userId: session.user.id,
        },
      });

      return NextResponse.json({ success: true }, { status: 201 });
    } else {
      return NextResponse.json(
        { error: "slotId ou slotName est requis" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Erreur lors de l'assignation du slot:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'assignation du slot" },
      { status: 500 }
    );
  }
}
