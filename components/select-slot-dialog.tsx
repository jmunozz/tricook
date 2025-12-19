"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as React from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type Slot = {
  id: string;
  name: string;
};

export function SelectSlotDialog({
  open,
  onOpenChange,
  instanceId,
  availableSlots,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instanceId: string;
  availableSlots: Slot[];
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"existing" | "new">(
    availableSlots.length > 0 ? "existing" : "new"
  );
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [newSlotName, setNewSlotName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Réinitialiser le mode si les slots disponibles changent
  React.useEffect(() => {
    if (availableSlots.length === 0 && mode === "existing") {
      setMode("new");
    }
  }, [availableSlots.length, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (mode === "existing" && !selectedSlotId) {
      setError("Veuillez sélectionner un slot");
      return;
    }

    if (mode === "new" && !newSlotName.trim()) {
      setError("Veuillez entrer un nom pour le slot");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/instances/assign-slot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instanceId,
          slotId: mode === "existing" ? selectedSlotId : null,
          slotName: mode === "new" ? newSlotName.trim() : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Une erreur est survenue");
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="default" className="max-w-md">
        <form onSubmit={handleSubmit}>
          <AlertDialogHeader>
            <AlertDialogTitle>Choisir un slot</AlertDialogTitle>
            <AlertDialogDescription>
              Sélectionnez un slot existant ou créez-en un nouveau pour cette
              instance.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="mt-4 space-y-4">
            <Field>
              <FieldLabel>Option</FieldLabel>
              <FieldContent>
                <div className="space-y-3">
                  <label className="flex items-center space-x-2 cursor-pointer p-3 rounded-lg border hover:bg-muted/50">
                    <input
                      type="radio"
                      name="slot-mode"
                      value="existing"
                      checked={mode === "existing"}
                      onChange={(e) =>
                        setMode(e.target.value as "existing" | "new")
                      }
                      className="rounded"
                    />
                    <span className="text-sm">Utiliser un slot existant</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer p-3 rounded-lg border hover:bg-muted/50">
                    <input
                      type="radio"
                      name="slot-mode"
                      value="new"
                      checked={mode === "new"}
                      onChange={(e) =>
                        setMode(e.target.value as "existing" | "new")
                      }
                      className="rounded"
                    />
                    <span className="text-sm">Créer un nouveau slot</span>
                  </label>
                </div>
              </FieldContent>
            </Field>

            {mode === "existing" && (
              <Field>
                <FieldLabel>Slot disponible</FieldLabel>
                <FieldContent>
                  {availableSlots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Aucun slot disponible. Créez-en un nouveau.
                    </p>
                  ) : (
                    <Select
                      value={selectedSlotId}
                      onValueChange={setSelectedSlotId}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un slot" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSlots.map((slot) => (
                          <SelectItem key={slot.id} value={slot.id}>
                            {slot.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </FieldContent>
              </Field>
            )}

            {mode === "new" && (
              <Field>
                <FieldLabel>Nom du slot</FieldLabel>
                <FieldContent>
                  <Input
                    type="text"
                    placeholder="Ex: Chef, Cuisinier, Membre..."
                    value={newSlotName}
                    onChange={(e) => setNewSlotName(e.target.value)}
                    disabled={isLoading}
                    autoFocus
                  />
                </FieldContent>
              </Field>
            )}

            {error && <FieldError>{error}</FieldError>}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Assignation..." : "Confirmer"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
