"use client";

import { useState } from "react";
import { IngredientHoverCard } from "@/components/ingredient-hover-card";
import { DeleteIngredientButton } from "@/components/delete-ingredient-button";
import { EditIngredientDialog } from "@/components/edit-ingredient-dialog";
import { Ingredient, MealIngredient } from "@/generated/prisma/client";

type IngredientCardProps = {
  mealIngredient: MealIngredient & {
    ingredient: Ingredient;
  };
  isMealOwner: boolean;
};

export function IngredientCard({
  mealIngredient,
  isMealOwner,
}: IngredientCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  return (
    <>
      <div
        className={`
          group relative flex items-center justify-between p-4 rounded-2xl border bg-primary/10
          ${isMealOwner ? "cursor-pointer hover:bg-primary/20 transition-colors" : ""}
        `}
        onClick={() => {
          if (isMealOwner) {
            setIsEditDialogOpen(true);
          }
        }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Ingredient info */}
          <div className="flex-1 min-w-0">
            <IngredientHoverCard ingredient={mealIngredient.ingredient}>
              <span className="font-semibold text-lg text-foreground block truncate">
                {mealIngredient.ingredient.name}
              </span>
            </IngredientHoverCard>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="font-semibold text-md text-foreground/80 py-0.5">
                {mealIngredient.quantity} {mealIngredient.unit}
              </span>
            </div>
          </div>
        </div>

        {/* Delete button - only show on hover if owner */}
        {isMealOwner && (
          <div
            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-2"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <DeleteIngredientButton
              ingredientId={mealIngredient.id}
              ingredientName={mealIngredient.ingredient.name}
            />
          </div>
        )}
      </div>

      {isMealOwner && (
        <EditIngredientDialog
          mealIngredient={mealIngredient}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
        />
      )}
    </>
  );
}
