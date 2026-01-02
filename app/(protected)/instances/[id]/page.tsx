import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { CreateMealDialog } from "@/components/create-meal-dialog";
import { ExportShoppingListButton } from "@/components/export-shopping-list-button";
import { Settings } from "lucide-react";
import Link from "next/link";
import { SlotUser } from "@/components/slot-user";
import { Button } from "@/components/ui/button";
import { MealCard } from "@/components/meal-card";

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

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground text-sm mb-2 inline-block"
          >
            ← Voir tous les séjours
          </Link>
          <div className="flex items-baseline gap-2 flex-wrap">
            <h1 className="text-3xl font-bold">{instance.name}</h1>
            <Link href={`/instances/${instance.id}/settings`}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Settings className="h-4 w-4" />
                <span className="sr-only">Paramètres de l'instance</span>
              </Button>
            </Link>
          </div>
        </div>
        <div className="flex gap-2">
          <ExportShoppingListButton instanceId={instance.id} />
          <CreateMealDialog instanceId={instance.id} slots={instance.slots} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        {instance.slots.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Aucun propriétaire assigné
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {instance.slots.map((slot) => (
              <SlotUser key={slot.id} slot={slot} />
            ))}
          </div>
        )}
      </div>
      {/* Repas */}
      {instance.meals.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            Aucun repas pour le moment
          </p>
          <CreateMealDialog instanceId={instance.id} slots={instance.slots} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {instance.meals.map((meal) => (
            <Link href={`/instances/${instance.id}/meals/${meal.id}`}>
              <MealCard meal={meal} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
