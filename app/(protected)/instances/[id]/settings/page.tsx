import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { InstanceSettingsClient } from "@/components/instance-settings-client";
import Link from "next/link";

export default async function InstanceSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ section?: string }>;
}) {
  const { id: instanceId } = await params;
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
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!instance || instance.users.length === 0) {
    redirect("/dashboard");
  }

  // Format dates
  const formattedCreatedAt = new Date(instance.createdAt).toLocaleDateString(
    "fr-FR",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );

  const formattedUpdatedAt = new Date(instance.updatedAt).toLocaleDateString(
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
          href={`/instances/${instanceId}`}
          className="text-muted-foreground hover:text-foreground text-sm mb-2 inline-block"
        >
          ← Retour à l'instance
        </Link>
        <h1 className="text-3xl font-bold">{instance.name}</h1>
        <p className="text-muted-foreground mt-1">
          Créée le {formattedCreatedAt} ● Modifiée le {formattedUpdatedAt}
        </p>
      </div>

      {/* Settings Content */}
      <InstanceSettingsClient
        instance={{
          id: instance.id,
          name: instance.name,
          joinToken: instance.joinToken,
          createdAt: instance.createdAt.toISOString(),
          updatedAt: instance.updatedAt.toISOString(),
        }}
        slots={instance.slots}
        currentUserId={session.user.id}
        initialSection={section}
      />
    </div>
  );
}
