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
import { INGREDIENT_UNITS } from "@/lib/constants";
import { MealIngredient, Ingredient } from "@/generated/prisma/client";

type EditIngredientDialogProps = {
  mealIngredient: MealIngredient & {
    ingredient: Ingredient;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditIngredientDialog({
  mealIngredient,
  open,
  onOpenChange,
}: EditIngredientDialogProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(mealIngredient.quantity.toString());
  const [unit, setUnit] = useState(mealIngredient.unit);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

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
      const response = await fetch(`/api/meals/ingredients/${mealIngredient.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
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
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      console.error("Erreur lors de la mise à jour:", err);
      setError("Une erreur est survenue. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit} className="contents">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Modifier l'ingrédient
            </DialogTitle>
            <DialogDescription>
              {mealIngredient.ingredient.name}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <Field>
              <FieldLabel>Quantité</FieldLabel>
              <FieldContent>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Ex: 250"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  disabled={isLoading}
                  autoFocus
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
                    <SelectValue />
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

            {error && <FieldError>{error}</FieldError>}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

