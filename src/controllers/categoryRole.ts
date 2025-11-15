// src/controllers/categoryRole.ts

import { Request, Response } from 'express';

export async function getCategoriesAndRoles(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  const tenantId = (req as any).tenant?.restaurantId;
  if (!prisma) {
    console.error('[Categories/Roles] Missing tenant prisma client', { tenantId });
    return res.status(500).json({ error: 'Tenant database not available' });
  }

  try {
    console.info('[Categories/Roles] Fetch request received', { tenantId });
    const [categories, roles] = await Promise.all([
      prisma.category.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.role.findMany({ orderBy: { createdAt: 'desc' } }),
    ]);
    console.info('[Categories/Roles] Fetch success', {
      tenantId,
      categoryCount: categories.length,
      roleCount: roles.length,
    });
    res.json({ categories, roles });
  } catch (error) {
    console.error('[Categories/Roles] Fetch failed', {
      tenantId,
      message: (error as Error)?.message,
      stack: (error as Error)?.stack,
    });
    res.status(500).json({ error: 'Failed to fetch categories and roles' });
  }
}

// ---- Categories ----

export async function getCategories(req: Request, res: Response) {
  // FIX: Use the tenant-specific prisma client from the request
  const prisma = (req as any).prisma;
  const tenantId = (req as any).tenant?.restaurantId;
  try {
    const { type } = req.query;
    const where = type ? { type: type as string } : {};
    console.info('[Categories] List request received', {
      tenantId,
      type: type ?? 'all',
    });
    const cats = await prisma.category.findMany({ where, orderBy: { createdAt: 'desc' } });
    console.info('[Categories] List success', {
      tenantId,
      type: type ?? 'all',
      count: cats.length,
    });
    res.json(cats);
  } catch (error) {
    console.error('[Categories] List failed', {
      tenantId,
      message: (error as Error)?.message,
      stack: (error as Error)?.stack,
    });
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
}

export async function createCategory(req: Request, res: Response) {
  // FIX: Use the tenant-specific prisma client from the request
  const prisma = (req as any).prisma;
  const tenantId = (req as any).tenant?.restaurantId;
  try {
    const { name, description, color, type, isActive } = req.body;

    const trimmedName = typeof name === 'string' ? name.trim() : '';
    const rawType = typeof type === 'string' ? type.trim().toLowerCase() : '';
    const allowedTypes = new Set(['menu', 'expense', 'inventory', 'supplier']);

    if (!trimmedName) {
      console.warn('[Categories] Create missing name', { tenantId, providedName: name });
      return res.status(400).json({ error: 'Category name is required' });
    }

    if (!rawType || !allowedTypes.has(rawType)) {
      console.warn('[Categories] Create invalid type', { tenantId, providedType: type });
      return res.status(400).json({ error: 'Category type is invalid' });
    }

    const normalizedColor = typeof color === 'string' && color.trim().length > 0
      ? color.trim()
      : undefined;

    const data: Record<string, unknown> = {
      name: trimmedName,
      type: rawType,
      isActive: typeof isActive === 'boolean' ? isActive : true,
    };

    if (description !== undefined) {
      data.description = description;
    }

    if (normalizedColor) {
      data.color = normalizedColor;
    }

    console.info('[Categories] Create request received', {
      tenantId,
      name: trimmedName,
      type: rawType,
    });
    const cat = await prisma.category.create({
      data,
    });
    console.info('[Categories] Create success', {
      tenantId,
      id: cat.id,
      name: cat.name,
      type: cat.type,
    });
    res.status(201).json(cat);
  } catch (error) {
    console.error('[Categories] Create failed', {
      tenantId,
      message: (error as Error)?.message,
      stack: (error as Error)?.stack,
    });
    res.status(500).json({ error: 'Failed to create category' });
  }
}

export async function updateCategory(req: Request, res: Response) {
  // FIX: Use the tenant-specific prisma client from the request
  const prisma = (req as any).prisma;
  try {
    const { id } = req.params;
    const data = req.body;
    const tenantId = (req as any).tenant?.restaurantId;
    console.info('[Categories] Update request received', {
      tenantId,
      id,
      fields: Object.keys(data),
    });
    const cat = await prisma.category.update({ where: { id }, data });
    console.info('[Categories] Update success', {
      tenantId,
      id: cat.id,
      name: cat.name,
    });
    res.json(cat);
  } catch (error) {
    console.error('[Categories] Update failed', {
      tenantId: (req as any).tenant?.restaurantId,
      id: req.params.id,
      message: (error as Error)?.message,
      stack: (error as Error)?.stack,
    });
    res.status(500).json({ error: 'Failed to update category' });
  }
}

export async function deleteCategory(req: Request, res: Response) {
  // FIX: Use the tenant-specific prisma client from the request
  const prisma = (req as any).prisma;
  try {
    const { id } = req.params;
    const tenantId = (req as any).tenant?.restaurantId;
    console.info('[Categories] Delete request received', { tenantId, id });
    await prisma.category.delete({ where: { id } });
    console.info('[Categories] Delete success', { tenantId, id });
    res.json({ deleted: true });
  } catch (error) {
    console.error('[Categories] Delete failed', {
      tenantId: (req as any).tenant?.restaurantId,
      id: req.params.id,
      message: (error as Error)?.message,
      stack: (error as Error)?.stack,
    });
    res.status(500).json({ error: 'Failed to delete category' });
  }
}

// ---- Roles ----

export async function getRoles(req: Request, res: Response) {
  // FIX: Use the tenant-specific prisma client from the request
  const prisma = (req as any).prisma;
  try {
    const tenantId = (req as any).tenant?.restaurantId;
    console.info('[Roles] List request received', { tenantId });
    const roles = await prisma.role.findMany({ orderBy: { createdAt: 'desc' } });
    console.info('[Roles] List success', { tenantId, count: roles.length });
    res.json(roles);
  } catch (error) {
    console.error('[Roles] List failed', {
      tenantId: (req as any).tenant?.restaurantId,
      message: (error as Error)?.message,
      stack: (error as Error)?.stack,
    });
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
}

export const createRole = async (req: Request, res: Response) => {
  const prisma = (req as any).prisma;
  const { name, permissions } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Role name is required.' });
  }

  // --- THIS IS THE FIX ---
  // Validate that permissions is an array, defaulting to an empty one if not provided.
  if (permissions && !Array.isArray(permissions)) {
    return res.status(400).json({ error: 'Permissions must be an array of strings.' });
  }
  // --- END OF FIX ---

  try {
    const newRole = await prisma.role.create({
      // Ensure we always save an array
      data: { name, permissions: permissions || [] },
    });
    res.status(201).json(newRole);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'A role with this name already exists.' });
    }
    console.error('Error creating role:', error);
    res.status(500).json({ error: 'Failed to create role.' });
  }
};

export const updateRole = async (req: Request, res: Response) => {
    const prisma = (req as any).prisma;
    const { id } = req.params;
    const { name, permissions } = req.body;

    // --- THIS IS THE FIX ---
    // Validate that permissions is an array if it's being updated.
    if (permissions && !Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Permissions must be an array of strings.' });
    }
    // --- END OF FIX ---

    try {
    const tenantId = (req as any).tenant?.restaurantId;
    console.info('[Roles] Update request received', { tenantId, id, fields: Object.keys(req.body) });
        const updatedRole = await prisma.role.update({
            where: { id },
            data: { name, permissions },
        });
    console.info('[Roles] Update success', { tenantId, id });
        res.json(updatedRole);
    } catch (error: any) {
    console.error('[Roles] Update failed', {
      tenantId: (req as any).tenant?.restaurantId,
      id,
      message: error?.message,
      stack: error?.stack,
    });
        res.status(500).json({ error: 'Failed to update role.' });
    }
};

export async function deleteRole(req: Request, res: Response) {
  // FIX: Use the tenant-specific prisma client from the request
  const prisma = (req as any).prisma;
  try {
    const { id } = req.params;
    const tenantId = (req as any).tenant?.restaurantId;
    console.info('[Roles] Delete request received', { tenantId, id });
    await prisma.role.delete({ where: { id } });
    console.info('[Roles] Delete success', { tenantId, id });
    res.json({ deleted: true });
  } catch (error) {
    console.error('[Roles] Delete failed', {
      tenantId: (req as any).tenant?.restaurantId,
      id: req.params.id,
      message: (error as Error)?.message,
      stack: (error as Error)?.stack,
    });
    res.status(500).json({ error: 'Failed to delete role' });
  }
}
