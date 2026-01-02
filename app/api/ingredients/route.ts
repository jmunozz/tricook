import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const instanceId = searchParams.get("instanceId");

    // Récupérer l'instance globale pour les ingrédients approuvés
    const globalInstance = await db.instance.findFirst({
      where: {
        name: "Global Ingredients",
      },
    });

    const ingredientInstances = [];
    if (globalInstance) {
      ingredientInstances.push(globalInstance.id);
    }

    // Construire la condition WHERE pour les ingrédients
    const whereCondition: any = {
      OR: [
        // Ingrédients approuvés de l'instance globale
        {
          instanceId: { in: ingredientInstances },
          status: "approved",
        },
      ],
    };

    // Si une instanceId est fournie, inclure aussi les ingrédients pending de cette instance
    if (instanceId) {
      // Vérifier que l'utilisateur a accès à cette instance
      const instance = await db.instance.findFirst({
        where: {
          id: instanceId,
          users: {
            some: {
              id: session.user.id,
            },
          },
        },
      });

      if (instance) {
        whereCondition.OR.push({
          instanceId: instanceId,
          status: "pending",
        });
      }
    }

    // Récupérer tous les ingrédients (approuvés globaux + pending de l'instance si fournie)
    const ingredients = await db.ingredient.findMany({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        category: true,
        defaultUnit: true,
        status: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ ingredients }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la récupération des ingrédients:", error);
    return NextResponse.json(
      {
        error:
          "Une erreur est survenue lors de la récupération des ingrédients",
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

    const { name, instanceId, category, defaultUnit } = await request.json();

    if (!name || !instanceId) {
      return NextResponse.json(
        { error: "Le nom et l'instance sont requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur a accès à cette instance
    const instance = await db.instance.findFirst({
      where: {
        id: instanceId,
        users: {
          some: {
            id: session.user.id,
          },
        },
      },
    });

    if (!instance) {
      return NextResponse.json(
        { error: "Instance non trouvée ou accès refusé" },
        { status: 403 }
      );
    }

    // Normaliser le nom de l'ingrédient
    const normalizedName = name.toLowerCase().trim();

    if (!normalizedName) {
      return NextResponse.json(
        { error: "Le nom de l'ingrédient ne peut pas être vide" },
        { status: 400 }
      );
    }

    // Vérifier si l'ingrédient existe déjà dans cette instance
    const existingIngredient = await db.ingredient.findUnique({
      where: {
        name_instanceId: {
          name: normalizedName,
          instanceId: instanceId,
        },
      },
    });

    if (existingIngredient) {
      // Retourner l'ingrédient existant
      return NextResponse.json(
        {
          ingredient: {
            id: existingIngredient.id,
            name: existingIngredient.name,
            category: existingIngredient.category,
            defaultUnit: existingIngredient.defaultUnit,
            status: existingIngredient.status,
          },
        },
        { status: 200 }
      );
    }

    // Créer un nouvel ingrédient avec le statut "pending"
    const ingredient = await db.ingredient.create({
      data: {
        name: normalizedName,
        category: category || null,
        defaultUnit: defaultUnit || null,
        instanceId: instanceId,
        status: "pending",
        createdById: session.user.id,
      },
      select: {
        id: true,
        name: true,
        category: true,
        defaultUnit: true,
        status: true,
      },
    });

    return NextResponse.json({ ingredient }, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création de l'ingrédient:", error);
    return NextResponse.json(
      {
        error: "Une erreur est survenue lors de la création de l'ingrédient",
      },
      { status: 500 }
    );
  }
}
