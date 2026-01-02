import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddIngredientDialog } from "@/components/add-ingredient-dialog";
import { IngredientCard } from "@/components/ingredient-card";
import { Utensils, Settings } from "lucide-react";
import Link from "next/link";
import { SlotUser } from "@/components/slot-user";

export default async function MealPage({
  params,
}: {
  params: Promise<{ id: string; mealId: string }>;
}) {
  const { id: instanceId, mealId } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  // Vérifier l'accès à l'instance
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
    redirect("/dashboard");
  }

  // Récupérer le repas avec tous ses détails
  const meal = await db.meal.findUnique({
    where: { id: mealId },
    include: {
      slots: {
        include: {
          user: {
            select: {
              email: true,
            },
          },
        },
      },
      mealIngredients: {
        include: {
          ingredient: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      instance: true,
    },
  });

  if (!meal || meal.instanceId !== instanceId) {
    redirect(`/instances/${instanceId}`);
  }

  // Vérifier si l'utilisateur a un slot dans l'instance (peut éditer n'importe quel repas)
  const userSlot = await db.slot.findFirst({
    where: {
      instanceId,
      userId: session.user.id,
    },
  });

  const hasSlot = !!userSlot;

  // Récupérer tous les ingrédients disponibles (approuvés globaux + pending de l'instance)
  const globalInstance = await db.instance.findFirst({
    where: {
      name: "Global Ingredients",
    },
  });

  const ingredientInstances = [];
  if (globalInstance) {
    ingredientInstances.push(globalInstance.id);
  }

  const availableIngredients = await db.ingredient.findMany({
    where: {
      OR: [
        // Ingrédients approuvés de l'instance globale
        {
          instanceId: { in: ingredientInstances },
          status: "approved",
        },
        // Ingrédients pending de cette instance
        {
          instanceId: instanceId,
          status: "pending",
        },
      ],
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/instances/${instanceId}`}
            className="text-muted-foreground hover:text-foreground text-sm mb-2 inline-block"
          >
            ← Retour au séjour
          </Link>
          <div className="flex items-baseline gap-2 flex-wrap">
            <h1 className="text-3xl font-bold">{meal.name}</h1>
            {hasSlot && (
              <Link
                href={`/instances/${instanceId}/meals/${mealId}/settings?section=owners`}
              >
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">Paramètres du repas</span>
                </Button>
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-muted-foreground">
              {meal.type === "breakfast" && "Petit-déjeuner"}
              {meal.type === "lunch" && "Déjeuner"}
              {meal.type === "dinner" && "Dîner"}
              {meal.date && (
                <>
                  {" - "}
                  {new Date(meal.date).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </>
              )}
            </p>
            <span className="self-center">●</span>

            <span className="text-muted-foreground text-sm">
              {`Créé le ${new Date(meal.createdAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}`}
            </span>
            <span className="self-center">●</span>
            <span className="text-muted-foreground text-sm">
              {`Mis à jour le ${new Date(meal.updatedAt).toLocaleDateString(
                "fr-FR",
                {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }
              )}`}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {meal.slots.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Aucun propriétaire assigné
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {meal.slots.map((slot) => (
              <SlotUser key={slot.id} slot={slot} />
            ))}
          </div>
        )}
      </div>

      {/* Ingrédients */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5" />
              Ingrédients ({meal.mealIngredients.length})
            </CardTitle>
            {hasSlot && (
              <AddIngredientDialog
                mealId={mealId}
                instanceId={instanceId}
                availableIngredients={availableIngredients}
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {meal.mealIngredients.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Aucun ingrédient pour le moment
              </p>
              {hasSlot && (
                <AddIngredientDialog
                  mealId={mealId}
                  instanceId={instanceId}
                  availableIngredients={availableIngredients}
                />
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {meal.mealIngredients.map((mi) => (
                <IngredientCard
                  key={mi.id}
                  mealIngredient={mi}
                  isMealOwner={hasSlot}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
