import { Request, Response } from 'express';

export async function getSettings(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  const tenantId = (req as any).tenant?.restaurantId;
  if (!prisma) {
    console.error('[Settings] Missing tenant prisma client', { tenantId });
    return res.status(500).json({ error: 'Tenant database not available' });
  }
  try {
    console.info('[Settings] Fetch request received', { tenantId });
    const restaurant = await prisma.restaurant.findFirst();
    if (restaurant) {
      console.info('[Settings] Fetch success', { tenantId, id: restaurant.id });
      res.json(restaurant);
    } else {
      console.warn('[Settings] Fetch found no record', { tenantId });
      res.status(404).json({ error: 'Restaurant settings not found' });
    }
  } catch (error) {
    console.error('[Settings] Fetch failed', {
      tenantId,
      message: (error as Error)?.message,
      stack: (error as Error)?.stack,
    });
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
}

export async function updateSettings(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  const tenantId = (req as any).tenant?.restaurantId;
  const tenant = (req as any).tenant;
  if (!prisma) {
    console.error('[Settings] Missing tenant prisma client', { tenantId });
    return res.status(500).json({ error: 'Tenant database not available' });
  }
  try {
    console.info('[Settings] Update request received', {
      tenantId,
      fields: Object.keys(req.body ?? {}),
    });
    const incoming = req.body ?? {};
    const sanitized: Record<string, unknown> = {};

    Object.entries(incoming).forEach(([key, value]) => {
      if (key === 'id') {
        return;
      }

      if (value === undefined) {
        return;
      }

      if (key === 'name') {
        if (typeof value === 'string' && value.trim().length > 0) {
          sanitized.name = value.trim();
        }
        return;
      }

      if (value === null) {
        sanitized[key] = null;
        return;
      }

      sanitized[key] = value;
    });

    const existingRestaurant = await prisma.restaurant.findFirst();

    if (!existingRestaurant) {
      const fallbackName = (typeof incoming.name === 'string' && incoming.name.trim().length > 0)
        ? incoming.name.trim()
        : (tenant?.name ?? 'My Restaurant');

      const createData: Record<string, unknown> = {
        id: tenant?.restaurantId,
        name: fallbackName,
        ...sanitized,
      };

      if (!createData.name || (typeof createData.name === 'string' && createData.name.trim().length === 0)) {
        createData.name = fallbackName;
      }

      if (createData.currency === undefined) {
        createData.currency = 'INR';
      }

      if (createData.currencySymbol === undefined) {
        createData.currencySymbol = '₹';
      }

      if (createData.notifications === undefined) {
        createData.notifications = true;
      }

      if (createData.autoBackup === undefined) {
        createData.autoBackup = false;
      }

      const created = await prisma.restaurant.create({ data: createData as any });
      console.info('[Settings] Update created new record', { tenantId, id: created.id });
      return res.status(201).json(created);
    }

    const updatedSettings = await prisma.restaurant.update({
      where: { id: existingRestaurant.id },
      data: sanitized,
    });
    console.info('[Settings] Update success', { tenantId, id: updatedSettings.id });
    res.json(updatedSettings);
  } catch (error) {
    console.error('[Settings] Update failed', {
      tenantId,
      message: (error as Error)?.message,
      stack: (error as Error)?.stack,
    });
    res.status(500).json({ error: 'Failed to update settings' });
  }
}
