"use client";

import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Settings, Plus, Trash2 } from "lucide-react";
import { UserHoverCard } from "@/components/user-hover-card";

type Slot = {
  id: string;
  name: string;
  user?: {
    email: string;
  } | null;
};

export function ManageSlotsDialog({
  instanceId,
  slots: initialSlots,
}: {
  instanceId: string;
  slots: Slot[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [slots, setSlots] = useState(initialSlots);
  const [newSlotName, setNewSlotName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [deletingSlotId, setDeletingSlotId] = useState<string | null>(null);

  // Réinitialiser les slots quand le dialog s'ouvre
  useEffect(() => {
    if (open) {
      setSlots(initialSlots);
      setNewSlotName("");
      setError("");
    }
  }, [open, initialSlots]);

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newSlotName.trim()) {
      setError("Le nom du slot est requis");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/instances/slots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instanceId,
          name: newSlotName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Une erreur est survenue");
        setIsLoading(false);
        return;
      }

      // Ajouter le nouveau slot à la liste
      setSlots([...slots, data.slot]);
      setNewSlotName("");
      setIsLoading(false);
      router.refresh();
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce slot ?")) {
      return;
    }

    setDeletingSlotId(slotId);
    setError("");

    try {
      const response = await fetch(`/api/instances/slots/${slotId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Une erreur est survenue");
        setDeletingSlotId(null);
        return;
      }

      // Retirer le slot de la liste
      setSlots(slots.filter((slot) => slot.id !== slotId));
      setDeletingSlotId(null);
      router.refresh();
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
      setDeletingSlotId(null);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
          <span className="sr-only">Configurer les cuistots</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="default" className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Gérer les cuistots</AlertDialogTitle>
          <AlertDialogDescription>
            Ajoutez ou supprimez des cuistots pour cette instance.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="mt-4 space-y-4">
          {/* Liste des slots existants */}
          <div>
            <FieldLabel className="mb-2">Cuistots existants</FieldLabel>
            {slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun cuistot pour le moment
              </p>
            ) : (
              <div className="space-y-2">
                {slots.map((slot) => (
                  <UserHoverCard user={slot.user}>
                    <div
                      key={slot.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                    >
                      {slot.name}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteSlot(slot.id)}
                        disabled={deletingSlotId === slot.id}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Supprimer</span>
                      </Button>
                    </div>
                  </UserHoverCard>
                ))}
              </div>
            )}
          </div>

          {/* Formulaire pour ajouter un slot */}
          <form onSubmit={handleAddSlot} className="space-y-4">
            <Field>
              <FieldLabel>Ajouter un cuistot</FieldLabel>
              <FieldContent>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Nom du cuistot"
                    value={newSlotName}
                    onChange={(e) => setNewSlotName(e.target.value)}
                    disabled={isLoading}
                  />
                  <Button type="submit" disabled={isLoading} size="icon">
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">Ajouter</span>
                  </Button>
                </div>
              </FieldContent>
              {error && <FieldError>{error}</FieldError>}
            </Field>
          </form>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Fermer</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
