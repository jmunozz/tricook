"use client";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Ingredient } from "@/generated/prisma/client";
import { IngredientIcon } from "./ingredient-icon";

type IngredientHoverCardProps = {
  ingredient: Ingredient;
  children: React.ReactNode;
};

export function IngredientHoverCard({
  ingredient,
  children,
}: IngredientHoverCardProps) {
  if (!ingredient.category) {
    return <>{children}</>;
  }

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <span className="cursor-pointer">{children}</span>
      </HoverCardTrigger>
      <HoverCardContent className="w-64">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-muted p-2">
            <IngredientIcon ingredient={ingredient} size={24} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">{ingredient.name}</p>
            <p className="text-sm text-muted-foreground">
              {ingredient.category}
            </p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
