import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;
  const callbackUrl = params.callbackUrl || "/dashboard";

  // Si l'utilisateur est connecté, rediriger vers le callbackUrl
  if (session) {
    redirect(callbackUrl);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="w-full max-w-2xl space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Bienvenue sur TriCook
          </h1>
          <p className="text-lg text-muted-foreground sm:text-xl">
            Organisez vos repas en toute simplicité. Planifiez, partagez et
            cuisinez ensemble.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <Link
              href={
                callbackUrl
                  ? `/auth/signup?callbackUrl=${encodeURIComponent(
                      callbackUrl
                    )}`
                  : "/auth/signup"
              }
            >
              Créer un compte
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link
              href={
                callbackUrl
                  ? `/auth/signin?callbackUrl=${encodeURIComponent(
                      callbackUrl
                    )}`
                  : "/auth/signin"
              }
            >
              Se connecter
            </Link>
          </Button>
        </div>

        <div className="pt-8">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <h3 className="font-semibold">Planifiez</h3>
              <p className="text-sm text-muted-foreground">
                Organisez vos repas de la semaine en quelques clics
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Partagez</h3>
              <p className="text-sm text-muted-foreground">
                Collaborez avec votre famille ou vos colocataires
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Cuisinez</h3>
              <p className="text-sm text-muted-foreground">
                Accédez facilement à vos recettes et ingrédients
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
