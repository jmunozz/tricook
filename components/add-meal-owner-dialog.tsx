"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

type Slot = {
  id: string;
  name: string;
  userId: string | null;
};

export function AddMealOwnerDialog({
  mealId,
  instanceId,
  availableSlots,
}: {
  mealId: string;
  instanceId: string;
  availableSlots: Slot[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [slotId, setSlotId] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!slotId) {
      setError("Veuillez sélectionner un slot");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/meals/owners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mealId,
          slotId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Une erreur est survenue");
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      setOpen(false);
      setSlotId("");
      router.refresh();
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  if (availableSlots.length === 0) {
    return null;
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un propriétaire
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="default" className="max-w-md">
        <form onSubmit={handleSubmit}>
          <AlertDialogHeader>
            <AlertDialogTitle>Ajouter un propriétaire</AlertDialogTitle>
            <AlertDialogDescription>
              Ajoutez un membre de l'instance comme propriétaire de ce repas.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="mt-4 space-y-4">
            <Field>
              <FieldLabel>Membre</FieldLabel>
              <FieldContent>
                <Select
                  value={slotId}
                  onValueChange={setSlotId}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un membre" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSlots.map((slot) => (
                      <SelectItem key={slot.id} value={slot.id}>
                        {slot.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>

            {error && <FieldError>{error}</FieldError>}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Ajout..." : "Ajouter"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
