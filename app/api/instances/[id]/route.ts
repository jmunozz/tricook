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

    const { id: instanceId } = await params;
    const { name } = await request.json();

    // Vérifier que l'instance existe
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

    if (!instance) {
      return NextResponse.json(
        { error: "Instance non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur a accès à l'instance
    if (instance.users.length === 0) {
      return NextResponse.json(
        { error: "Vous n'avez pas accès à cette instance" },
        { status: 403 }
      );
    }

    // Valider le nom
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
          { error: "Le nom de l'instance est requis" },
          { status: 400 }
        );
      }
    }

    // Mettre à jour l'instance
    const updatedInstance = await db.instance.update({
      where: { id: instanceId },
      data: {
        name: name.trim(),
      },
    });

    return NextResponse.json(updatedInstance, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'instance:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la mise à jour de l'instance" },
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

    const { id: instanceId } = await params;

    // Vérifier que l'instance existe
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

    if (!instance) {
      return NextResponse.json(
        { error: "Instance non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur a accès à l'instance
    if (instance.users.length === 0) {
      return NextResponse.json(
        { error: "Vous n'avez pas accès à cette instance" },
        { status: 403 }
      );
    }

    // Supprimer l'instance (cascade supprimera les slots, repas, etc.)
    await db.instance.delete({
      where: { id: instanceId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'instance:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la suppression de l'instance" },
      { status: 500 }
    );
  }
}
