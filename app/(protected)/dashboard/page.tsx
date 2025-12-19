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
import { Button } from "@/components/ui/button";
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground mt-2">
            Bienvenue, {session.user.email} !
          </p>
        </div>
        <div className="flex gap-2">
          <JoinInstanceDialogWrapper />
          <CreateInstanceDialog />
        </div>
      </div>

      {instances.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-center mb-4">
              Vous n'avez pas encore d'instance.
            </p>
            <CreateInstanceDialog />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {instances.map((instance) => (
            <Card key={instance.id} className="hover:ring-2 transition-all">
              <CardHeader>
                <CardTitle>{instance.name}</CardTitle>
                <CardDescription>
                  Créée le{" "}
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
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/instances/${instance.id}`}>Ouvrir</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
