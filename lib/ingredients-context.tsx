"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

type Ingredient = {
  id: string;
  name: string;
  category: string | null;
  defaultUnit: string | null;
};

type IngredientsContextType = {
  ingredients: Ingredient[];
  isLoading: boolean;
  error: string | null;
};

const IngredientsContext = createContext<IngredientsContextType | undefined>(
  undefined
);

export function IngredientsProvider({ children }: { children: ReactNode }) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchIngredients() {
      try {
        const response = await fetch("/api/ingredients");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Erreur lors du chargement des ingrédients"
          );
        }

        setIngredients(data.ingredients || []);
        setIsLoading(false);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Une erreur est survenue"
        );
        setIsLoading(false);
      }
    }

    fetchIngredients();
  }, []);

  return (
    <IngredientsContext.Provider value={{ ingredients, isLoading, error }}>
      {children}
    </IngredientsContext.Provider>
  );
}

export function useIngredients() {
  const context = useContext(IngredientsContext);
  if (context === undefined) {
    throw new Error(
      "useIngredients must be used within an IngredientsProvider"
    );
  }
  return context;
}
