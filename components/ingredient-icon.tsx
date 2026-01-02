import Image from "next/image";
import { getCategoryIcon } from "@/lib/ingredient-category-icons";
import type { IngredientCategory } from "@/lib/constants";

type Ingredient = {
  category?: string | null;
};

type IngredientIconProps = {
  ingredient: Ingredient;
  size?: number;
  className?: string;
};

/**
 * Component that displays the category icon for an ingredient
 */
export function IngredientIcon({
  ingredient,
  size = 20,
  className = "",
}: IngredientIconProps) {
  const iconPath = getCategoryIcon(
    ingredient.category as IngredientCategory | null | undefined
  );

  return (
    <img
      src={iconPath}
      alt={`${ingredient.category || "Ingredient"} icon`}
      width={size}
      height={size}
      className={className}
    />
  );
}
