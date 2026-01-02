import { INGREDIENT_CATEGORY_ICONS } from "./constants";
import type { IngredientCategory } from "./constants";

/**
 * Get the icon path for a given ingredient category
 * @param category - The ingredient category
 * @returns The icon path, or a default icon if category is not found
 */
export function getCategoryIcon(
  category: IngredientCategory | null | undefined
): string {
  const defaultIcon = "/other_icon.png";

  if (!category) {
    return defaultIcon;
  }

  return INGREDIENT_CATEGORY_ICONS[category] || defaultIcon;
}
