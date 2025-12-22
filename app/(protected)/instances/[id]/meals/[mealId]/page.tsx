import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddIngredientDialog } from "@/components/add-ingredient-dialog";
import { AddMealOwnerDialog } from "@/components/add-meal-owner-dialog";
import { JoinMealButton } from "@/components/join-meal-button";
import { RemoveMealOwnerButton } from "@/components/remove-meal-owner-button";
import { UserHoverCard } from "@/components/user-hover-card";
import { IngredientCard } from "@/components/ingredient-card";
import { Users, Utensils, Clock } from "lucide-react";
import Link from "next/link";

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
      slots: {
        include: {
          user: {
            select: {
              email: true,
            },
          },
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

  // Vérifier si l'utilisateur est propriétaire du repas
  const userSlot = await db.slot.findFirst({
    where: {
      instanceId,
      userId: session.user.id,
      meals: {
        some: {
          id: mealId,
        },
      },
    },
  });

  const isMealOwner = !!userSlot;

  // Récupérer tous les ingrédients approuvés disponibles (globaux + instance)
  const globalInstance = await db.instance.findFirst({
    where: {
      name: "Global Ingredients",
    },
  });

  const ingredientInstances = [instanceId];
  if (globalInstance) {
    ingredientInstances.push(globalInstance.id);
  }

  const availableIngredients = await db.ingredient.findMany({
    where: {
      instanceId: { in: ingredientInstances },
      status: "approved",
    },
    orderBy: {
      name: "asc",
    },
  });

  // Récupérer les slots non assignés au repas
  const unassignedSlots = instance.slots.filter(
    (slot) => !meal.slots.some((mealSlot) => mealSlot.id === slot.id)
  );

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/instances/${instanceId}`}
            className="text-muted-foreground hover:text-foreground text-sm mb-2 inline-block"
          >
            ← Retour à l'instance
          </Link>
          <h1 className="text-3xl font-bold">{meal.name}</h1>
          <p className="text-muted-foreground mt-1">
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
        </div>
        <div className="flex gap-2">
          {isMealOwner ? (
            <>
              <RemoveMealOwnerButton
                mealId={mealId}
                instanceId={instanceId}
                isLastOwner={meal.slots.length === 1}
                mealName={meal.name}
              />
              <AddMealOwnerDialog
                mealId={mealId}
                instanceId={instanceId}
                availableSlots={unassignedSlots}
              />
            </>
          ) : (
            <JoinMealButton mealId={mealId} instanceId={instanceId} />
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Propriétaires du repas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Cuistots ({meal.slots.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {meal.slots.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Aucun propriétaire assigné
              </p>
            ) : (
              <div className="space-y-2">
                {meal.slots.map((slot) => (
                  <UserHoverCard user={slot.user}>
                    <div
                      key={slot.id}
                      className="flex items-center p-2 rounded-lg bg-muted/50"
                    >
                      {slot.name}
                    </div>
                  </UserHoverCard>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Informations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Créé le</span>
              <span className="text-sm">
                {new Date(meal.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                Dernière mise à jour
              </span>
              <span className="text-sm">
                {new Date(meal.updatedAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                Nombre d'ingrédients
              </span>
              <span className="text-sm font-medium">
                {meal.mealIngredients.length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ingrédients */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5" />
              Ingrédients ({meal.mealIngredients.length})
            </CardTitle>
            {isMealOwner && (
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
              {isMealOwner && (
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
                  isMealOwner={isMealOwner}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
