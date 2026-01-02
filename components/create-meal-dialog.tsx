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
import { Plus } from "lucide-react";

type Slot = {
  id: string;
  name: string;
  userId: string | null;
};

export function CreateMealDialog({
  instanceId,
  slots,
}: {
  instanceId: string;
  slots: Slot[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"breakfast" | "lunch" | "dinner">("lunch");
  const [date, setDate] = useState("");
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Le nom du repas est requis");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/meals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          type,
          date: date || null,
          instanceId,
          slotIds: selectedSlots,
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
      setName("");
      setDate("");
      setSelectedSlots([]);
      setType("lunch");
      router.refresh();
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  const toggleSlot = (slotId: string) => {
    setSelectedSlots((prev) =>
      prev.includes(slotId)
        ? prev.filter((id) => id !== slotId)
        : [...prev, slotId]
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un repas
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="default" className="max-w-md">
        <form onSubmit={handleSubmit}>
          <AlertDialogHeader>
            <AlertDialogTitle>Ajouter un nouveau repas</AlertDialogTitle>
            <AlertDialogDescription>
              Créez un nouveau repas pour cette instance.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="mt-4 space-y-4">
            <Field>
              <FieldLabel>Nom du repas</FieldLabel>
              <FieldContent>
                <Input
                  type="text"
                  placeholder="Ex: Spaghetti carbonara"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Type de repas</FieldLabel>
              <FieldContent>
                <Select
                  value={type}
                  onValueChange={(value) =>
                    setType(value as "breakfast" | "lunch" | "dinner")
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">Petit-déjeuner</SelectItem>
                    <SelectItem value="lunch">Déjeuner</SelectItem>
                    <SelectItem value="dinner">Dîner</SelectItem>
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Date (optionnel)</FieldLabel>
              <FieldContent>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={isLoading}
                />
              </FieldContent>
            </Field>

            {slots.length > 0 && (
              <Field>
                <FieldLabel>Assigner à (optionnel)</FieldLabel>
                <FieldContent>
                  <div className="space-y-2">
                    {slots.map((slot) => (
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
            )}

            {error && <FieldError>{error}</FieldError>}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Création..." : "Créer"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
