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

    const { instanceId, name } = await request.json();

    if (!instanceId || !name) {
      return NextResponse.json(
        { error: "instanceId et name sont requis" },
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

    // Vérifier que le nom n'est pas vide après trim
    const trimmedName = name.trim();
    if (!trimmedName) {
      return NextResponse.json(
        { error: "Le nom du slot ne peut pas être vide" },
        { status: 400 }
      );
    }

    // Créer le slot
    const slot = await db.slot.create({
      data: {
        name: trimmedName,
        instanceId,
      },
    });

    return NextResponse.json({ slot }, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création du slot:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la création du slot" },
      { status: 500 }
    );
  }
}
