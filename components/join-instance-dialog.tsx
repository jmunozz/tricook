"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { SelectSlotDialog } from "@/components/select-slot-dialog";

export function JoinInstanceDialog() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [slotDialogOpen, setSlotDialogOpen] = useState(false);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<
    Array<{ id: string; name: string }>
  >([]);

  // Vérifier si un token est présent dans l'URL
  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (urlToken) {
      setToken(urlToken);
      setOpen(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token.trim()) {
      setError("Le token est requis");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/instances/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: token.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Une erreur est survenue");
        setIsLoading(false);
        return;
      }

      // Ouvrir le dialog de sélection de slot
      setInstanceId(data.instanceId);
      setAvailableSlots(data.availableSlots || []);
      setOpen(false);
      setSlotDialogOpen(true);
      setIsLoading(false);
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  const handleSlotSelected = () => {
    setSlotDialogOpen(false);
    setToken("");
    // Retirer le token de l'URL
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent size="default" className="max-w-md">
          <form onSubmit={handleSubmit}>
            <AlertDialogHeader>
              <AlertDialogTitle>Rejoindre une instance</AlertDialogTitle>
              <AlertDialogDescription>
                Entrez le token de l'instance que vous souhaitez rejoindre.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="mt-4 space-y-4">
              <Field>
                <FieldLabel>Token de l'instance</FieldLabel>
                <FieldContent>
                  <Input
                    type="text"
                    placeholder="Collez le token ici"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    disabled={isLoading}
                    autoFocus
                  />
                </FieldContent>
                {error && <FieldError>{error}</FieldError>}
              </Field>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoading}>
                Annuler
              </AlertDialogCancel>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Rejoindre..." : "Rejoindre"}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      {instanceId && (
        <SelectSlotDialog
          open={slotDialogOpen}
          onOpenChange={setSlotDialogOpen}
          instanceId={instanceId}
          availableSlots={availableSlots}
          onSuccess={handleSlotSelected}
        />
      )}
    </>
  );
}
