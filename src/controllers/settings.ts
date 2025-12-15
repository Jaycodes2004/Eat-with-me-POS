// import { Request, Response } from 'express';

// export async function getSettings(req: Request, res: Response) {
//   const prisma = (req as any).prisma;
//   const tenantId = (req as any).tenant?.restaurantId;
//   if (!prisma) {
//     console.error('[Settings] Missing tenant prisma client', { tenantId });
//     return res.status(500).json({ error: 'Tenant database not available' });
//   }
//   try {
//     console.info('[Settings] Fetch request received', { tenantId });
//     const restaurant = await prisma.restaurant.findFirst();
//     if (restaurant) {
//       console.info('[Settings] Fetch success', { tenantId, id: restaurant.id });
//       res.json(restaurant);
//     } else {
//       console.warn('[Settings] Fetch found no record', { tenantId });
//       res.status(404).json({ error: 'Restaurant settings not found' });
//     }
//   } catch (error) {
//     console.error('[Settings] Fetch failed', {
//       tenantId,
//       message: (error as Error)?.message,
//       stack: (error as Error)?.stack,
//     });
//     res.status(500).json({ error: 'Failed to fetch settings' });
//   }
// }

// export async function updateSettings(req: Request, res: Response) {
//   const prisma = (req as any).prisma;
//   const tenantId = (req as any).tenant?.restaurantId;
//   const tenant = (req as any).tenant;
//   if (!prisma) {
//     console.error('[Settings] Missing tenant prisma client', { tenantId });
//     return res.status(500).json({ error: 'Tenant database not available' });
//   }
//   try {
//     console.info('[Settings] Update request received', {
//       tenantId,
//       fields: Object.keys(req.body ?? {}),
//     });
//     const incoming = req.body ?? {};
//     const sanitized: Record<string, unknown> = {};

//     Object.entries(incoming).forEach(([key, value]) => {
//       if (key === 'id') {
//         return;
//       }

//       if (value === undefined) {
//         return;
//       }

//       if (key === 'name') {
//         if (typeof value === 'string' && value.trim().length > 0) {
//           sanitized.name = value.trim();
//         }
//         return;
//       }

//       if (value === null) {
//         sanitized[key] = null;
//         return;
//       }

//       sanitized[key] = value;
//     });

//     const existingRestaurant = await prisma.restaurant.findFirst();

//     if (!existingRestaurant) {
//       const fallbackName = (typeof incoming.name === 'string' && incoming.name.trim().length > 0)
//         ? incoming.name.trim()
//         : (tenant?.name ?? 'My Restaurant');

//       const createData: Record<string, unknown> = {
//         id: tenant?.restaurantId,
//         name: fallbackName,
//         ...sanitized,
//       };

//       if (!createData.name || (typeof createData.name === 'string' && createData.name.trim().length === 0)) {
//         createData.name = fallbackName;
//       }

//       if (createData.currency === undefined) {
//         createData.currency = 'INR';
//       }

//       if (createData.currencySymbol === undefined) {
//         createData.currencySymbol = '₹';
//       }

//       if (createData.notifications === undefined) {
//         createData.notifications = true;
//       }

//       if (createData.autoBackup === undefined) {
//         createData.autoBackup = false;
//       }

//       const created = await prisma.restaurant.create({ data: createData as any });
//       console.info('[Settings] Update created new record', { tenantId, id: created.id });
//       return res.status(201).json(created);
//     }

//     const updatedSettings = await prisma.restaurant.update({
//       where: { id: existingRestaurant.id },
//       data: sanitized,
//     });
//     console.info('[Settings] Update success', { tenantId, id: updatedSettings.id });
//     res.json(updatedSettings);
//   } catch (error) {
//     console.error('[Settings] Update failed', {
//       tenantId,
//       message: (error as Error)?.message,
//       stack: (error as Error)?.stack,
//     });
//     res.status(500).json({ error: 'Failed to update settings' });
//   }
// }



/** @format */

import { Request, Response } from 'express';
import { getTenantPrisma } from '../middleware/tenantPrisma';

export async function getSettings(req: Request, res: Response) {
  try {
    const prisma = getTenantPrisma(req);

    const restaurant = await prisma.restaurant.findFirst();

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    return res.json({
      success: true,
      data: {
        restaurantName: restaurant.name,
        country: restaurant.country,
        currency: restaurant.currency,
        currencySymbol: restaurant.currencySymbol,
        businessAddress: restaurant.address,
        businessPhone: restaurant.phone,
        businessEmail: restaurant.email,
        whatsappApiKey: restaurant.whatsappApiKey,
        whatsappPhoneNumber: restaurant.whatsappPhoneNumber,
        notifications: restaurant.notifications,
        autoBackup: restaurant.autoBackup,
        theme: restaurant.theme,

        // Plan linkage for permissions
        planId: restaurant.planId || null,
      },
    });
  } catch (error: any) {
    console.error('[Settings] getSettings error', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load settings',
      error: error.message,
    });
  }
}

export async function updateSettings(req: Request, res: Response) {
  try {
    const prisma = getTenantPrisma(req);

    const {
      restaurantName,
      country,
      currency,
      currencySymbol,
      businessAddress,
      businessPhone,
      businessEmail,
      whatsappApiKey,
      whatsappPhoneNumber,
      notifications,
      autoBackup,
      theme,
      // planId intentionally not updatable from here for now
    } = req.body;

    const restaurant = await prisma.restaurant.findFirst();

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    const updated = await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: {
        name: restaurantName ?? restaurant.name,
        country: country ?? restaurant.country,
        currency: currency ?? restaurant.currency,
        currencySymbol: currencySymbol ?? restaurant.currencySymbol,
        address: businessAddress ?? restaurant.address,
        phone: businessPhone ?? restaurant.phone,
        email: businessEmail ?? restaurant.email,
        whatsappApiKey: whatsappApiKey ?? restaurant.whatsappApiKey,
        whatsappPhoneNumber:
          whatsappPhoneNumber ?? restaurant.whatsappPhoneNumber,
        notifications:
          typeof notifications === 'boolean'
            ? notifications
            : restaurant.notifications,
        autoBackup:
          typeof autoBackup === 'boolean'
            ? autoBackup
            : restaurant.autoBackup,
        theme: theme ?? restaurant.theme,
      },
    });

    return res.json({
      success: true,
      message: 'Settings updated successfully',
      data: {
        restaurantName: updated.name,
        country: updated.country,
        currency: updated.currency,
        currencySymbol: updated.currencySymbol,
        businessAddress: updated.address,
        businessPhone: updated.phone,
        businessEmail: updated.email,
        whatsappApiKey: updated.whatsappApiKey,
        whatsappPhoneNumber: updated.whatsappPhoneNumber,
        notifications: updated.notifications,
        autoBackup: updated.autoBackup,
        theme: updated.theme,
        planId: updated.planId || null,
      },
    });
  } catch (error: any) {
    console.error('[Settings] updateSettings error', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: error.message,
    });
  }
}
