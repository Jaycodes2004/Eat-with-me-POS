import { Request, Response } from 'express';

export async function getBudgetCategories(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  if (!prisma) {
    return res.status(500).json({ error: 'Tenant database not available' });
  }

  try {
    const categories = await prisma.budgetCategory.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch (error) {
    console.error('[Budget] Fetch categories error', error);
    res.status(500).json({ error: 'Failed to fetch budget categories' });
  }
}

export async function createBudgetCategory(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  if (!prisma) {
    return res.status(500).json({ error: 'Tenant database not available' });
  }

  try {
    const category = await prisma.budgetCategory.create({ data: req.body });
    res.status(201).json(category);
  } catch (error) {
    console.error('[Budget] Create category error', error);
    res.status(500).json({ error: 'Failed to create budget category' });
  }
}

export async function updateBudgetCategory(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  if (!prisma) {
    return res.status(500).json({ error: 'Tenant database not available' });
  }

  const { id } = req.params;
  try {
    const category = await prisma.budgetCategory.update({
      where: { id },
      data: req.body,
    });
    res.json(category);
  } catch (error) {
    console.error('[Budget] Update category error', error);
    res.status(500).json({ error: 'Failed to update budget category' });
  }
}

export async function deleteBudgetCategory(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  if (!prisma) {
    return res.status(500).json({ error: 'Tenant database not available' });
  }

  const { id } = req.params;
  try {
    await prisma.budgetCategory.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('[Budget] Delete category error', error);
    res.status(500).json({ error: 'Failed to delete budget category' });
  }
}
