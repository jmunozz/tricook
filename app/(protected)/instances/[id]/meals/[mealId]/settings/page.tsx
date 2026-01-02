import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { MealSettingsClient } from "@/components/meal-settings-client";
import Link from "next/link";

export default async function MealSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; mealId: string }>;
  searchParams: Promise<{ section?: string }>;
}) {
  const { id: instanceId, mealId } = await params;
  const { section = "infos" } = await searchParams;
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

  if (!userSlot) {
    redirect(`/instances/${instanceId}/meals/${mealId}`);
  }

  const isLastOwner = meal.slots.length === 1;

  // Format dates
  const mealTypeLabels = {
    breakfast: "Petit-déjeuner",
    lunch: "Déjeuner",
    dinner: "Dîner",
  };

  const formattedCreatedAt = new Date(meal.createdAt).toLocaleDateString(
    "fr-FR",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );

  const formattedUpdatedAt = new Date(meal.updatedAt).toLocaleDateString(
    "fr-FR",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/instances/${instanceId}/meals/${mealId}`}
          className="text-muted-foreground hover:text-foreground text-sm mb-2 inline-block"
        >
          ← Retour au repas
        </Link>
        <h1 className="text-3xl font-bold">{meal.name}</h1>
        <p className="text-muted-foreground mt-1">
          {mealTypeLabels[meal.type]} ● Créé le {formattedCreatedAt} ● Modifié
          le {formattedUpdatedAt}
        </p>
      </div>

      {/* Settings Content */}
      <MealSettingsClient
        meal={meal}
        instanceId={instanceId}
        allSlots={instance.slots}
        currentMealSlots={meal.slots}
        currentUserId={session.user.id}
        isLastOwner={isLastOwner}
        initialSection={section}
      />
    </div>
  );
}
