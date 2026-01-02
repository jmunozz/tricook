/**
 * Unités autorisées pour les ingrédients dans les recettes
 */
export const INGREDIENT_UNITS = [
  // Unités de poids
  "g", // grammes
  "kg", // kilogrammes

  // Unités de volume (liquide)
  "ml", // millilitres
  "cl", // centilitres
  "l", // litres
  "c. à café", // cuillère à café
  "c. à soupe", // cuillère à soupe

  // Unités de quantité
  "unité", // unité (ex: unité de fromage)
  "pièce", // pièce
  "entier", // entier
  "tête", // tête (ex: tête de salade)
  "gousse", // gousse (ex: gousse d'ail)
  "botte", // botte
  "brin", // brin (ex: brin de romarin)
  "feuille", // feuille
  "tranche", // tranche
  "pincée", // pincée
  "filet", // filet

  // Autres unités courantes
  "boîte", // boîte
  "paquet", // paquet
  "sachet", // sachet
  "pot", // pot
] as const;

/**
 * Type pour les unités d'ingrédients
 */
export type IngredientUnit = (typeof INGREDIENT_UNITS)[number];

/**
 * Catégories disponibles pour les ingrédients
 */
export const INGREDIENT_CATEGORIES = [
  "Fruits et légumes",
  "Crèmerie et produits laitiers",
  "Viandes et poissons",
  "Charcuterie et traiteur",
  "Surgelés",
  "Bébé",
  "Épicerie sucrée",
  "Épicerie salée",
  "Boissons",
  "Pains et pâtisseries",
  "Bio et écologie",
  "Entretien et nettoyage",
  "Hygiène et beauté",
  "Parapharmacie",
  "Prouits du monde",
  "Nutrition et végétal",
  "Épices et condiments",
  "Autre",
] as const;

export const INGREDIENT_CATEGORY_ICONS: Record<IngredientCategory, string> = {
  "Fruits et légumes": "/vegetables_icon.png",
  "Crèmerie et produits laitiers": "/dairy_icon.png",
  "Viandes et poissons": "/meat_fish_icon.png",
  "Charcuterie et traiteur": "/meat_fish_icon.png",
  Surgelés: "/frozen_icon.png",
  Bébé: "/baby_icon.png",
  "Épicerie sucrée": "/sweet_grocery_icon.png",
  "Épicerie salée": "/salt_grocery_icon.png",
  Boissons: "/beverage_icon.png",
  "Pains et pâtisseries": "/other_icon.png",
  "Bio et écologie": "/bio_icon.png",
  "Entretien et nettoyage": "/other_icon.png",
  "Hygiène et beauté": "/other_icon.png",
  Parapharmacie: "/other_icon.png",
  "Prouits du monde": "/world_food_icon.png",
  "Nutrition et végétal": "/bio_icon.png",
  Autre: "/other_icon.png",
  "Épices et condiments": "/other_icon.png",
};
/**
 * Type pour les catégories d'ingrédients
 */
export type IngredientCategory = (typeof INGREDIENT_CATEGORIES)[number];
