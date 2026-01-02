import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { INGREDIENT_UNITS, INGREDIENT_CATEGORIES } from "@/lib/constants";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { text, instanceId } = await request.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Le texte est requis" },
        { status: 400 }
      );
    }

    if (!instanceId || typeof instanceId !== "string") {
      return NextResponse.json(
        { error: "L'instanceId est requis" },
        { status: 400 }
      );
    }

    // Verify user has access to the instance
    const instance = await db.instance.findFirst({
      where: {
        id: instanceId,
        users: {
          some: {
            id: session.user.id,
          },
        },
      },
    });

    if (!instance) {
      return NextResponse.json(
        { error: "Instance non trouvée ou accès refusé" },
        { status: 403 }
      );
    }

    // Get existing ingredients (global approved + instance pending)
    const globalInstance = await db.instance.findFirst({
      where: {
        name: "Global Ingredients",
      },
    });

    const ingredientInstances = [];
    if (globalInstance) {
      ingredientInstances.push(globalInstance.id);
    }

    const existingIngredients = await db.ingredient.findMany({
      where: {
        OR: [
          {
            instanceId: { in: ingredientInstances },
            status: "approved",
          },
          {
            instanceId: instanceId,
            status: "pending",
          },
        ],
      },
      select: {
        id: true,
        name: true,
        category: true,
        defaultUnit: true,
      },
    });

    // Create a map of normalized names to ingredients for quick lookup
    const ingredientMap = new Map<string, (typeof existingIngredients)[0]>();
    existingIngredients.forEach((ing) => {
      ingredientMap.set(ing.name.toLowerCase().trim(), ing);
    });

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key n'est pas configurée" },
        { status: 500 }
      );
    }

    // Prepare the prompt for OpenAI
    const unitsList = INGREDIENT_UNITS.join(", ");
    // Build categories list with line breaks and numbers for better readability
    const categoriesList = INGREDIENT_CATEGORIES.map(
      (cat, idx) => `${idx + 1}. "${cat}"`
    ).join("\n");

    // Build list of existing ingredient names for OpenAI
    const existingNames = Array.from(ingredientMap.keys()).join(", ");

    // Create category examples using the actual categories from constants
    // This ensures we're using the exact same category names
    const categoryExamplesMap: Record<string, string[]> = {
      "Fruits et légumes": [
        "tomate",
        "pomme",
        "carotte",
        "salade",
        "banane",
        "poire",
        "fraise",
      ],
      "Crèmerie et produits laitiers": [
        "lait",
        "fromage",
        "yaourt",
        "beurre",
        "crème",
        "fromage blanc",
      ],
      "Viandes et poissons": [
        "poulet",
        "bœuf",
        "saumon",
        "thon",
        "jambon",
        "porc",
        "veau",
      ],
      "Charcuterie et traiteur": [
        "saucisson",
        "pâté",
        "rillettes",
        "jambon cru",
      ],
      Surgelés: ["légumes surgelés", "glaces", "poisson surgelé"],
      "Épicerie sucrée": [
        "sucre",
        "chocolat",
        "miel",
        "confiture",
        "pâte à tartiner",
      ],
      "Épicerie salée": [
        "sel",
        "poivre",
        "huile",
        "vinaigre",
        "pâtes",
        "riz",
        "farine",
      ],
      Boissons: ["eau", "jus", "soda", "vin", "bière"],
      "Pains et pâtisseries": ["pain", "baguette", "croissant", "brioche"],
      "Bio et écologie": ["produits bio", "légumes bio"],
      "Entretien et nettoyage": ["lessive", "détergent", "éponge"],
      "Hygiène et beauté": ["shampooing", "savon", "dentifrice"],
      Parapharmacie: ["vitamines", "compléments alimentaires"],
      "Prouits du monde": ["riz basmati", "sauce soja", "curry"],
      "Nutrition et végétal": ["tofu", "lentilles", "quinoa"],
      Autre: ["pour tout ce qui ne correspond à aucune catégorie ci-dessus"],
    };

    const categoryExamples = INGREDIENT_CATEGORIES.map((cat) => {
      const examples = categoryExamplesMap[cat] || [];
      return `"${cat}": ${examples.join(", ")}`;
    }).join("\n");

    const prompt = `Analyse ce texte de liste d'ingrédients et extrais tous les ingrédients avec leurs quantités et unités.

Unités disponibles (utiliser EXACTEMENT ces valeurs): ${unitsList}

Catégories disponibles (utiliser EXACTEMENT ces noms, sans modification):
${categoriesList}

Exemples de correspondance catégorie:
${categoryExamples}

Ingrédients existants (normalisés): ${existingNames || "aucun"}

Texte à analyser:
${text}

Retourne UNIQUEMENT un objet JSON avec deux tableaux (pas de markdown, pas de texte):
{
  "existing": [
    {"name": "nom normalisé en minuscules", "quantity": nombre, "unit": "unité"}
  ],
  "new": [
    {"name": "nom normalisé en minuscules", "quantity": nombre, "unit": "unité", "category": "catégorie EXACTE depuis la liste"}
  ]
}

Règles IMPORTANTES:
1. Si l'ingrédient existe (nom normalisé correspond), mettre dans "existing" (sans category)
2. Si l'ingrédient n'existe pas, mettre dans "new" (avec category OBLIGATOIRE)
3. Quantité manquante = 1
4. Unité manquante = inférer depuis le texte (ex: "200g" -> quantity: 200, unit: "g")
5. Si unité non déterminable = "unité"
6. Normaliser les noms (pluriel -> singulier, minuscules) pour correspondre aux ingrédients existants
7. Catégorie: UTILISER EXACTEMENT un nom de la liste, sans modification. Si incertain, utiliser "Autre"
8. Aucun ingrédient = {"existing": [], "new": []}
9. Format: objet JSON pur, rien d'autre

IMPORTANT: La catégorie doit être EXACTEMENT l'un des noms de la liste, avec les majuscules et accents corrects.`;

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Tu es un assistant expert en parsing de listes d'ingrédients. Tu retournes UNIQUEMENT un objet JSON avec les clés 'existing' et 'new', chaque clé contenant un tableau. Pour les catégories, tu DOIS utiliser EXACTEMENT les noms fournis dans la liste, sans modification. Pas de markdown, pas de texte avant ou après.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenAI API error:", errorData);
      return NextResponse.json(
        {
          error: "Erreur lors de l'analyse du texte. Veuillez réessayer.",
        },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "Aucune réponse de l'API" },
        { status: 500 }
      );
    }

    // Parse the JSON response
    let parsedIngredients;
    try {
      // Remove markdown code blocks if present
      const cleanedContent = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      // Try to parse as JSON
      let jsonData;
      try {
        jsonData = JSON.parse(cleanedContent);
      } catch {
        // If direct parse fails, try to extract JSON array from text
        const arrayMatch = cleanedContent.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          jsonData = JSON.parse(arrayMatch[0]);
        } else {
          throw new Error("No valid JSON found");
        }
      }

      // Handle the response format
      if (Array.isArray(jsonData)) {
        // Legacy format - convert to new format
        parsedIngredients = {
          existing: [],
          new: jsonData,
        };
      } else {
        parsedIngredients = {
          existing: jsonData.existing || jsonData.existingIngredients || [],
          new: jsonData.new || jsonData.newIngredients || [],
        };
      }
    } catch (parseError) {
      console.error(
        "Error parsing OpenAI response:",
        parseError,
        "Content:",
        content
      );
      return NextResponse.json(
        {
          error:
            "Erreur lors du parsing de la réponse. Veuillez réessayer avec un format différent.",
        },
        { status: 500 }
      );
    }

    // Validate and process existing ingredients
    const validatedExisting = (parsedIngredients.existing || [])
      .filter((ing: any) => ing.name && ing.quantity && ing.unit)
      .map((ing: any) => {
        const normalizedName = String(ing.name).trim().toLowerCase();
        const existingIng = ingredientMap.get(normalizedName);

        if (!existingIng) {
          // If not found, move to new
          return null;
        }

        return {
          ingredientId: existingIng.id,
          name: existingIng.name,
          quantity: parseFloat(ing.quantity) || 1,
          unit: INGREDIENT_UNITS.includes(ing.unit as any)
            ? ing.unit
            : existingIng.defaultUnit || "unité",
        };
      })
      .filter((ing: any) => ing !== null);

    // Validate and process new ingredients
    const validatedNew = (parsedIngredients.new || [])
      .filter((ing: any) => ing.name && ing.quantity && ing.unit)
      .map((ing: any) => {
        const normalizedName = String(ing.name).trim().toLowerCase();

        // Double-check it doesn't exist
        if (ingredientMap.has(normalizedName)) {
          // Move to existing
          const existingIng = ingredientMap.get(normalizedName)!;
          return {
            ingredientId: existingIng.id,
            name: existingIng.name,
            quantity: parseFloat(ing.quantity) || 1,
            unit: INGREDIENT_UNITS.includes(ing.unit as any)
              ? ing.unit
              : existingIng.defaultUnit || "unité",
          };
        }

        // Validate and normalize category - try to find a match (case-insensitive)
        let category = "Autre";
        if (ing.category) {
          const categoryStr = String(ing.category).trim();
          // Try exact match first
          if (INGREDIENT_CATEGORIES.includes(categoryStr as any)) {
            category = categoryStr;
          } else {
            // Try case-insensitive match
            const matchedCategory = INGREDIENT_CATEGORIES.find(
              (cat) => cat.toLowerCase() === categoryStr.toLowerCase()
            );
            if (matchedCategory) {
              category = matchedCategory;
            } else {
              // Log for debugging
              console.log(
                `Category mismatch: "${categoryStr}" not found, using "Autre" for ingredient "${normalizedName}"`
              );
            }
          }
        }

        return {
          name: normalizedName,
          quantity: parseFloat(ing.quantity) || 1,
          unit: INGREDIENT_UNITS.includes(ing.unit as any) ? ing.unit : "unité",
          category,
        };
      });

    // Separate new ingredients that were actually found as existing
    const newAsExisting = validatedNew.filter((ing: any) => ing.ingredientId);
    const trulyNew = validatedNew.filter((ing: any) => !ing.ingredientId);
    const finalExisting = [...validatedExisting, ...newAsExisting];

    return NextResponse.json(
      {
        existing: finalExisting,
        new: trulyNew,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de l'analyse des ingrédients:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'analyse" },
      { status: 500 }
    );
  }
}
