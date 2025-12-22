import Image from "next/image";
import { getCategoryIcon } from "@/lib/ingredient-category-icons";

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
  const iconPath = getCategoryIcon(ingredient.category);

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
