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

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Récupérer le token depuis l'URL si présent
  const token = searchParams.get("token");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Une erreur est survenue");
        setIsLoading(false);
        return;
      }

      // Connexion automatique après inscription
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(
          "Compte créé mais erreur de connexion. Veuillez vous connecter."
        );
        setIsLoading(false);
        return;
      }

      // Rediriger vers le dashboard avec le token si présent
      const redirectUrl = token
        ? `/dashboard?token=${encodeURIComponent(token)}`
        : "/dashboard";
      router.push(redirectUrl);
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
          <h1 className="text-3xl font-bold">Créer un compte</h1>
          <p className="text-muted-foreground">
            Déjà un compte ?{" "}
            <Link
              href={token ? `/auth/signin?token=${encodeURIComponent(token)}` : "/auth/signin"}
              className="text-primary hover:underline"
            >
              Se connecter
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
                minLength={6}
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>Confirmer le mot de passe</FieldLabel>
            <FieldContent>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
              />
            </FieldContent>
          </Field>

          {error && <FieldError>{error}</FieldError>}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Création en cours..." : "Créer un compte"}
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

export default function SignUpPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <SignUpForm />
    </Suspense>
  );
}
