import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateMealDialog } from "@/components/create-meal-dialog";
import { ExportShoppingListButton } from "@/components/export-shopping-list-button";
import { ShareInstanceToken } from "@/components/share-instance-token";
import { ManageSlotsDialog } from "@/components/manage-slots-dialog";
import { Calendar, Clock, Utensils } from "lucide-react";
import Link from "next/link";
import { UserHoverCard } from "@/components/user-hover-card";
import { Item } from "@/components/ui/item";

export default async function InstancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  const instance = await db.instance.findUnique({
    where: { id },
    include: {
      slots: {
        include: {
          user: {
            select: {
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      meals: {
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
          },
        },
        orderBy: [{ date: "asc" }, { createdAt: "desc" }],
      },
      users: {
        select: {
          id: true,
          email: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!instance) {
    redirect("/dashboard");
  }

  // Vérifier que l'utilisateur a accès à cette instance
  const hasAccess = instance.users.some((user) => user.id === session.user.id);
  if (!hasAccess) {
    redirect("/dashboard");
  }

  // Trouver la dernière mise à jour parmi les repas et l'instance
  const lastMealUpdate =
    instance.meals.length > 0
      ? instance.meals.reduce((latest, meal) => {
          return meal.updatedAt > latest ? meal.updatedAt : latest;
        }, instance.meals[0].updatedAt)
      : null;

  const lastUpdate =
    lastMealUpdate && lastMealUpdate > instance.updatedAt
      ? lastMealUpdate
      : instance.updatedAt;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground text-sm mb-2 inline-block"
          >
            ← Retour au tableau de bord
          </Link>
          <h1 className="text-3xl font-bold">{instance.name}</h1>
        </div>
        <div className="flex gap-2">
          <ShareInstanceToken token={instance.joinToken} />
          <ExportShoppingListButton instanceId={instance.id} />
          <CreateMealDialog instanceId={instance.id} slots={instance.slots} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Slots */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                👨‍🍳 Cuistots ({instance.slots.length})
              </CardTitle>
              <ManageSlotsDialog
                instanceId={instance.id}
                slots={instance.slots}
              />
            </div>
          </CardHeader>
          <CardContent>
            {instance.slots.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucun membre</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {instance.slots.map((slot) => (
                  <UserHoverCard key={slot.id} user={slot.user}>
                    <Item className="border border-green-400">{slot.name}</Item>
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
              <span className="text-muted-foreground text-sm">
                Dernière mise à jour
              </span>
              <span className="text-sm">
                {new Date(lastUpdate).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Créée le</span>
              <span className="text-sm">
                {new Date(instance.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                Nombre de repas
              </span>
              <span className="text-sm font-medium">
                {instance.meals.length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Repas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            Repas ({instance.meals.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {instance.meals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Aucun repas pour le moment
              </p>
              <CreateMealDialog
                instanceId={instance.id}
                slots={instance.slots}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {instance.meals.map((meal) => (
                <Card key={meal.id} size="sm">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>
                          <Link
                            href={`/instances/${instance.id}/meals/${meal.id}`}
                            className="hover:underline"
                          >
                            {meal.name}
                          </Link>
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Calendar className="h-4 w-4" />
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
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {meal.slots.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm text-muted-foreground mb-1">
                          Assigné à :
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {meal.slots.map((slot) => (
                            <UserHoverCard key={slot.id} user={slot.user}>
                              <span
                                key={slot.id}
                                className="text-xs px-2 py-1 rounded-full bg-muted inline-block"
                              >
                                {slot.name}
                              </span>
                            </UserHoverCard>
                          ))}
                        </div>
                      </div>
                    )}
                    {meal.mealIngredients.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Ingrédients :
                        </p>
                        <ul className="text-sm space-y-1">
                          {meal.mealIngredients.map((mi) => (
                            <li key={mi.id}>
                              • {mi.quantity} {mi.unit} de {mi.ingredient.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
