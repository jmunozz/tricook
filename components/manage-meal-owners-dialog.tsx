"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { Plus, LogOut, UserPlus, Settings, X } from "lucide-react";
import { SlotUser } from "@/components/slot-user";
import { Slot } from "@/generated/prisma/client";

type SimpleSlot = {
  id: string;
  name: string;
  userId: string | null;
};

type MealSlot = Slot & { user: { email: string } | null | undefined };

export function ManageMealOwnersDialog({
  mealId,
  instanceId,
  availableSlots,
  currentMealSlots,
  currentUserId,
  isMealOwner,
  isLastOwner,
  mealName,
}: {
  mealId: string;
  instanceId: string;
  availableSlots: SimpleSlot[];
  currentMealSlots: MealSlot[];
  currentUserId: string;
  isMealOwner: boolean;
  isLastOwner: boolean;
  mealName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [actionType, setActionType] = useState<
    "add" | "leave" | "join" | "remove" | null
  >(null);
  const [removingSlotId, setRemovingSlotId] = useState<string | null>(null);

  const toggleSlot = (slotId: string) => {
    setSelectedSlots((prev) =>
      prev.includes(slotId)
        ? prev.filter((id) => id !== slotId)
        : [...prev, slotId]
    );
  };

  const handleAddOwners = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (selectedSlots.length === 0) {
      setError("Veuillez sélectionner au moins un membre");
      return;
    }

    setIsLoading(true);
    setActionType("add");

    try {
      // Add slots one by one
      for (const slotId of selectedSlots) {
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
          setActionType(null);
          return;
        }
      }

      setIsLoading(false);
      setOpen(false);
      setSelectedSlots([]);
      setActionType(null);
      router.refresh();
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
      setIsLoading(false);
      setActionType(null);
    }
  };

  const handleRemoveOwner = async (slotId: string) => {
    if (
      !confirm("Êtes-vous sûr de vouloir retirer ce propriétaire du repas ?")
    ) {
      return;
    }

    setIsLoading(true);
    setActionType("remove");
    setRemovingSlotId(slotId);

    try {
      const response = await fetch(
        `/api/meals/owners?mealId=${mealId}&slotId=${slotId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Une erreur est survenue");
        setIsLoading(false);
        setActionType(null);
        setRemovingSlotId(null);
        return;
      }

      setIsLoading(false);
      setActionType(null);
      setRemovingSlotId(null);

      if (data.deleted) {
        // Le repas a été supprimé, rediriger vers l'instance
        router.push(`/instances/${instanceId}`);
      } else {
        // Le repas existe encore, rafraîchir la page
        router.refresh();
      }
    } catch (err) {
      alert("Une erreur est survenue. Veuillez réessayer.");
      setIsLoading(false);
      setActionType(null);
      setRemovingSlotId(null);
    }
  };

  const handleLeave = async () => {
    setIsLoading(true);
    setActionType("leave");

    try {
      const response = await fetch(`/api/meals/owners?mealId=${mealId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Une erreur est survenue");
        setIsLoading(false);
        setActionType(null);
        return;
      }

      setIsLoading(false);
      setOpen(false);
      setActionType(null);

      if (data.deleted) {
        // Le repas a été supprimé, rediriger vers l'instance
        router.push(`/instances/${instanceId}`);
      } else {
        // Le repas existe encore, rafraîchir la page
        router.refresh();
      }
    } catch (err) {
      alert("Une erreur est survenue. Veuillez réessayer.");
      setIsLoading(false);
      setActionType(null);
    }
  };

  const handleJoin = async () => {
    setIsLoading(true);
    setActionType("join");

    try {
      const response = await fetch("/api/meals/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mealId,
          instanceId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Une erreur est survenue");
        setIsLoading(false);
        setActionType(null);
        return;
      }

      setIsLoading(false);
      setOpen(false);
      setActionType(null);
      router.refresh();
    } catch (err) {
      alert("Une erreur est survenue. Veuillez réessayer.");
      setIsLoading(false);
      setActionType(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Settings className="h-4 w-4" />
          <span className="sr-only">Gérer les propriétaires</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gérer les propriétaires</DialogTitle>
          <DialogDescription>
            Ajoutez des membres au repas ou retirez-vous.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {isMealOwner ? (
            <>
              {/* Add owner section */}
              {availableSlots.length > 0 && (
                <form onSubmit={handleAddOwners}>
                  <Field>
                    <FieldLabel>Ajouter des propriétaires</FieldLabel>
                    <FieldContent>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {availableSlots.map((slot) => (
                          <label
                            key={slot.id}
                            className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-muted/50"
                          >
                            <input
                              type="checkbox"
                              checked={selectedSlots.includes(slot.id)}
                              onChange={() => toggleSlot(slot.id)}
                              disabled={isLoading}
                              className="rounded"
                            />
                            <span className="text-sm">{slot.name}</span>
                          </label>
                        ))}
                      </div>
                    </FieldContent>
                  </Field>

                  {error && <FieldError>{error}</FieldError>}

                  <div className="flex justify-end mt-4">
                    <Button
                      type="submit"
                      disabled={isLoading || selectedSlots.length === 0}
                      size="sm"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {isLoading && actionType === "add"
                        ? "Ajout..."
                        : "Ajouter"}
                    </Button>
                  </div>
                </form>
              )}

              {/* Current meal owners */}
              {currentMealSlots.length > 0 && (
                <>
                  {availableSlots.length > 0 && <Separator />}
                  <div>
                    <FieldLabel className="mb-2">
                      Propriétaires actuels ({currentMealSlots.length})
                    </FieldLabel>
                    <div className="space-y-2">
                      {currentMealSlots.map((slot) => {
                        const isCurrentUser = slot.userId === currentUserId;
                        return (
                          <div
                            key={slot.id}
                            className="flex items-center justify-between gap-2 p-2 rounded-lg border"
                          >
                            <SlotUser slot={slot} />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleRemoveOwner(slot.id)}
                              disabled={
                                isLoading ||
                                (isLastOwner && currentMealSlots.length === 1)
                              }
                              title={
                                isLastOwner && currentMealSlots.length === 1
                                  ? "Impossible de retirer le dernier propriétaire"
                                  : "Retirer ce propriétaire"
                              }
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* Leave meal section */}
              {(availableSlots.length > 0 || currentMealSlots.length > 0) && (
                <Separator />
              )}

              <div>
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    {isLastOwner
                      ? "Vous êtes le dernier propriétaire. Si vous vous retirez, le repas sera supprimé."
                      : "Vous pouvez vous retirer du repas à tout moment."}
                  </p>
                </div>
                <Button
                  onClick={handleLeave}
                  disabled={isLoading}
                  variant={isLastOwner ? "destructive" : "outline"}
                  size="sm"
                  className="w-full"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {isLoading && actionType === "leave"
                    ? "Traitement..."
                    : isLastOwner
                    ? "Supprimer le repas"
                    : "Se retirer"}
                </Button>
              </div>
            </>
          ) : (
            /* Join meal section */
            <>
              {currentMealSlots.length > 0 && (
                <div>
                  <FieldLabel className="mb-2">
                    Propriétaires actuels ({currentMealSlots.length})
                  </FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {currentMealSlots.map((slot) => (
                      <SlotUser key={slot.id} slot={slot} />
                    ))}
                  </div>
                </div>
              )}
              {currentMealSlots.length > 0 && <Separator />}
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Rejoignez ce repas pour pouvoir le modifier et ajouter des
                  ingrédients.
                </p>
                <Button
                  onClick={handleJoin}
                  disabled={isLoading}
                  className="w-full"
                  size="sm"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  {isLoading && actionType === "join"
                    ? "Rejoindre..."
                    : "Rejoindre le repas"}
                </Button>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
