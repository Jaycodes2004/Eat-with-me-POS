import { Request, Response } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

type BudgetCategoryPayload = {
  name: string;
  description?: string | null;
};

function getPrismaOr500(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  if (!prisma) {
    res.status(500).json({ error: 'Tenant database not available' });
    return null;
  }
  return prisma;
}

export async function getBudgetCategories(req: Request, res: Response) {
  const prisma = getPrismaOr500(req, res);
  if (!prisma) return;

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
  const prisma = getPrismaOr500(req, res);
  if (!prisma) return;

  const { name, description }: BudgetCategoryPayload = req.body || {};
  if (!name?.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    const category = await prisma.budgetCategory.create({
      data: { name: name.trim(), description: description ?? null },
    });
    res.status(201).json(category);
  } catch (error: any) {
    console.error('[Budget] Create category error', error);
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ error: 'Category name already exists' });
    }
    res.status(500).json({ error: 'Failed to create budget category' });
  }
}

export async function updateBudgetCategory(req: Request, res: Response) {
  const prisma = getPrismaOr500(req, res);
  if (!prisma) return;

  const { id } = req.params;
  const { name, description }: BudgetCategoryPayload = req.body || {};
  if (!id) return res.status(400).json({ error: 'Missing id' });

  const data: Record<string, any> = {};
  if (name !== undefined) {
    if (!name.trim()) return res.status(400).json({ error: 'Name cannot be empty' });
    data.name = name.trim();
  }
  if (description !== undefined) data.description = description ?? null;

  try {
    const category = await prisma.budgetCategory.update({
      where: { id },
      data,
    });
    res.json(category);
  } catch (error: any) {
    console.error('[Budget] Update category error', error);
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2025') return res.status(404).json({ error: 'Category not found' });
      if (error.code === 'P2002')
        return res.status(409).json({ error: 'Category name already exists' });
    }
    res.status(500).json({ error: 'Failed to update budget category' });
  }
}

export async function deleteBudgetCategory(req: Request, res: Response) {
  const prisma = getPrismaOr500(req, res);
  if (!prisma) return;

  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  try {
    await prisma.budgetCategory.delete({ where: { id } });
    res.status(204).send();
  } catch (error: any) {
    console.error('[Budget] Delete category error', error);
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2025') return res.status(404).json({ error: 'Category not found' });
      if (error.code === 'P2003')
        return res
          .status(409)
          .json({ error: 'Category is in use and cannot be deleted' });
    }
    res.status(500).json({ error: 'Failed to delete budget category' });
  }
}
