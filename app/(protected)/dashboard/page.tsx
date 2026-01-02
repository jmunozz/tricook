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
import { CreateInstanceDialog } from "@/components/create-instance-dialog";
import { JoinInstanceDialogWrapper } from "@/components/join-instance-dialog-wrapper";
import Link from "next/link";
import { Calendar, Users } from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  const instances = await db.instance.findMany({
    where: {
      users: {
        some: {
          id: session.user.id,
        },
      },
    },
    include: {
      _count: {
        select: {
          users: true,
          meals: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="container mx-auto p-4 space-y-6">
      <JoinInstanceDialogWrapper />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1>Séjours</h1>
        </div>
        <div className="flex gap-2 itemps-center">
          <CreateInstanceDialog />
        </div>
      </div>

      {instances.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-center mb-4">
              Vous n'avez pas encore de séjours.
            </p>
            <CreateInstanceDialog />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {instances.map((instance) => (
            <Link href={`/instances/${instance.id}`}>
              <Card
                key={instance.id}
                className="hover:ring-primary transition-all"
              >
                <CardHeader>
                  <CardTitle className="text-lg font-bold">
                    {instance.name}
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Créé le{" "}
                    {new Date(instance.createdAt).toLocaleDateString("fr-FR")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>
                        {instance._count.users} membre
                        {instance._count.users > 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{instance._count.meals} repas</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
