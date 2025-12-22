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

    // Récupérer le slot avec son instance
    const slot = await db.slot.findUnique({
      where: { id },
      include: {
        instance: {
          include: {
            users: {
              where: {
                id: session.user.id,
              },
            },
          },
        },
        meals: true,
      },
    });

    if (!slot) {
      return NextResponse.json({ error: "Slot non trouvé" }, { status: 404 });
    }

    // Vérifier que l'utilisateur a accès à l'instance
    if (slot.instance.users.length === 0) {
      return NextResponse.json(
        { error: "Vous n'avez pas accès à cette instance" },
        { status: 403 }
      );
    }

    // Vérifier que le slot n'est pas utilisé dans des repas
    if (slot.meals.length > 0) {
      return NextResponse.json(
        {
          error:
            "Ce slot ne peut pas être supprimé car il est utilisé dans des repas",
        },
        { status: 400 }
      );
    }

    // Supprimer le slot
    await db.slot.delete({
      where: { id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la suppression du slot:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la suppression du slot" },
      { status: 500 }
    );
  }
}
