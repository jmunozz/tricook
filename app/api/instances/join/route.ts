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

    const { token } = await request.json();

    if (!token || typeof token !== "string" || token.trim().length === 0) {
      return NextResponse.json(
        { error: "Le token est requis" },
        { status: 400 }
      );
    }

    // Trouver l'instance avec ce token
    const instance = await db.instance.findUnique({
      where: {
        joinToken: token.trim(),
      },
      include: {
        users: {
          where: {
            id: session.user.id,
          },
        },
        slots: {
          where: {
            userId: null, // Slots disponibles (non assignés)
          },
        },
      },
    });

    if (!instance) {
      return NextResponse.json(
        { error: "Instance non trouvée avec ce token" },
        { status: 404 }
      );
    }

    // Vérifier si l'utilisateur est déjà membre
    if (instance.users.length > 0) {
      return NextResponse.json(
        { error: "Vous êtes déjà membre de cette instance" },
        { status: 400 }
      );
    }

    // Ajouter l'utilisateur à l'instance
    await db.instance.update({
      where: { id: instance.id },
      data: {
        users: {
          connect: {
            id: session.user.id,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        instanceId: instance.id,
        availableSlots: instance.slots,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la jointure à l'instance:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la jointure à l'instance" },
      { status: 500 }
    );
  }
}
