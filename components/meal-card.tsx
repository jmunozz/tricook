import { Card, CardContent } from "@/components/ui/card";
import { Meal } from "@/generated/prisma/client";
import { Utensils, Users } from "lucide-react";

type MealWithRelations = Meal & {
  mealIngredients?: Array<{ id: string }>;
  slots?: Array<{ id: string }>;
};

// Generate a unique pattern based on meal ID
function generatePattern(id: string) {
  // Use the ID to generate consistent colors and shapes
  const hash = id.split("").reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  const hue = Math.abs(hash) % 360;
  const saturation = 50 + (Math.abs(hash) % 30);
  const lightness = 60 + (Math.abs(hash) % 20);

  const color1 = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  const color2 = `hsl(${(hue + 60) % 360}, ${saturation}%, ${lightness + 10}%)`;
  const color3 = `hsl(${(hue + 120) % 360}, ${saturation}%, ${
    lightness - 10
  }%)`;

  const shapeType = Math.abs(hash) % 3;
  const size = 200;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient
          id={`gradient-${id}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor={color1} />
          <stop offset="50%" stopColor={color2} />
          <stop offset="100%" stopColor={color3} />
        </linearGradient>
      </defs>
      <rect width={size} height={size} fill={`url(#gradient-${id})`} />
      {shapeType === 0 && (
        <>
          <circle
            cx={size * 0.3}
            cy={size * 0.3}
            r={size * 0.15}
            fill={color2}
            opacity="0.6"
          />
          <circle
            cx={size * 0.7}
            cy={size * 0.7}
            r={size * 0.2}
            fill={color3}
            opacity="0.5"
          />
        </>
      )}
      {shapeType === 1 && (
        <>
          <polygon
            points={`${size * 0.5},${size * 0.2} ${size * 0.2},${size * 0.8} ${
              size * 0.8
            },${size * 0.8}`}
            fill={color2}
            opacity="0.4"
          />
          <rect
            x={size * 0.3}
            y={size * 0.3}
            width={size * 0.4}
            height={size * 0.4}
            fill={color3}
            opacity="0.3"
            transform={`rotate(${hash % 45} ${size * 0.5} ${size * 0.5})`}
          />
        </>
      )}
      {shapeType === 2 && (
        <>
          <ellipse
            cx={size * 0.5}
            cy={size * 0.3}
            rx={size * 0.25}
            ry={size * 0.15}
            fill={color2}
            opacity="0.5"
          />
          <ellipse
            cx={size * 0.3}
            cy={size * 0.7}
            rx={size * 0.2}
            ry={size * 0.3}
            fill={color3}
            opacity="0.4"
          />
          <ellipse
            cx={size * 0.7}
            cy={size * 0.7}
            rx={size * 0.15}
            ry={size * 0.25}
            fill={color1}
            opacity="0.5"
          />
        </>
      )}
    </svg>
  );
}

export function MealCard({ meal }: { meal: MealWithRelations }) {
  const ingredientCount = meal.mealIngredients?.length ?? 0;
  const cuistotCount = meal.slots?.length ?? 0;

  return (
    <Card
      key={meal.id}
      size="sm"
      className="hover:ring-primary transition-all h-full flex flex-col overflow-hidden pt-0!"
    >
      {/* Image placeholder with generated pattern */}
      <div className="w-full h-40 bg-muted relative overflow-hidden">
        {generatePattern(meal.id)}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3">
        <h3 className="text-lg font-semibold line-clamp-2">{meal.name}</h3>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Utensils className="h-4 w-4" />
            <span>
              {ingredientCount} ingrédient{ingredientCount !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span>
              {cuistotCount} cuistot{cuistotCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
