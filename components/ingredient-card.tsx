"use client";

import { IngredientHoverCard } from "@/components/ingredient-hover-card";
import { DeleteIngredientButton } from "@/components/delete-ingredient-button";
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
  return (
    <div
      className={`
        group relative flex items-center justify-between p-4 rounded-2xl border-2

      `}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Ingredient info */}
        <div className="flex-1 min-w-0">
          <IngredientHoverCard ingredient={mealIngredient.ingredient}>
            <span className="font-semibold text-md text-gray-900 block truncate">
              {mealIngredient.ingredient.name}
            </span>
          </IngredientHoverCard>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-xs font-medium text-gray-600 bg-white/60 px-2 py-0.5 rounded-full">
              {mealIngredient.quantity} {mealIngredient.unit}
            </span>
          </div>
        </div>
      </div>

      {/* Delete button - only show on hover if owner */}
      {isMealOwner && (
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-2">
          <DeleteIngredientButton
            ingredientId={mealIngredient.id}
            ingredientName={mealIngredient.ingredient.name}
          />
        </div>
      )}
    </div>
  );
}
