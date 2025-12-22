"use client";

import { useState, useEffect } from "react";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { INGREDIENT_UNITS } from "@/lib/constants";
import { useIngredients } from "@/lib/ingredients-context";
import { Plus, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Ingredient = {
  id: string;
  name: string;
  category?: string | null;
  defaultUnit?: string | null;
};

export function AddIngredientDialog({
  mealId,
  instanceId,
  availableIngredients,
}: {
  mealId: string;
  instanceId: string;
  availableIngredients: Ingredient[];
}) {
  const router = useRouter();
  const { ingredients: globalIngredients } = useIngredients();
  const [open, setOpen] = useState(false);
  const [ingredientOpen, setIngredientOpen] = useState(false);
  const [ingredientId, setIngredientId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Combiner les ingrédients globaux avec les ingrédients de l'instance
  const allIngredients = [
    ...globalIngredients,
    ...availableIngredients.map((ing) => ({
      id: ing.id,
      name: ing.name,
      category: null,
      defaultUnit: null,
    })),
  ].filter(
    (ing, index, self) => index === self.findIndex((i) => i.id === ing.id)
  );

  const selectedIngredient = allIngredients.find(
    (ing) => ing.id === ingredientId
  );

  // Définir l'unité par défaut quand un ingrédient est sélectionné
  useEffect(() => {
    if (selectedIngredient?.defaultUnit && !unit) {
      setUnit(selectedIngredient.defaultUnit);
    }
  }, [selectedIngredient, unit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleSubmit");
    setError("");

    if (!ingredientId) {
      setError("Veuillez sélectionner un ingrédient");
      return;
    }

    const quantityNum = parseFloat(quantity);
    if (!quantity || isNaN(quantityNum) || quantityNum <= 0) {
      setError("Veuillez entrer une quantité valide");
      return;
    }

    if (!unit) {
      setError("Veuillez sélectionner une unité");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/meals/ingredients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mealId,
          ingredientId,
          quantity: quantityNum,
          unit,
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
      setIngredientId("");
      setQuantity("");
      setUnit("");
      setIngredientOpen(false);
      router.refresh();
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un ingrédient
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un ingrédient</DialogTitle>
          <DialogDescription>
            Ajoutez un ingrédient requis pour ce repas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel>Ingrédient</FieldLabel>
            <FieldContent>
              <Popover open={ingredientOpen} onOpenChange={setIngredientOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={ingredientOpen}
                    className="w-full justify-between"
                    disabled={isLoading}
                    type="button"
                  >
                    {selectedIngredient
                      ? selectedIngredient.name
                      : "Sélectionner un ingrédient..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="p-0"
                  align="start"
                  style={{ width: "var(--radix-popover-trigger-width)" }}
                >
                  <Command>
                    <CommandInput placeholder="Rechercher un ingrédient..." />
                    <CommandList>
                      <CommandEmpty>Aucun ingrédient trouvé.</CommandEmpty>
                      <CommandGroup>
                        {allIngredients.map((ingredient) => (
                          <CommandItem
                            key={ingredient.id}
                            value={ingredient.name}
                            onSelect={() => {
                              setIngredientId(ingredient.id);
                              setIngredientOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                ingredientId === ingredient.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {ingredient.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </FieldContent>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Quantité</FieldLabel>
              <FieldContent>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Ex: 200"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  disabled={isLoading}
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Unité</FieldLabel>
              <FieldContent>
                <Select
                  value={unit}
                  onValueChange={setUnit}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unité" />
                  </SelectTrigger>
                  <SelectContent>
                    {INGREDIENT_UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
          </div>

          {error && <FieldError>{error}</FieldError>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Ajout..." : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
