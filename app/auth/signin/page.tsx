"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Récupérer le callbackUrl depuis l'URL (géré par NextAuth)
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError("Email ou mot de passe incorrect");
        setIsLoading(false);
        return;
      }

      // Rediriger vers le callbackUrl
      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Se connecter</h1>
          <p className="text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link
              href={
                callbackUrl
                  ? `/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`
                  : "/auth/signup"
              }
              className="text-primary hover:underline"
            >
              Créer un compte
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel>Email</FieldLabel>
            <FieldContent>
              <Input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>Mot de passe</FieldLabel>
            <FieldContent>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </FieldContent>
          </Field>

          {error && <FieldError>{error}</FieldError>}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>

        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:underline"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <SignInForm />
    </Suspense>
  );
}
