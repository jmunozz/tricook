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
import { INGREDIENT_UNITS } from "@/lib/constants";
import { Plus } from "lucide-react";

type Ingredient = {
  id: string;
  name: string;
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
  const [open, setOpen] = useState(false);
  const [ingredientId, setIngredientId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      router.refresh();
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un ingrédient
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="default" className="max-w-md">
        <form onSubmit={handleSubmit}>
          <AlertDialogHeader>
            <AlertDialogTitle>Ajouter un ingrédient</AlertDialogTitle>
            <AlertDialogDescription>
              Ajoutez un ingrédient requis pour ce repas.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="mt-4 space-y-4">
            <Field>
              <FieldLabel>Ingrédient</FieldLabel>
              <FieldContent>
                <Select
                  value={ingredientId}
                  onValueChange={setIngredientId}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un ingrédient" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableIngredients.map((ingredient) => (
                      <SelectItem key={ingredient.id} value={ingredient.id}>
                        {ingredient.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
