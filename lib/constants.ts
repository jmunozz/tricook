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
  "tasse", // tasse
  "pinte", // pinte
  "quart", // quart

  // Unités de quantité
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
] as const;

/**
 * Type pour les unités d'ingrédients
 */
export type IngredientUnit = (typeof INGREDIENT_UNITS)[number];
