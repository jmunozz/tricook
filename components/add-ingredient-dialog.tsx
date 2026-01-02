"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { INGREDIENT_UNITS, INGREDIENT_CATEGORIES } from "@/lib/constants";
import { useIngredients } from "@/lib/ingredients-context";
import { Plus, Check, ChevronsUpDown, Upload, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

type Ingredient = {
  id: string;
  name: string;
  category?: string | null;
  defaultUnit?: string | null;
};

export function AddIngredientDialog({
  mealId,
  instanceId,
  availableIngredients,
}: {
  mealId: string;
  instanceId: string;
  availableIngredients: Ingredient[];
}) {
  const router = useRouter();
  const { ingredients: globalIngredients } = useIngredients();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [ingredientOpen, setIngredientOpen] = useState(false);
  const [ingredientId, setIngredientId] = useState("");
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [newIngredientCategory, setNewIngredientCategory] =
    useState<string>("");
  const [newIngredientDefaultUnit, setNewIngredientDefaultUnit] =
    useState<string>("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingIngredient, setIsCreatingIngredient] = useState(false);
  const [localIngredients, setLocalIngredients] =
    useState(availableIngredients);
  // Bulk import state
  const [bulkText, setBulkText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parsedIngredients, setParsedIngredients] = useState<{
    existing: Array<{
      ingredientId: string;
      name: string;
      quantity: number;
      unit: string;
    }>;
    new: Array<{
      name: string;
      quantity: number;
      unit: string;
      category: string;
    }>;
  }>({ existing: [], new: [] });

  // Combiner les ingrédients globaux avec les ingrédients de l'instance
  const allIngredients = [
    ...globalIngredients,
    ...localIngredients.map((ing) => ({
      id: ing.id,
      name: ing.name,
      category: ing.category || null,
      defaultUnit: ing.defaultUnit || null,
    })),
  ].filter(
    (ing, index, self) => index === self.findIndex((i) => i.id === ing.id)
  );

  // Vérifier si l'ingrédient recherché existe
  const searchValue = ingredientSearch.toLowerCase().trim();
  const ingredientExists = searchValue
    ? allIngredients.some((ing) => ing.name.toLowerCase() === searchValue)
    : true;

  // Filtrer les ingrédients pour ne montrer que les correspondances exactes ou partielles
  // Si on a une recherche, on filtre, sinon on montre tout
  const filteredIngredients = searchValue
    ? allIngredients.filter((ing) =>
        ing.name.toLowerCase().includes(searchValue)
      )
    : allIngredients;

  // Vérifier s'il y a une correspondance exacte dans les résultats filtrés
  const hasExactMatch = searchValue
    ? filteredIngredients.some((ing) => ing.name.toLowerCase() === searchValue)
    : false;

  const selectedIngredient = allIngredients.find(
    (ing) => ing.id === ingredientId
  );

  // Définir l'unité par défaut quand un ingrédient est sélectionné
  useEffect(() => {
    if (selectedIngredient?.defaultUnit && !unit) {
      setUnit(selectedIngredient.defaultUnit);
    }
  }, [selectedIngredient, unit]);

  const handleCreateIngredient = async (ingredientName: string) => {
    if (!ingredientName.trim()) {
      return;
    }

    if (!newIngredientCategory) {
      setError("Veuillez sélectionner une catégorie");
      return;
    }

    setIsCreatingIngredient(true);
    setError("");

    try {
      const response = await fetch("/api/ingredients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: ingredientName,
          instanceId,
          category: newIngredientCategory,
          defaultUnit: newIngredientDefaultUnit || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Une erreur est survenue lors de la création");
        setIsCreatingIngredient(false);
        return;
      }

      // Ajouter le nouvel ingrédient à la liste locale
      const newIngredient = data.ingredient;
      setLocalIngredients((prev) => [...prev, newIngredient]);
      setIngredientId(newIngredient.id);
      setIngredientOpen(false);
      setNewIngredientCategory("");
      setNewIngredientDefaultUnit("");
      setIsCreatingIngredient(false);
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
      setIsCreatingIngredient(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!ingredientId) {
      setError("Veuillez sélectionner un ingrédient");
      return;
    }

    const quantityNum = parseFloat(quantity);
    if (!quantity || isNaN(quantityNum) || quantityNum <= 0) {
      setError("Veuillez entrer une quantité valide");
      return;
    }

    if (!unit) {
      setError("Veuillez sélectionner une unité");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/meals/ingredients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mealId,
          ingredientId,
          quantity: quantityNum,
          unit,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Une erreur est survenue");
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      setOpen(false);
      setIngredientId("");
      setIngredientSearch("");
      setQuantity("");
      setUnit("");
      setIngredientOpen(false);
      router.refresh();
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  const handleParseIngredients = async () => {
    if (!bulkText.trim()) {
      setError("Veuillez entrer une liste d'ingrédients");
      return;
    }

    setIsParsing(true);
    setError("");

    try {
      const response = await fetch("/api/meals/ingredients/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: bulkText, instanceId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erreur lors de l'analyse");
        setIsParsing(false);
        return;
      }

      if (
        (!data.existing || data.existing.length === 0) &&
        (!data.new || data.new.length === 0)
      ) {
        setError("Aucun ingrédient trouvé dans le texte");
        setIsParsing(false);
        return;
      }

      setParsedIngredients({
        existing: data.existing || [],
        new: data.new || [],
      });
      setIsParsing(false);
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
      setIsParsing(false);
    }
  };

  const handleAddBulkIngredients = async () => {
    const totalIngredients =
      parsedIngredients.existing.length + parsedIngredients.new.length;

    if (totalIngredients === 0) {
      setError("Aucun ingrédient à ajouter");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const results: string[] = [];
      const errors: string[] = [];

      // First, create new ingredients
      const newIngredientIds = new Map<string, string>();

      for (const newIng of parsedIngredients.new) {
        try {
          const createResponse = await fetch("/api/ingredients", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: newIng.name,
              instanceId,
              category: newIng.category,
              defaultUnit: newIng.unit || null,
            }),
          });

          const createData = await createResponse.json();
          if (!createResponse.ok) {
            errors.push(`${newIng.name}: ${createData.error}`);
            continue;
          }

          newIngredientIds.set(newIng.name, createData.ingredient.id);
          setLocalIngredients((prev) => [...prev, createData.ingredient]);
        } catch (err) {
          errors.push(`${newIng.name}: Erreur lors de la création`);
        }
      }

      // Then, add all ingredients (existing + newly created) to the meal
      const allToAdd = [
        ...parsedIngredients.existing,
        ...parsedIngredients.new
          .map((newIng) => {
            const ingredientId = newIngredientIds.get(newIng.name);
            if (!ingredientId) return null;
            return {
              ingredientId,
              name: newIng.name,
              quantity: newIng.quantity,
              unit: newIng.unit,
            };
          })
          .filter((ing): ing is NonNullable<typeof ing> => ing !== null),
      ];

      for (const ing of allToAdd) {
        try {
          const addResponse = await fetch("/api/meals/ingredients", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              mealId,
              ingredientId: ing.ingredientId,
              quantity: ing.quantity,
              unit: ing.unit,
            }),
          });

          if (!addResponse.ok) {
            const addData = await addResponse.json();
            errors.push(`${ing.name}: ${addData.error}`);
          } else {
            results.push(ing.name);
          }
        } catch (err) {
          errors.push(`${ing.name}: Erreur lors de l'ajout`);
        }
      }

      setIsLoading(false);

      if (errors.length > 0) {
        setError(
          `${errors.length} erreur(s): ${errors.slice(0, 3).join(", ")}${
            errors.length > 3 ? "..." : ""
          }`
        );
      }

      if (results.length > 0) {
        setOpen(false);
        setBulkText("");
        setParsedIngredients({ existing: [], new: [] });
        router.refresh();
      }
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setIngredientId("");
      setIngredientSearch("");
      setNewIngredientCategory("");
      setNewIngredientDefaultUnit("");
      setQuantity("");
      setUnit("");
      setError("");
      setBulkText("");
      setParsedIngredients({ existing: [], new: [] });
      setMode("single");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un ingrédient
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un ingrédient</DialogTitle>
          <DialogDescription>
            Ajoutez un ingrédient requis pour ce repas.
          </DialogDescription>
        </DialogHeader>

        {/* Mode toggle */}
        <div className="flex gap-2 border-b pb-2">
          <Button
            type="button"
            variant={mode === "single" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode("single")}
            className="flex-1"
          >
            <Plus className="mr-2 h-4 w-4" />
            Un par un
          </Button>
          <Button
            type="button"
            variant={mode === "bulk" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode("bulk")}
            className="flex-1"
          >
            <Upload className="mr-2 h-4 w-4" />
            Import en masse
          </Button>
        </div>

        {mode === "single" ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field>
              <FieldLabel>Ingrédient</FieldLabel>
              <FieldContent>
                <Popover open={ingredientOpen} onOpenChange={setIngredientOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={ingredientOpen}
                      className="w-full justify-between"
                      disabled={isLoading || isCreatingIngredient}
                      type="button"
                    >
                      {selectedIngredient
                        ? selectedIngredient.name
                        : ingredientSearch || "Sélectionner un ingrédient..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="p-0"
                    align="start"
                    style={{ width: "var(--radix-popover-trigger-width)" }}
                  >
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Rechercher un ingrédient..."
                        value={ingredientSearch}
                        onValueChange={setIngredientSearch}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {searchValue && !hasExactMatch ? (
                            <div className="py-2 px-2 space-y-3">
                              <div>
                                <label className="text-sm font-medium mb-2 block">
                                  Catégorie
                                </label>
                                <Select
                                  value={newIngredientCategory}
                                  onValueChange={setNewIngredientCategory}
                                  disabled={isCreatingIngredient}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Sélectionner une catégorie" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {INGREDIENT_CATEGORIES.map((cat) => (
                                      <SelectItem key={cat} value={cat}>
                                        {cat}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="text-sm font-medium mb-2 block">
                                  Unité par défaut (optionnel)
                                </label>
                                <Select
                                  value={newIngredientDefaultUnit}
                                  onValueChange={setNewIngredientDefaultUnit}
                                  disabled={isCreatingIngredient}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Sélectionner une unité par défaut" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {INGREDIENT_UNITS.map((u) => (
                                      <SelectItem key={u} value={u}>
                                        {u}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() =>
                                  handleCreateIngredient(searchValue)
                                }
                                disabled={
                                  isCreatingIngredient || !newIngredientCategory
                                }
                              >
                                {isCreatingIngredient
                                  ? "Création..."
                                  : `Créer "${searchValue}"`}
                              </Button>
                              <p className="text-xs text-muted-foreground text-center">
                                Cet ingrédient sera disponible uniquement pour
                                cette instance en attendant l'approbation
                              </p>
                            </div>
                          ) : (
                            "Aucun ingrédient trouvé."
                          )}
                        </CommandEmpty>
                        <CommandGroup>
                          {filteredIngredients.map((ingredient) => (
                            <CommandItem
                              key={ingredient.id}
                              value={ingredient.name}
                              onSelect={() => {
                                setIngredientId(ingredient.id);
                                setIngredientSearch("");
                                setIngredientOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  ingredientId === ingredient.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {ingredient.name}
                            </CommandItem>
                          ))}
                          {searchValue && !hasExactMatch && (
                            <div className="py-2 px-2 space-y-3 border-t">
                              <div>
                                <label className="text-sm font-medium mb-2 block">
                                  Catégorie
                                </label>
                                <Select
                                  value={newIngredientCategory}
                                  onValueChange={setNewIngredientCategory}
                                  disabled={isCreatingIngredient}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Sélectionner une catégorie" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {INGREDIENT_CATEGORIES.map((cat) => (
                                      <SelectItem key={cat} value={cat}>
                                        {cat}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="text-sm font-medium mb-2 block">
                                  Unité par défaut (optionnel)
                                </label>
                                <Select
                                  value={newIngredientDefaultUnit}
                                  onValueChange={setNewIngredientDefaultUnit}
                                  disabled={isCreatingIngredient}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Sélectionner une unité par défaut" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {INGREDIENT_UNITS.map((u) => (
                                      <SelectItem key={u} value={u}>
                                        {u}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() =>
                                  handleCreateIngredient(searchValue)
                                }
                                disabled={
                                  isCreatingIngredient || !newIngredientCategory
                                }
                              >
                                {isCreatingIngredient
                                  ? "Création..."
                                  : `Créer "${searchValue}"`}
                              </Button>
                              <p className="text-xs text-muted-foreground text-center">
                                Cet ingrédient sera disponible uniquement pour
                                cette instance en attendant l'approbation
                              </p>
                            </div>
                          )}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </FieldContent>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Quantité</FieldLabel>
                <FieldContent>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="Ex: 200"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    disabled={isLoading}
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Unité</FieldLabel>
                <FieldContent>
                  <Select
                    value={unit}
                    onValueChange={setUnit}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unité" />
                    </SelectTrigger>
                    <SelectContent>
                      {INGREDIENT_UNITS.map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>
            </div>

            {error && <FieldError>{error}</FieldError>}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Ajout..." : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <Field>
              <FieldLabel>
                Liste d'ingrédients (copier-coller votre liste)
              </FieldLabel>
              <FieldContent>
                <Textarea
                  placeholder="Exemple:&#10;200g de tomates&#10;2 oeufs&#10;500ml de lait&#10;1 botte de persil"
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  disabled={isParsing || isLoading}
                  className="min-h-32"
                />
              </FieldContent>
              <p className="text-xs text-muted-foreground mt-1">
                Collez votre liste d'ingrédients avec quantités. L'IA analysera
                et extraira les informations.
              </p>
            </Field>

            {(parsedIngredients.existing.length > 0 ||
              parsedIngredients.new.length > 0) && (
              <div className="border rounded-lg p-4 space-y-4 max-h-64 overflow-y-auto">
                <p className="text-sm font-medium mb-2">
                  Ingrédients détectés (
                  {parsedIngredients.existing.length +
                    parsedIngredients.new.length}
                  ):
                </p>

                {parsedIngredients.existing.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Existants ({parsedIngredients.existing.length})
                    </p>
                    <div className="space-y-2">
                      {parsedIngredients.existing.map((ing, index) => (
                        <div
                          key={index}
                          className="text-sm p-2 rounded flex items-center justify-between"
                        >
                          <span>
                            <strong>{ing.name}</strong> - {ing.quantity}{" "}
                            {ing.unit}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ✓ Existant
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {parsedIngredients.new.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Nouveaux ({parsedIngredients.new.length})
                    </p>
                    <div className="space-y-2">
                      {parsedIngredients.new.map((ing, index) => (
                        <div
                          key={index}
                          className="text-sm p-2 rounded flex items-center justify-between"
                        >
                          <span>
                            <strong>{ing.name}</strong> - {ing.quantity}{" "}
                            {ing.unit}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {ing.category}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && <FieldError>{error}</FieldError>}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleParseIngredients}
                disabled={isParsing || isLoading || !bulkText.trim()}
                className="flex-1"
              >
                {isParsing ? "Analyse..." : "Analyser"}
              </Button>
              {(parsedIngredients.existing.length > 0 ||
                parsedIngredients.new.length > 0) && (
                <Button
                  type="button"
                  onClick={handleAddBulkIngredients}
                  disabled={isLoading || isParsing}
                  className="flex-1"
                >
                  {isLoading
                    ? "Ajout..."
                    : `Ajouter (${
                        parsedIngredients.existing.length +
                        parsedIngredients.new.length
                      })`}
                </Button>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading || isParsing}
              >
                Fermer
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
