"use client";

import { useState } from "react";
import { Meal } from "@/generated/prisma/client";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Info, Users, Trash2, ChevronsUpDown, Check } from "lucide-react";
import { SlotUser } from "@/components/slot-user";
import { Slot } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

type SimpleSlot = {
  id: string;
  name: string;
  userId: string | null;
  user?: { email: string } | null;
};

type MealSlot = Slot & { user: { email: string } | null | undefined };

export function MealSettingsClient({
  meal,
  instanceId,
  allSlots,
  currentMealSlots,
  currentUserId,
  isLastOwner,
  initialSection = "infos",
}: {
  meal: Meal;
  instanceId: string;
  allSlots: SimpleSlot[];
  currentMealSlots: MealSlot[];
  currentUserId: string;
  isLastOwner: boolean;
  initialSection?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState(initialSection);
  const [name, setName] = useState(meal.name);
  const [type, setType] = useState<"breakfast" | "lunch" | "dinner">(meal.type);
  const [slotSearch, setSlotSearch] = useState("");
  const [slotOpen, setSlotOpen] = useState(false);
  const [selectedSlotIds, setSelectedSlotIds] = useState<Set<string>>(
    new Set(currentMealSlots.map((slot) => slot.id))
  );
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleUpdateMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Le nom du repas est requis");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/meals/${meal.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          type,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Une erreur est survenue");
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      router.refresh();
    } catch (err) {
      console.error("Erreur lors de la mise à jour:", err);
      setError("Une erreur est survenue. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  const handleToggleSlot = (slotId: string) => {
    setSelectedSlotIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(slotId)) {
        newSet.delete(slotId);
      } else {
        newSet.add(slotId);
      }
      return newSet;
    });
    setSlotOpen(false);
  };

  const handleSubmitOwners = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const slotIdsArray = Array.from(selectedSlotIds);
    const currentIds = new Set(currentMealSlots.map((slot) => slot.id));
    const hasChanges =
      slotIdsArray.length !== currentIds.size ||
      slotIdsArray.some((id) => !currentIds.has(id));

    if (!hasChanges) {
      setError("Aucune modification à enregistrer");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/meals/owners", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mealId: meal.id,
          slotIds: slotIdsArray,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Une erreur est survenue");
        setIsLoading(false);
        return;
      }

      // If meal was deleted (no owners), redirect
      if (data.deleted) {
        router.push(`/instances/${instanceId}`);
        return;
      }

      setIsLoading(false);
      router.refresh();
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  const handleDeleteMeal = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/meals/${meal.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Une erreur est survenue");
        setIsLoading(false);
        return;
      }

      router.push(`/instances/${instanceId}`);
    } catch (err) {
      alert("Une erreur est survenue. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  const updateSection = (section: string) => {
    setActiveSection(section);
    router.push(`${pathname}?section=${section}`, { scroll: false });
  };

  const sections = [
    { id: "infos", label: "Infos", icon: Info },
    { id: "owners", label: "Propriétaires", icon: Users },
    { id: "danger", label: "Danger", icon: Trash2 },
  ];

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <aside className="w-64 shrink-0">
        <nav className="space-y-1">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => updateSection(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  activeSection === section.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {section.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <Card>
          <CardHeader>
            <CardTitle>
              {activeSection === "infos" && "Informations du repas"}
              {activeSection === "owners" && "Gérer les propriétaires"}
              {activeSection === "danger" && "Zone de danger"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Infos Section */}
            {activeSection === "infos" && (
              <form onSubmit={handleUpdateMeal} className="space-y-4">
                <Field>
                  <FieldLabel>Nom du repas</FieldLabel>
                  <FieldContent>
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isLoading}
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
                        <SelectItem value="breakfast">
                          Petit-déjeuner
                        </SelectItem>
                        <SelectItem value="lunch">Déjeuner</SelectItem>
                        <SelectItem value="dinner">Dîner</SelectItem>
                      </SelectContent>
                    </Select>
                  </FieldContent>
                </Field>

                {error && <FieldError>{error}</FieldError>}

                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                </div>
              </form>
            )}

            {/* Owners Section */}
            {activeSection === "owners" && (
              <form onSubmit={handleSubmitOwners} className="space-y-4">
                <Field>
                  <FieldLabel>Sélectionner un cuisinier</FieldLabel>
                  <FieldContent>
                    <Popover
                      open={slotOpen}
                      onOpenChange={(open) => {
                        setSlotOpen(open);
                        if (!open) {
                          setSlotSearch("");
                        }
                      }}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={slotOpen}
                          className="w-full justify-between"
                          disabled={isLoading}
                          type="button"
                        >
                          {slotSearch || "Rechercher un cuisinier..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="p-0"
                        align="start"
                        style={{ width: "var(--radix-popover-trigger-width)" }}
                      >
                        <Command>
                          <CommandInput
                            placeholder="Rechercher un cuisinier..."
                            value={slotSearch}
                            onValueChange={setSlotSearch}
                          />
                          <CommandList>
                            <CommandEmpty>Aucun cuisinier trouvé.</CommandEmpty>
                            <CommandGroup>
                              {allSlots.map((slot) => {
                                const isSelected = selectedSlotIds.has(slot.id);
                                return (
                                  <CommandItem
                                    key={slot.id}
                                    value={slot.name}
                                    onSelect={() => handleToggleSlot(slot.id)}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        isSelected ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {slot.name}
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel>Cuisiniers</FieldLabel>
                  <FieldContent>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(selectedSlotIds).map((slotId) => {
                        const mealSlot = currentMealSlots.find(
                          (s) => s.id === slotId
                        );
                        // Use mealSlot if available, otherwise construct from allSlots
                        const slot = mealSlot
                          ? mealSlot
                          : (() => {
                              const simpleSlot = allSlots.find(
                                (s) => s.id === slotId
                              );
                              if (!simpleSlot) return null;
                              return {
                                ...simpleSlot,
                                user: simpleSlot.user || null,
                              } as MealSlot;
                            })();
                        if (!slot) return null;
                        return <SlotUser key={slotId} slot={slot} />;
                      })}
                    </div>
                  </FieldContent>
                </Field>

                {error && <FieldError>{error}</FieldError>}

                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                </div>
              </form>
            )}

            {/* Danger Section */}
            {activeSection === "danger" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Supprimer le repas
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Cette action est irréversible. Tous les ingrédients associés
                    à ce repas seront également supprimés.
                  </p>
                  <AlertDialog
                    open={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                  >
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Êtes-vous sûr de vouloir supprimer ce repas ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action est irréversible. Le repas "{meal.name}"
                          et tous ses ingrédients seront définitivement
                          supprimés.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>
                          Annuler
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteMeal}
                          disabled={isLoading}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isLoading ? "Suppression..." : "Supprimer"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button
                    variant="destructive"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    disabled={isLoading}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer le repas
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
