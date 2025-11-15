import { Request, Response } from 'express';

const mapRecipeRecord = (record: any) => ({
  id: record.id,
  menuItemId: record.menuItemId,
  menuItemName: record.menuItem?.name ?? null,
  ingredients: Array.isArray(record.ingredients) ? record.ingredients : [],
  yield: Number(record.yield ?? 1),
  cost: Number(record.cost ?? 0),
  preparationTime: record.preparationTime ?? null,
  instructions: Array.isArray(record.instructions) ? record.instructions : [],
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});

export async function getAllRecipes(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  if (!prisma) {
    return res.status(500).json({ error: 'Tenant database not available' });
  }

  try {
    const recipes = await prisma.recipe.findMany({
      include: { menuItem: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(recipes.map(mapRecipeRecord));
  } catch (error) {
    console.error('[Recipe] Fetch all error', error);
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
}

export async function createRecipe(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  if (!prisma) {
    return res.status(500).json({ error: 'Tenant database not available' });
  }

  try {
  const { menuItemId, ingredients, cost, preparationTime, instructions } = req.body;
  const recipeYield = req.body?.['yield'];

    const recipe = await prisma.recipe.create({
      data: {
        menuItemId: menuItemId || null,
        ingredients: ingredients ?? [],
  yield: recipeYield ?? 1,
        cost: cost ?? 0,
        preparationTime: preparationTime ?? null,
        instructions: instructions ?? [],
      },
      include: { menuItem: true },
    });

    res.status(201).json(mapRecipeRecord(recipe));
  } catch (error) {
    console.error('[Recipe] Create error', error);
    res.status(500).json({ error: 'Failed to create recipe' });
  }
}

export async function updateRecipe(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  if (!prisma) {
    return res.status(500).json({ error: 'Tenant database not available' });
  }

  const { id } = req.params;
  try {
    const recipe = await prisma.recipe.update({
      where: { id },
      data: {
        menuItemId: req.body.menuItemId ?? undefined,
        ingredients: req.body.ingredients ?? undefined,
  yield: req.body?.['yield'] ?? undefined,
        cost: req.body.cost ?? undefined,
        preparationTime: req.body.preparationTime ?? undefined,
        instructions: req.body.instructions ?? undefined,
      },
      include: { menuItem: true },
    });

    res.json(mapRecipeRecord(recipe));
  } catch (error) {
    console.error('[Recipe] Update error', error);
    res.status(500).json({ error: 'Failed to update recipe' });
  }
}

export async function deleteRecipe(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  if (!prisma) {
    return res.status(500).json({ error: 'Tenant database not available' });
  }

  const { id } = req.params;
  try {
    await prisma.recipe.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('[Recipe] Delete error', error);
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
}
