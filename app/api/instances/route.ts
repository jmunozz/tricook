import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const instances = await db.instance.findMany({
      where: {
        users: {
          some: {
            id: session.user.id,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(instances);
  } catch (error) {
    console.error("Erreur lors de la récupération des instances:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
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

    const { name } = await request.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Le nom de l'instance est requis" },
        { status: 400 }
      );
    }

    // Générer un token unique pour rejoindre l'instance
    const joinToken = randomBytes(32).toString("hex");

    const instance = await db.instance.create({
      data: {
        name: name.trim(),
        joinToken,
        users: {
          connect: {
            id: session.user.id,
          },
        },
      },
      include: {
        users: true,
      },
    });

    return NextResponse.json(instance, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création de l'instance:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la création de l'instance" },
      { status: 500 }
    );
  }
}
