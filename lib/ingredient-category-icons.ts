/**
 * Mapping of ingredient categories to their corresponding icon paths
 */
export const INGREDIENT_CATEGORY_ICONS: Record<string, string> = {
  "fruit et légumes": "/vegetables_icon.png",
  "herbes et aromates": "/bio_icon.png",
  épice: "/salt_grocery_icon.png",
  "produits laitiers": "/dairy_icon.png",
  "viande et poisson": "/meat_fish_icon.png",
  féculent: "/snack_icon.png",
  autre: "/world_food_icon.png",
} as const;

/**
 * Get the icon path for a given ingredient category
 * @param category - The ingredient category
 * @returns The icon path, or a default icon if category is not found
 */
export function getCategoryIcon(category: string | null | undefined): string {
  if (!category) {
    return "/world_food_icon.png"; // Default icon
  }
  return INGREDIENT_CATEGORY_ICONS[category] || "/world_food_icon.png";
}
